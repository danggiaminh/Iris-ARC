// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use iris_arc_lib::commands;
use iris_arc_lib::state::AppState;
mod server;

#[tokio::main]
async fn main() {
    dotenvy::from_filename("src-tauri/.env").ok();
    dotenvy::dotenv().ok();

    let api_key = std::env::var("CEREBRAS_API_KEY")
        .expect("CEREBRAS_API_KEY missing");
    let api_key = api_key.trim().to_string();

    if !api_key.is_empty() {
        #[cfg(debug_assertions)]
        println!("API key loaded: {}...", &api_key[..8.min(api_key.len())]);
    } else {
        #[cfg(debug_assertions)]
        println!("No API key found in .env — requests will fail until set.");
        std::process::exit(1);
    }

    let app_state = match AppState::new(api_key) {
        Ok(state) => state,
        Err(err) => {
            eprintln!("Failed to initialize app state: {}", err);
            std::process::exit(1);
        }
    };

    // Fire up local Axum chat proxy
    tokio::spawn(async {
        server::start_axum_server().await;
    });

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::chat::send_message,
            commands::chat::cancel_stream,
            commands::models::get_models,
        ])
        .run(tauri::generate_context!());

    if let Err(err) = result {
        eprintln!("error while running tauri application: {}", err);
    }
}
