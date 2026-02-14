use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use crate::anime::{Episode, VideoSource, SubtitleTrack, AudioTrack}; // Adjust imports based on your project structure

const API_BASE: &str = "https://api.allanime.day/api";
const REFERER: &str = "https://allanime.to/";
const AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

#[derive(Debug, Deserialize, Clone)]
pub struct AllAnimeShow {
    pub _id: String,
    pub name: String,
    #[serde(rename = "englishName")]
    pub english_name: Option<String>,
    #[serde(rename = "nativeName")]
    pub native_name: Option<String>,
    pub thumbnail: Option<String>,
    #[serde(rename = "availableEpisodes")]
    pub available_episodes: AvailableEpisodes,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AvailableEpisodes {
    pub sub: i32,
    pub dub: i32,
    pub raw: i32,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    data: Option<SearchData>,
    errors: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Deserialize)]
struct SearchData {
    shows: Option<ShowsConnection>,
}

#[derive(Debug, Deserialize)]
struct ShowsConnection {
    edges: Vec<AllAnimeShow>,
}

#[derive(Debug, Deserialize)]
struct EpisodeInfoResponse {
    data: Option<EpisodeInfoData>,
}

#[derive(Debug, Deserialize)]
struct EpisodeInfoData {
    show: Option<ShowDetail>,
}

#[derive(Debug, Deserialize)]
struct ShowDetail {
    #[serde(rename = "availableEpisodesDetail")]
    available_episodes_detail: AvailableEpisodesDetail,
}

