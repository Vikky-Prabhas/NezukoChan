use tauri::Manager;

mod anime;
pub mod extractors;
mod proxy;
#[cfg(test)]
mod allanime_test;
#[cfg(test)]
mod debug_quality;
#[cfg(test)]
mod zephyr_test;
#[cfg(test)]
mod provider_test;


use anime::{AnimeResult, Episode, VideoSource};
use extractors::mapping::ProviderMappings;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn search_anime_command(query: String) -> Result<Vec<AnimeResult>, String> {
    anime::search_anime(&query).await
}

#[tauri::command]
async fn search_anitaku_command(query: String) -> Result<Vec<AnimeResult>, String> {
    anime::search_anitaku(&query).await
}

#[tauri::command]
async fn search_awi_command(query: String) -> Result<Vec<AnimeResult>, String> {
    anime::search_awi(&query).await
}

#[tauri::command]
async fn check_anitaku_exists_command(id: String) -> Result<bool, String> {
    anime::check_anitaku_exists(&id).await
}

#[tauri::command]
async fn get_episodes_command(id: String) -> Result<Vec<Episode>, String> {
    anime::get_episodes(&id).await
}

#[tauri::command]
async fn get_anitaku_episodes_command(id: String) -> Result<Vec<Episode>, String> {
    anime::get_anitaku_episodes(&id).await
}

#[tauri::command]
async fn get_awi_episodes_command(id: String) -> Result<Vec<Episode>, String> {
    anime::get_awi_episodes(&id).await
}

#[tauri::command]
async fn get_stream_command(id: String) -> Result<VideoSource, String> {
    anime::get_stream_source(&id).await
}

#[tauri::command]
async fn get_anitaku_stream_command(id: String) -> Result<VideoSource, String> {
    anime::get_anitaku_stream(&id).await
}

#[tauri::command]
async fn get_awi_stream_command(id: String) -> Result<VideoSource, String> {
    anime::get_awi_stream(&id).await
}

#[tauri::command]
async fn get_mappings_command(anilist_id: i32) -> Result<ProviderMappings, String> {
    extractors::mapping::get_mappings(anilist_id).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Start the proxy server in a separate async task
    tauri::async_runtime::spawn(async move {
        proxy::start_proxy_server().await;
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            search_anime_command,
            search_anitaku_command,
            check_anitaku_exists_command,
            search_awi_command,
            get_episodes_command,
            get_anitaku_episodes_command,
            get_awi_episodes_command,
            get_stream_command,
            get_anitaku_stream_command,
            get_awi_stream_command,
            get_mappings_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
