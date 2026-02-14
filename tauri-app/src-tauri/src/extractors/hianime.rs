use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use crate::extractors::gogaes;

const HIANIME_BASE: &str = "https://hianime.bz";
const MEGACLOUD_BASE: &str = "https://megacloud.blog";
const MEGACLOUD_KEY_URL: &str = "https://raw.githubusercontent.com/itzzzme/megacloud-keys/refs/heads/main/key.txt";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

// ============================================================
// SEARCH
// ============================================================

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HiAnimeSearchItem {
    pub id: String,
    pub name: String,
    pub poster: String,
    pub duration: Option<String>,
    #[serde(rename = "type")]
    pub anime_type: Option<String>,
    pub rating: Option<String>,
    pub episodes: Option<HiAnimeSearchEpisodes>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HiAnimeSearchEpisodes {
    pub sub: Option<i32>,
    pub dub: Option<i32>,
}

pub async fn search(query: &str) -> Result<Vec<HiAnimeSearchItem>, String> {
    let client = Client::new();
    let url = format!("{}/search?keyword={}", HIANIME_BASE, urlencoding::encode(query));
    println!("DEBUG: HiAnime Direct Search: {}", url);

    let res = client.get(&url)
        .header("User-Agent", USER_AGENT)
        .header("Referer", HIANIME_BASE)
        .send()
        .await
        .map_err(|e| format!("HiAnime search request failed: {}", e))?;

    let html_text = res.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_text);

    let item_selector = Selector::parse(".flw-item").unwrap();
    let name_selector = Selector::parse(".dynamic-name").unwrap();
    let img_selector = Selector::parse("img").unwrap();
    let link_selector = Selector::parse("a").unwrap();
    let sub_selector = Selector::parse(".tick-sub").unwrap();
    let dub_selector = Selector::parse(".tick-dub").unwrap();
    let duration_selector = Selector::parse(".fdi-duration").unwrap();

    let mut results = Vec::new();

    for element in document.select(&item_selector) {
        let name = element.select(&name_selector).next()
            .map(|el| el.text().collect::<Vec<_>>().join(""))
            .unwrap_or_default();

        let poster = element.select(&img_selector).next()
            .and_then(|el| el.value().attr("data-src").or(el.value().attr("src")))
            .unwrap_or("")
            .to_string();

        let id = element.select(&link_selector).next()
            .and_then(|el| el.value().attr("href"))
            .map(|href| href.split('/').last().unwrap_or("").to_string())
            .unwrap_or_default();

        let sub_count = element.select(&sub_selector).next()
            .and_then(|el| el.text().collect::<String>().trim().parse::<i32>().ok());
        let dub_count = element.select(&dub_selector).next()
            .and_then(|el| el.text().collect::<String>().trim().parse::<i32>().ok());

        let duration = element.select(&duration_selector).next()
            .map(|el| el.text().collect::<String>().trim().to_string());

        if !id.is_empty() && !name.is_empty() {
            results.push(HiAnimeSearchItem {
                id,
                name,
                poster,
                duration,
                anime_type: None,
                rating: None,
                episodes: Some(HiAnimeSearchEpisodes {
                    sub: sub_count,
                    dub: dub_count,
                }),
            });
        }
    }

    println!("DEBUG: HiAnime Direct Search found {} results", results.len());
    Ok(results)
}

// ============================================================
// EPISODES
// ============================================================

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HiAnimeEpisode {
    pub title: String,
    #[serde(rename = "episodeId")]
    pub episode_id: String,
    pub number: i32,
    #[serde(rename = "isFiller")]
    pub is_filler: bool,
}

pub async fn get_episodes(anime_id: &str) -> Result<Vec<HiAnimeEpisode>, String> {
    let client = Client::new();

    // Extract numeric ID from the slug (e.g., "one-piece-100" -> "100")
    let numeric_id = anime_id
        .rsplit('-')
        .next()
        .and_then(|s| s.parse::<i64>().ok())
        .ok_or_else(|| format!("Cannot extract numeric ID from '{}'", anime_id))?;

    let url = format!("{}/ajax/v2/episode/list/{}", HIANIME_BASE, numeric_id);
    println!("DEBUG: HiAnime Direct Episodes: {}", url);

    let res = client.get(&url)
        .header("User-Agent", USER_AGENT)
        .header("Referer", format!("{}/{}", HIANIME_BASE, anime_id))
        .header("X-Requested-With", "XMLHttpRequest")
        .send()
        .await
        .map_err(|e| format!("HiAnime episodes request failed: {}", e))?;

    let json: serde_json::Value = res.json().await
        .map_err(|e| format!("HiAnime episodes JSON parse failed: {}", e))?;

    let html_str = json.get("html")
        .and_then(|v| v.as_str())
        .ok_or("No 'html' field in episode response")?;

    let document = Html::parse_document(html_str);
    let ep_selector = Selector::parse(".ep-item").unwrap();

    let mut episodes = Vec::new();

    for el in document.select(&ep_selector) {
        let ep_id = el.value().attr("data-id").unwrap_or("").to_string();
        let ep_num_str = el.value().attr("data-number").unwrap_or("0");
        let ep_num = ep_num_str.parse::<i32>().unwrap_or(0);

        let title_selector = Selector::parse(".e-dynamic-name, .ep-name").unwrap();
        let title = el.select(&title_selector).next()
            .map(|t| t.text().collect::<String>().trim().to_string())
            .unwrap_or_else(|| format!("Episode {}", ep_num));

        let is_filler = el.value().attr("class")
            .map(|c| c.contains("ssl-item-filler"))
            .unwrap_or(false);

        if !ep_id.is_empty() {
            episodes.push(HiAnimeEpisode {
                title,
                episode_id: ep_id,
                number: ep_num,
                is_filler,
            });
        }
    }

    println!("DEBUG: HiAnime Direct Episodes found {} episodes", episodes.len());
    Ok(episodes)
}

