use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Router,
};
use reqwest::Client;
use serde_json::Value;
use std::env;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

pub async fn start_axum_server() {
    let _ = dotenvy::dotenv();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);

    let app = Router::new()
        .route("/api/chat", post(chat_handler))
        .layer(cors);

    let target_addr: SocketAddr = "127.0.0.1:3000".parse().unwrap();
    
    // Spawn server inside the tokio runtime
    let listener = tokio::net::TcpListener::bind(&target_addr).await.unwrap();
    println!("Axum proxy server listening on http://{}", target_addr);
    
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Axum proxy server error: {}", e);
    }
}

async fn chat_handler(Json(payload): Json<Value>) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Read securely from backend system environment / .env
    let api_key = env::var("CEREBRAS_API_KEY")
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Missing CEREBRAS_API_KEY in backend process".into()))?;

    let client = Client::new();
    
    let response = client
        .post("https://api.cerebras.ai/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, format!("Failed to reach Cerebras: {}", e)))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err((StatusCode::BAD_GATEWAY, format!("Upstream error: {}", err_text)));
    }

    let json_data: Value = response
        .json()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to parse JSON: {}", e)))?;

    Ok(Json(json_data))
}
