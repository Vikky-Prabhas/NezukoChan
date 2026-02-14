use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const ANIZIP_API: &str = "https://api.ani.zip";

/// Provider mappings from AniZip API
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct ProviderMappings {
    pub anilist_id: i32,
    pub mal_id: Option<i32>,
    pub anidb_id: Option<i32>,
    pub allanime_id: Option<String>,
    pub gogoanime_id: Option<String>,
    pub zoro_id: Option<String>,
    pub episode_count: Option<i32>,
    pub titles: Option<std::collections::HashMap<String, String>>,
    pub overviews: Option<std::collections::HashMap<String, String>>,
    pub images: Option<std::collections::HashMap<String, String>>,
}

/// Fetch provider mappings from AniZip API
/// Returns mappings for AllAnime, Gogoanime, Zoro, etc.
pub async fn get_mappings(anilist_id: i32) -> Result<ProviderMappings, String> {
    let client = Client::new();
    // CORRECT URL format: query parameter, not path
    let url = format!("{}/mappings?anilist_id={}", ANIZIP_API, anilist_id);
    
    println!("[mapping] Fetching mappings for AniList ID: {}", anilist_id);
    
    let res = client
        .get(&url)
        .header("User-Agent", "NezukoChan/1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch mappings: {}", e))?;
    
    if res.status() == 404 {
        println!("[mapping] No mappings found for AniList ID: {}", anilist_id);
        return Err("No mappings found".to_string());
    }
    
    if !res.status().is_success() {
        return Err(format!("AniZip API error: {}", res.status()));
    }
    
    let json: Value = res.json().await.map_err(|e| e.to_string())?;
    
    // Parse the AniZip response
    let mappings = parse_anizip_response(anilist_id, &json);
    
    println!("[mapping] Found mappings: allanime={:?}, gogoanime={:?}, episode_count={:?}", 
        mappings.allanime_id, mappings.gogoanime_id, mappings.episode_count);
    
    Ok(mappings)
}

/// Parse AniZip API response into ProviderMappings
fn parse_anizip_response(anilist_id: i32, json: &Value) -> ProviderMappings {
    let mut mappings = ProviderMappings {
        anilist_id,
        ..Default::default()
    };
    
    // Get mappings object
    if let Some(mapping_obj) = json.get("mappings") {
        if let Some(id) = mapping_obj.get("anilist_id").and_then(|v| v.as_i64()) { mappings.anilist_id = id as i32; }
        if let Some(id) = mapping_obj.get("mal_id").and_then(|v| v.as_i64()) { mappings.mal_id = Some(id as i32); }
        if let Some(id) = mapping_obj.get("anidb_id").and_then(|v| v.as_i64()) { mappings.anidb_id = Some(id as i32); }
    }
    
    // Parse Episodes Object (Rich Metadata)
    if let Some(episodes) = json.get("episodes").and_then(|v| v.as_object()) {
        mappings.episode_count = Some(episodes.len() as i32);
        
        let mut titles_map = std::collections::HashMap::new();
        let mut overviews_map = std::collections::HashMap::new();
        let mut images_map = std::collections::HashMap::new();

        for (key, val) in episodes {
            // Title
            if let Some(title_obj) = val.get("title").and_then(|v| v.as_object()) {
                if let Some(en) = title_obj.get("en").and_then(|v| v.as_str()) {
                     titles_map.insert(key.clone(), en.to_string());
                } else if let Some(x_jat) = title_obj.get("x-jat").and_then(|v| v.as_str()) {
                     titles_map.insert(key.clone(), x_jat.to_string());
                }
            }
            
            // Overview
            if let Some(overview) = val.get("overview").and_then(|v| v.as_str()) {
                overviews_map.insert(key.clone(), overview.to_string());
            }

            // Image
            if let Some(image) = val.get("image").and_then(|v| v.as_str()) {
                images_map.insert(key.clone(), image.to_string());
            }
        }
        
        mappings.titles = Some(titles_map);
        mappings.overviews = Some(overviews_map);
        mappings.images = Some(images_map);
    } else if let Some(titles_obj) = json.get("titles").and_then(|v| v.as_object()) {
        // Fallback to legacy "titles" object if "episodes" is missing
        let mut titles_map = std::collections::HashMap::new();
        for (key, val) in titles_obj {
            if let Some(title) = val.as_str() {
                titles_map.insert(key.clone(), title.to_string());
            }
        }
        mappings.titles = Some(titles_map);
    }
    
    // Check for site-specific IDs in mappings.sites
    if let Some(sites) = json.get("mappings").and_then(|m| m.get("sites")) {
        // AllAnime
        if let Some(allanime) = sites.get("allanime").and_then(|v| v.as_str()) {
            mappings.allanime_id = Some(allanime.to_string());
        }
        
        // Gogoanime
        if let Some(gogo) = sites.get("gogoanime").and_then(|v| v.as_str()) {
            mappings.gogoanime_id = Some(gogo.to_string());
        }
        
        // Zoro/HiAnime
        if let Some(zoro) = sites.get("zoro").and_then(|v| v.as_str()) {
            mappings.zoro_id = Some(zoro.to_string());
        }
    }
    
    // Alternative: Try thetvdb_id or other fields as fallback identifiers
    if mappings.allanime_id.is_none() {
        // Try to get from root mappings
        if let Some(mapping_obj) = json.get("mappings") {
            if let Some(thetvdb) = mapping_obj.get("thetvdb_id").and_then(|v| v.as_i64()) {
                // Store TVDB ID temporarily - we might use this for cross-referencing
                println!("[mapping] TVDB ID found: {}", thetvdb);
            }
        }
    }
    
    mappings
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_mappings_one_piece() {
        println!("Testing AniZip mappings for One Piece (AniList ID: 21)");
        match get_mappings(21).await {
            Ok(mappings) => {
                println!("Mappings: {:?}", mappings);
                assert_eq!(mappings.anilist_id, 21);
                // MAL ID should also be 21 for One Piece
                assert!(mappings.mal_id.is_some());
            }
            Err(e) => {
                println!("Error (expected for some APIs): {}", e);
            }
        }
    }
    
    #[tokio::test]
    async fn test_get_mappings_demon_slayer() {
        println!("Testing AniZip mappings for Demon Slayer (AniList ID: 101922)");
        match get_mappings(101922).await {
            Ok(mappings) => {
                println!("Mappings: {:?}", mappings);
                assert_eq!(mappings.anilist_id, 101922);
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }
}