// ============================================================
// SOURCES — Direct MegaCloud Decryption
// ============================================================

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HiAnimeSourcesData {
    pub sources: Vec<HiAnimeSource>,
    pub tracks: Option<Vec<HiAnimeTrack>>,
    pub intro: Option<SkipTime>,
    pub outro: Option<SkipTime>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HiAnimeSource {
    pub url: String,
    #[serde(rename = "type")]
    pub source_type: String,
    pub quality: Option<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HiAnimeTrack {
    pub file: String,
    pub label: Option<String>,
    pub kind: String,
    pub default: Option<bool>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SkipTime {
    pub start: Option<f64>,
    pub end: Option<f64>,
}

/// Server item from the servers response
#[derive(Debug)]
struct ServerItem {
    id: String,
    name: String,
    server_type: String, // "sub" or "dub"
}

pub async fn get_sources(episode_id: &str, category: &str) -> Result<HiAnimeSourcesData, String> {
    let client = Client::new();

    // Step 1: Get servers for this episode
    let servers_url = format!("{}/ajax/v2/episode/servers?episodeId={}", HIANIME_BASE, episode_id);
    println!("DEBUG: MegaCloud Step 1 - Servers: {}", servers_url);

    let servers_res = client.get(&servers_url)
        .header("User-Agent", USER_AGENT)
        .header("Referer", HIANIME_BASE)
        .header("X-Requested-With", "XMLHttpRequest")
        .send()
        .await
        .map_err(|e| format!("Servers request failed: {}", e))?;

    let servers_json: serde_json::Value = servers_res.json().await
        .map_err(|e| format!("Servers JSON parse failed: {}", e))?;

    // Parse servers HTML in a block so Html (non-Send) is dropped before next .await
    let (selected_server_id, selected_server_name) = {
        let servers_html = servers_json.get("html")
            .and_then(|v| v.as_str())
            .ok_or("No 'html' in servers response")?;

        let doc = Html::parse_document(servers_html);
        let server_selector = Selector::parse(".server-item[data-id]").unwrap();

        let mut servers: Vec<ServerItem> = Vec::new();
        for el in doc.select(&server_selector) {
            let id = el.value().attr("data-id").unwrap_or("").to_string();
            let stype = el.value().attr("data-type").unwrap_or("sub").to_string();
            let name = el.text().collect::<String>().trim().to_string();
            if !id.is_empty() {
                servers.push(ServerItem { id, name, server_type: stype });
            }
        }

        println!("DEBUG: Found {} servers: {:?}", servers.len(), servers.iter().map(|s| format!("{}({}/{})", s.name, s.server_type, s.id)).collect::<Vec<_>>());

        // Pick best server: prefer HD-1/HD-2 matching the requested category (sub/dub)
        let target = servers.iter()
            .find(|s| s.server_type == category && (s.name.contains("HD-1") || s.name.contains("Vidstreaming")))
            .or_else(|| servers.iter().find(|s| s.server_type == category && (s.name.contains("HD-2") || s.name.contains("MegaCloud"))))
            .or_else(|| servers.iter().find(|s| s.server_type == category))
            .or_else(|| servers.first())
            .ok_or("No servers found for this episode")?;

        println!("DEBUG: Selected server: {} (type={}, id={})", target.name, target.server_type, target.id);
        (target.id.clone(), target.name.clone())
    }; // doc is dropped here — safe to .await below

    // Step 2: Get source link from selected server
    let sources_url = format!("{}/ajax/v2/episode/sources?id={}", HIANIME_BASE, selected_server_id);
    println!("DEBUG: MegaCloud Step 2 - Sources: {}", sources_url);

    let sources_res = client.get(&sources_url)
        .header("User-Agent", USER_AGENT)
        .header("Referer", HIANIME_BASE)
        .header("X-Requested-With", "XMLHttpRequest")
        .send()
        .await
        .map_err(|e| format!("Sources request failed: {}", e))?;

    let sources_json: serde_json::Value = sources_res.json().await
        .map_err(|e| format!("Sources JSON parse failed: {}", e))?;

    let embed_link = sources_json.get("link")
        .and_then(|v| v.as_str())
        .ok_or("No 'link' in sources response")?;

    println!("DEBUG: MegaCloud embed link: {}", embed_link);

    // Step 3: Extract server ID from embed link and call getSources
    // Link format: https://megacloud.blog/embed-2/v2/e-1/XXXXXXX?k=1
    let server_id = embed_link
        .split('/')
        .last()
        .unwrap_or("")
        .split('?')
        .next()
        .unwrap_or("");

    if server_id.is_empty() {
        return Err("Could not extract server ID from embed link".to_string());
    }

    let get_sources_url = format!("{}/embed-2/v2/e-1/getSources?id={}", MEGACLOUD_BASE, server_id);
    println!("DEBUG: MegaCloud Step 3 - getSources: {}", get_sources_url);

    let mega_res = client.get(&get_sources_url)
        .header("User-Agent", USER_AGENT)
        .header("Referer", format!("{}/", MEGACLOUD_BASE))
        .header("X-Requested-With", "XMLHttpRequest")
        .send()
        .await
        .map_err(|e| format!("MegaCloud getSources request failed: {}", e))?;

    let mega_json: serde_json::Value = mega_res.json().await
        .map_err(|e| format!("MegaCloud getSources JSON parse failed: {}", e))?;

    // Check if sources are encrypted (string) or plain (array)
    let sources = mega_json.get("sources").ok_or("No 'sources' in MegaCloud response")?;

    let source_list: Vec<HiAnimeSource> = if sources.is_string() {
        // Encrypted — need to decrypt with AES key
        let encrypted_b64 = sources.as_str().unwrap();
        println!("DEBUG: MegaCloud sources are encrypted ({} chars), fetching AES key...", encrypted_b64.len());

        // Step 4: Fetch dynamic AES key from GitHub
        let key = client.get(MEGACLOUD_KEY_URL)
            .send()
            .await
            .map_err(|e| format!("Key fetch failed: {}", e))?
            .text()
            .await
            .map_err(|e| format!("Key read failed: {}", e))?
            .trim()
            .to_string();

        println!("DEBUG: MegaCloud AES key fetched ({} chars)", key.len());

        // Step 5: Decrypt using gogaes (OpenSSL Salted__ AES-256-CBC)
        let decrypted = gogaes::decrypt_aes_crypto_js(encrypted_b64, &key)
            .map_err(|e| format!("MegaCloud AES decrypt failed: {}", e))?;

        println!("DEBUG: MegaCloud decrypted: {}...", &decrypted[..std::cmp::min(200, decrypted.len())]);

        // Parse the decrypted JSON — it's an array of {file, type}
        let parsed: serde_json::Value = serde_json::from_str(&decrypted)
            .map_err(|e| format!("Decrypted JSON parse failed: {}", e))?;

        if let Some(arr) = parsed.as_array() {
            arr.iter().filter_map(|item| {
                let file = item.get("file")?.as_str()?;
                let stype = item.get("type").and_then(|v| v.as_str()).unwrap_or("hls");
                Some(HiAnimeSource {
                    url: file.to_string(),
                    source_type: stype.to_string(),
                    quality: None,
                })
            }).collect()
        } else {
            return Err("Decrypted sources is not an array".to_string());
        }
    } else if sources.is_array() {
        // Already plain JSON array
        sources.as_array().unwrap().iter().filter_map(|item| {
            let file = item.get("file")?.as_str()?;
            let stype = item.get("type").and_then(|v| v.as_str()).unwrap_or("hls");
            Some(HiAnimeSource {
                url: file.to_string(),
                source_type: stype.to_string(),
                quality: None,
            })
        }).collect()
    } else {
        return Err("Unexpected 'sources' format in MegaCloud response".to_string());
    };

    // Extract tracks (subtitles)
    let tracks: Option<Vec<HiAnimeTrack>> = mega_json.get("tracks")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter().filter_map(|t| {
                let file = t.get("file")?.as_str()?.to_string();
                let label = t.get("label").and_then(|v| v.as_str()).map(|s| s.to_string());
                let kind = t.get("kind").and_then(|v| v.as_str()).unwrap_or("captions").to_string();
                let default = t.get("default").and_then(|v| v.as_bool());
                // Skip thumbnail tracks
                if kind == "thumbnails" { return None; }
                Some(HiAnimeTrack { file, label, kind, default })
            }).collect()
        });

    // Extract intro/outro skip times
    let intro = mega_json.get("intro").and_then(|v| {
        Some(SkipTime {
            start: v.get("start").and_then(|s| s.as_f64()),
            end: v.get("end").and_then(|s| s.as_f64()),
        })
    });

    let outro = mega_json.get("outro").and_then(|v| {
        Some(SkipTime {
            start: v.get("start").and_then(|s| s.as_f64()),
            end: v.get("end").and_then(|s| s.as_f64()),
        })
    });

    println!("DEBUG: MegaCloud final: {} sources, {} tracks, intro={:?}, outro={:?}",
        source_list.len(),
        tracks.as_ref().map(|t| t.len()).unwrap_or(0),
        intro, outro
    );

    Ok(HiAnimeSourcesData {
        sources: source_list,
        tracks,
        intro,
        outro,
    })
}
