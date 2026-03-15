use serde::Serialize;
use std::fmt;

/// Unified application error type for IrisARC.
#[derive(Debug, Clone, Serialize)]
pub struct AppError {
    pub error: String,
    pub code: u16,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.error)
    }
}

impl std::error::Error for AppError {}

impl AppError {
    pub fn new(code: u16, error: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            code,
        }
    }

    pub fn internal(error: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            code: 0,
        }
    }

    pub fn bad_request(error: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            code: 400,
        }
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        if e.is_connect() || e.is_timeout() {
            Self::new(0, "Could not connect. Check your internet connection.")
        } else {
            Self::new(0, format!("Network error: {}", e))
        }
    }
}
