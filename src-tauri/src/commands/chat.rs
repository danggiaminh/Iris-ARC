use serde::Serialize;
use tauri::Emitter;
use tokio_util::sync::CancellationToken;

use crate::error::AppError;
use crate::openrouter::{self, ChatMessage, FileAttachment};
use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct StreamChunkPayload {
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StreamErrorPayload {
    pub error: String,
    pub code: u16,
}

#[tauri::command]
pub async fn send_message(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    messages: Vec<ChatMessage>,
    model: String,
    attachments: Option<Vec<FileAttachment>>,
) -> Result<(), String> {
    let api_key = match state.get_api_key() {
        Ok(key) => key,
        Err(err) => {
            emit_error(&app, err);
            return Ok(());
        }
    };

    let cancel_token = CancellationToken::new();
    {
        let mut stored = state.cancel_token.lock().await;
        *stored = cancel_token.clone();
    }

    let attachments = attachments.unwrap_or_default();
    let messages = match openrouter::build_messages(messages, attachments) {
        Ok(messages) => messages,
        Err(err) => {
            emit_error(&app, err);
            return Ok(());
        }
    };

    let result = openrouter::stream_chat_completion(
        &state.http_client,
        &api_key,
        &model,
        messages,
        |token| {
            app.emit("stream-chunk", StreamChunkPayload { content: token })
                .map_err(|e| e.to_string())
        },
        cancel_token.clone(),
    )
    .await;

    match result {
        Ok(()) => {
            let _ = app.emit("stream-done", ());
        }
        Err(err) => {
            emit_error(&app, err);
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn cancel_stream(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let token = state.cancel_token.lock().await;
    token.cancel();
    Ok(())
}

fn emit_error(app: &tauri::AppHandle, err: AppError) {
    let payload = StreamErrorPayload {
        error: err.error,
        code: err.code,
    };
    let _ = app.emit("stream-error", payload);
}

