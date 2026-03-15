use reqwest::Client;
use std::sync::Arc;
use std::sync::RwLock;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;

use crate::error::AppError;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub display_name: String,
    pub provider: String,
}

/// Type alias for the model cache: a list of models paired with the time they were cached.
type ModelCache = Option<(Vec<ModelInfo>, Instant)>;

pub struct AppState {
    pub api_key: Arc<RwLock<String>>,
    pub http_client: Client,
    pub cancel_token: Arc<Mutex<CancellationToken>>,
    pub model_cache: Arc<Mutex<ModelCache>>,
}

impl AppState {
    /// Create a new AppState with connection pooling and proper timeouts.
    pub fn new(api_key: String) -> Result<Self, AppError> {
        let http_client = Client::builder()
            .connect_timeout(Duration::from_secs(10))
            .timeout(Duration::from_secs(120))
            .pool_max_idle_per_host(5)
            .pool_idle_timeout(Duration::from_secs(90))
            .build()
            .map_err(|e| AppError::internal(format!("Failed to build HTTP client: {}", e)))?;

        Ok(Self {
            api_key: Arc::new(RwLock::new(api_key)),
            http_client,
            cancel_token: Arc::new(Mutex::new(CancellationToken::new())),
            model_cache: Arc::new(Mutex::new(None)),
        })
    }

    /// Read the API key from state, trimmed. Returns Err if empty.
    pub fn get_api_key(&self) -> Result<String, AppError> {
        let key = self
            .api_key
            .read()
            .map_err(|e| AppError::internal(format!("Failed to read API key: {}", e)))?;
        let trimmed = key.trim().to_string();
        if trimmed.is_empty() {
            Err(AppError::new(0, "API key is not configured"))
        } else {
            Ok(trimmed)
        }
    }
}
