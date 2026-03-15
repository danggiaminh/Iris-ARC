use crate::state::{AppState, ModelInfo};

fn allowed_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "qwen-3-235b-a22b-instruct-2507".into(),
            display_name: "Qwen-3-235B".into(),
            provider: "cerebras".into(),
        },
    ]
}

#[tauri::command]
pub async fn get_models(_state: tauri::State<'_, AppState>) -> Result<Vec<ModelInfo>, String> {
    Ok(allowed_models())
}
