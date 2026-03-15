use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::error::AppError;
use crate::state::ModelInfo;

const CEREBRAS_CHAT_URL: &str = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODELS_URL: &str = "https://api.cerebras.ai/v1/models";
const MAX_IMAGE_BYTES: usize = 10 * 1024 * 1024;
/// Number of retry attempts for transient errors.
const MAX_RETRIES: u32 = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: serde_json::Value,
}

/// Attachment payload from the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAttachment {
    pub filename: String,
    pub mime_type: String,
    /// For images: base64 data URL (data:image/png;base64,...).
    /// For text/code/PDF: the text content of the file.
    pub data: String,
    /// Whether this is an image attachment (uses image_url format).
    pub is_image: bool,
}

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
    temperature: f32,
    stream: bool,
}

#[derive(Debug, Deserialize)]
pub struct SseChoice {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delta: Option<SseDelta>,
}

#[derive(Debug, Deserialize)]
pub struct SseDelta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SseChunk {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub choices: Option<Vec<SseChoice>>,
}

#[derive(Debug, Deserialize)]
struct ModelsResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<Vec<ModelEntry>>,
}

#[derive(Debug, Deserialize)]
struct ModelEntry {
    id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
}

fn auth_header(api_key: &str) -> Result<String, AppError> {
    let mut stripped = api_key.trim();
    while let Some(rest) = stripped.strip_prefix("Bearer ") {
        stripped = rest.trim();
    }
    if stripped.is_empty() {
        return Err(AppError::new(0, "API key is not configured."));
    }
    Ok(format!("Bearer {}", stripped))
}

fn validate_data_url(data_url: &str) -> Result<String, AppError> {
    let (meta, data) = data_url
        .split_once(',')
        .ok_or_else(|| AppError::bad_request("Invalid data URL."))?;

    let meta = meta
        .strip_prefix("data:")
        .ok_or_else(|| AppError::bad_request("Invalid data URL."))?;

    let mut parts = meta.split(';');
    // Safe: split always yields at least one element
    let mime = parts.next().unwrap_or("");
    let is_base64 = parts.any(|p| p == "base64");

    let valid_mimes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if !valid_mimes.contains(&mime) {
        return Err(AppError::new(415, "Unsupported image type."));
    }

    if !is_base64 {
        return Err(AppError::bad_request("Invalid data URL encoding."));
    }

    let data = data.trim();
    let padding = data.chars().rev().take_while(|c| *c == '=').count();
    let decoded_len = (data.len() * 3) / 4 - padding;

    if decoded_len > MAX_IMAGE_BYTES {
        return Err(AppError::new(413, "Image exceeds 10MB limit."));
    }

    Ok(mime.to_string())
}

/// Build the messages array, embedding file attachments in the OpenRouter vision/content format.
/// Images use `image_url` type; text files use `text` type with filename prefix.
pub fn build_messages(
    messages: Vec<ChatMessage>,
    attachments: Vec<FileAttachment>,
) -> Result<Vec<ChatMessage>, AppError> {
    if attachments.is_empty() {
        return Ok(messages);
    }

    let mut result = messages;

    let last_user = result
        .iter_mut()
        .rev()
        .find(|m| m.role == "user")
        .ok_or_else(|| AppError::bad_request("No user message found for attachments."))?;

    let text = match &last_user.content {
        serde_json::Value::String(s) => s.clone(),
        _ => String::new(),
    };

    let mut content_parts: Vec<serde_json::Value> = vec![serde_json::json!({
        "type": "text",
        "text": text,
    })];

    for att in attachments {
        if att.is_image {
            validate_data_url(&att.data)?;
            content_parts.push(serde_json::json!({
                "type": "image_url",
                "image_url": {
                    "url": att.data,
                }
            }));
        } else {
            // Text-based file: include as a text content part with filename context
            content_parts.push(serde_json::json!({
                "type": "text",
                "text": format!("[File: {}]\n{}", att.filename, att.data),
            }));
        }
    }

    last_user.content = serde_json::json!(content_parts);

    Ok(result)
}

/// Checks if an HTTP status code is transient and retryable.
fn is_retryable_status(status: u16) -> bool {
    matches!(status, 429 | 500 | 502 | 503 | 504)
}