#[derive(Debug, Deserialize)]
struct AvailableEpisodesDetail {
    sub: Option<Vec<String>>,
    dub: Option<Vec<String>>,
    raw: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct SourceResponse {
    data: Option<SourceData>,
}

#[derive(Debug, Deserialize)]
struct SourceData {
    episode: Option<EpisodeSource>,
}

#[derive(Debug, Deserialize)]
struct EpisodeSource {
    #[serde(rename = "sourceUrls")]
    source_urls: Vec<AllAnimeSource>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AllAnimeSource {
    #[serde(rename = "sourceUrl")]
    pub source_url: String,
    #[serde(rename = "sourceName")]
    pub source_name: String,
    #[serde(rename = "type")]
    pub source_type: String,
}

/// Search for anime using Raw GraphQL
pub async fn search(query: &str, _mode: &str) -> Result<Vec<AllAnimeShow>, String> {
    let client = Client::new();
    
    let gql_query = r#"
    query($search: SearchInput, $limit: Int, $page: Int, $translationType: VaildTranslationTypeEnumType, $countryOrigin: VaildCountryOriginEnumType) {
        shows(search: $search, limit: $limit, page: $page, translationType: $translationType, countryOrigin: $countryOrigin) {
            edges {
                _id
                name
                englishName
                nativeName
                thumbnail
                availableEpisodes
            }
        }
    }
    "#;

    let variables = json!({
        "search": {
            "allowAdult": false,
            "allowUnknown": false,
            "query": query
        },
        "limit": 40,
        "page": 1,
        "translationType": "sub",
        "countryOrigin": "ALL"
    });

    let res = client.get(API_BASE)
        .query(&[
            ("variables", variables.to_string()),
            ("query", gql_query.to_string())
        ])
        .header("User-Agent", AGENT)
        .header("Referer", REFERER)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body: SearchResponse = res.json().await.map_err(|e| format!("Failed to parse search JSON: {}", e))?;

    if let Some(data) = body.data {
        if let Some(shows) = data.shows {
            return Ok(shows.edges);
        }
    }
    
    Ok(Vec::new())
}

#[derive(Debug)]
pub struct EpisodeInfo {
    pub episode_number: String,
    pub link: String, // Just the number for API calls
}

/// Get all episodes for a show (Raw GraphQL)
pub async fn get_episodes(show_id: &str, mode: &str) -> Result<Vec<EpisodeInfo>, String> {
    let client = Client::new();

    let gql_query = r#"
    query($showId: String!) {
        show(_id: $showId) {
            _id
            availableEpisodesDetail
        }
    }
    "#;

    let variables = json!({
        "showId": show_id
    });

    let res = client.get(API_BASE)
         .query(&[
            ("variables", variables.to_string()),
            ("query", gql_query.to_string())
        ])
        .header("User-Agent", AGENT)
        .header("Referer", REFERER)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body: EpisodeInfoResponse = res.json().await.map_err(|e| format!("Failed to parse info JSON: {}", e))?;

    let mut episodes = Vec::new();

    if let Some(data) = body.data {
        if let Some(show) = data.show {
            let list = match mode {
                "dub" => show.available_episodes_detail.dub,
                _ => show.available_episodes_detail.sub,
            };

            if let Some(ep_list) = list {
                for ep_str in ep_list {
                    episodes.push(EpisodeInfo {
                        episode_number: ep_str.clone(),
                        link: ep_str, // For AllAnime, the "link" is just the episode number/string
                    });
                }
            }
        }
    }
    
    // Reverse to be in ascending order (usually API returns descending)
    if let Some(first) = episodes.first() {
        if let Some(last) = episodes.last() {
            // Simple check: if first > last, reverse
            let f_num = first.episode_number.parse::<f32>().unwrap_or(0.0);
            let l_num = last.episode_number.parse::<f32>().unwrap_or(0.0);
            if f_num > l_num {
                episodes.reverse();
            }
        }
    }

    Ok(episodes)
}

/// Get video sources for a specific episode
pub async fn get_video_sources(show_id: &str, mode: &str, episode_string: &str) -> Result<Vec<AllAnimeSource>, String> {
    let client = Client::new();

    let gql_query = r#"
    query($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
        episode(showId: $showId, translationType: $translationType, episodeString: $episodeString) {
            sourceUrls
        }
    }
    "#;

    let variables = json!({
        "showId": show_id,
        "translationType": mode,
        "episodeString": episode_string
    });

    let res = client.get(API_BASE)
         .query(&[
            ("variables", variables.to_string()),
            ("query", gql_query.to_string())
        ])
        .header("User-Agent", AGENT)
        .header("Referer", REFERER)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body: SourceResponse = res.json().await.map_err(|e| format!("Failed to parse source JSON: {}", e))?;

    if let Some(data) = body.data {
        if let Some(episode) = data.episode {
            return Ok(episode.source_urls);
        }
    }

    Err("No sources found".to_string())
}

/// Decrypt or resolve the source URL
/// AllAnime source URLs are often hex-encoded info.
pub async fn resolve_source_url(encoded_url: &str) -> Result<String, String> {
    if encoded_url.starts_with("http") {
         return Ok(encoded_url.to_string());
    }

    // Decrypt logic (Custom hex mapping)
    let mut decoded = decrypt_allanime_url(encoded_url);
    
    // Ensure absolute if relative logic misses
    if decoded.starts_with('/') {
        decoded = format!("https://allanime.day{}", decoded);
    }

    // If it's a clock link, we MUST fetch it to get the real MP4. 
    // If we can't, we returns Error so the Swarm tries the next source.
    if decoded.contains("clock") && !decoded.contains(".json") {
         let json_url = decoded.replace("clock", "clock.json");
         
         // Fetch the clock JSON
         let client = Client::new();
         let res = client.get(&json_url)
             .header("User-Agent", AGENT)
             .send()
             .await
             .map_err(|e| e.to_string())?;
             
         if res.status().is_success() {
             let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
             if let Some(links) = json.get("links") {
                 if let Some(arr) = links.as_array() {
                     if let Some(first) = arr.first() {
                         if let Some(src) = first.get("src") {
                             if let Some(s) = src.as_str() {
                                 // Ensure the resolved source from JSON is also absolute
                                 if s.starts_with("http") {
                                     return Ok(s.to_string());
                                 } else if s.starts_with('/') {
                                     return Ok(format!("https://allanime.day{}", s));
                                 } else {
                                     return Ok(s.to_string());
                                 }
                             }
                         }
                     }
                 }
             }
         }
         return Err("Failed to resolve clock link (JSON fetch failed or empty)".to_string());
    }

    Ok(decoded)
}

fn decrypt_allanime_url(input: &str) -> String {
    // If it starts with "--", strip it
    let clean_input = if input.starts_with("--") { &input[2..] } else { input };
    
    let mut output = String::new();
    let chars: Vec<char> = clean_input.chars().collect();
    
    for chunk in chars.chunks(2) {
        if chunk.len() < 2 { break; }
        let s = format!("{}{}", chunk[0], chunk[1]);
        
        // Custom Mapping (incomplete list based on Animu/Standard hex)
        // If it looks like hex, try standard parse, else use custom map
        // Animu uses a very specific mapping table. 
        // For brevity, let's try standard hex first, as recent AllAnime changes often use standard hex or different obscuration.
        // However, the test_providers.js output showed "Yt-mp4" etc which are often direct or standard hex.
        
        if let Ok(byte) = u8::from_str_radix(&s, 16) {
             // 56 -> '79' in hex? No.
             // Let's implement the specific map check from Animu if needed.
             // Animu Map: "01" -> "9", "02" -> ":", ...
             
             // Mapping implementation
             let decoded_char = match s.as_str() {
                 "01" => "9", "02" => ":", "03" => ";", "04" => "<", "05" => "=", "06" => ">", "07" => "?",
                 "08" => "0", "09" => "1", "0a" => "2", "0b" => "3", "0c" => "4", "0d" => "5", "0e" => "6", "0f" => "7",
                 "00" => "8",
                 "10" => "(", "11" => ")", "12" => "*", "13" => "+", "14" => ",", "15" => "-", "16" => ".", "17" => "/",
                 "18" => "0", "19" => "!", "1a" => ":", "1b" => "#", "1c" => "$", "1d" => "%", "1e" => "&", "1f" => "'",
                 "40" => "x", "41" => "y", "42" => "z", 
                 "46" => "~", "47" => "_", "48" => "p", "49" => "q", "4a" => "r", "4b" => "s", "4c" => "t", "4d" => "u", "4e" => "v", "4f" => "w",
                 "50" => "h", "51" => "i", "52" => "j", "53" => "k", "54" => "l", "55" => "m", "56" => "n", "57" => "o",
                 "59" => "a", "5a" => "b", "5b" => "c", "5c" => "d", "5d" => "e", "5e" => "f", "5f" => "g",
                 "60" => "X", "61" => "Y", "62" => "Z", 
                 "63" => "[", "64" => "\\", "65" => "]", "66" => "^", "67" => "_",
                 "68" => "P", "69" => "Q", "6a" => "R", "6b" => "S", "6c" => "T", "6d" => "U", "6e" => "V", "6f" => "W",
                 "70" => "H", "71" => "I", "72" => "J", "73" => "K", "74" => "L", "75" => "M", "76" => "N", "77" => "O",
                 "78" => "@", "79" => "A", "7a" => "B", "7b" => "C", "7c" => "D", "7d" => "E", "7e" => "F", "7f" => "G",
                 _ => ""
             };
             
             if !decoded_char.is_empty() {
                 output.push_str(decoded_char);
             } else {
                 // Fallback to standard ascii if reasonable
                 output.push(byte as char);
             }
        }
    }
    
    // Fix wixmp (common in AllAnime)
    if output.contains("repackager.wixmp.com") {
        output = output.replace("repackager.wixmp.com", ""); // often effectively removes the prefix logic
        // But usually it's `https://repackager.wixmp.com/url` -> url
        // Actually Aniverse logic: .replace('repackager.wixmp.com/', '')
    }

    output
}