/// Stream chat completion from OpenRouter. Returns each token via callback.
/// Streaming requests are NOT retried (only the initial connection is).
pub async fn stream_chat_completion(
    client: &Client,
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage>,
    on_token: impl Fn(String) -> Result<(), String>,
    cancel_token: tokio_util::sync::CancellationToken,
) -> Result<(), AppError> {
    let auth = auth_header(api_key)?;

    let body = ChatCompletionRequest {
        model: model.to_string(),
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
    };

    let response = client
        .post(CEREBRAS_CHAT_URL)
        .header("Authorization", &auth)
        .header("Content-Type", "application/json")
        .header("HTTP-Referer", "http://localhost")
        .header("X-Title", "IrisARC")
        .json(&body)
        .send()
        .await
        .map_err(AppError::from)?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        let code = status.as_u16();
        let message = match code {
            401 => "Your API key is invalid or expired. Check your .env file.".to_string(),
            429 => "Rate limit reached. Please wait before sending another message.".to_string(),
            500 | 503 => {
                "The service is temporarily unavailable. Try again shortly.".to_string()
            }
            _ => {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&error_text) {
                    val.get("error")
                        .and_then(|e| {
                            e.get("message")
                                .and_then(|m| m.as_str())
                                .or_else(|| e.as_str())
                        })
                        .unwrap_or("Unknown API error")
                        .to_string()
                } else {
                    format!("API error ({}): {}", code, error_text)
                }
            }
        };

        return Err(AppError::new(code, message));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    loop {
        tokio::select! {
            _ = cancel_token.cancelled() => {
                return Ok(());
            }
            chunk = stream.next() => {
                match chunk {
                    Some(Ok(bytes)) => {
                        buffer.push_str(&String::from_utf8_lossy(&bytes));

                        while let Some(pos) = buffer.find('\n') {
                            let line = buffer[..pos].trim().to_string();
                            buffer = buffer[pos + 1..].to_string();

                            if line.is_empty() || line.starts_with(':') {
                                continue;
                            }

                            if let Some(data) = line.strip_prefix("data: ") {
                                if data.trim() == "[DONE]" {
                                    return Ok(());
                                }

                                if let Ok(chunk) = serde_json::from_str::<SseChunk>(data) {
                                    if let Some(choices) = chunk.choices {
                                        for choice in choices {
                                            if let Some(delta) = choice.delta {
                                                if let Some(content) = delta.content {
                                                    if !content.is_empty() {
                                                        on_token(content).map_err(|e| AppError::internal(format!("Channel error: {}", e)))?;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Some(Err(e)) => {
                        return Err(AppError::internal(format!("Stream read error: {}", e)));
                    }
                    None => {
                        return Ok(());
                    }
                }
            }
        }
    }
}

/// Fetch the list of models from OpenRouter with retry logic.
/// Retries up to MAX_RETRIES times with exponential backoff for transient errors.
pub async fn fetch_models(client: &Client, api_key: &str) -> Result<Vec<ModelInfo>, AppError> {
    let auth = auth_header(api_key)?;

    let mut last_err = AppError::internal("Unknown error fetching models");

    for attempt in 0..MAX_RETRIES {
        let response = match client
            .get(CEREBRAS_MODELS_URL)
            .header("Authorization", &auth)
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(e) => {
                last_err = AppError::from(e);
                if attempt < MAX_RETRIES - 1 {
                    let delay = Duration::from_secs(1 << attempt);
                    tokio::time::sleep(delay).await;
                }
                continue;
            }
        };

        let status_code = response.status().as_u16();
        if !response.status().is_success() {
            last_err = AppError::new(
                status_code,
                format!("Models API returned status {}", status_code),
            );
            if is_retryable_status(status_code) && attempt < MAX_RETRIES - 1 {
                let delay = Duration::from_secs(1 << attempt);
                tokio::time::sleep(delay).await;
                continue;
            }
            return Err(last_err);
        }

        let body: ModelsResponse = response
            .json()
            .await
            .map_err(|e| AppError::internal(format!("Failed to parse models response: {}", e)))?;

        let models = body
            .data
            .unwrap_or_default()
            .into_iter()
            .map(|m| {
                // Safe: split always yields at least one element
                let provider = m.id.split('/').next().unwrap_or("unknown").to_string();
                ModelInfo {
                    display_name: m.name.unwrap_or_else(|| m.id.clone()),
                    id: m.id,
                    provider,
                }
            })
            .collect();

        return Ok(models);
    }

    Err(last_err)
}
