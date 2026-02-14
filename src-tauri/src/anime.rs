use reqwest::Client;
use scraper::{Html, Selector};
use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Nonce}; // 0.10.x
use base64::{Engine as _, engine::general_purpose};
use serde::{Deserialize, Serialize};
use regex::Regex;
use serde_json::json; // Added for proxy headers
use crate::extractors::{gogaes, unpacker, allanime, hianime};
use futures::future::join_all;

// UPDATED: anitaku.to seems to be the only working domain for this user
const BASE_URL: &str = "https://anitaku.to";
const AJAX_URL: &str = "https://ajax.gogo-load.com";
// Newer UA (Chrome 121)
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

#[derive(Serialize, Deserialize, Debug)]
pub struct AnimeResult {
// ... existing struct ...


    pub id: String,
    pub title: String,
    pub url: String,
    pub image: String,
    pub release_date: Option<String>,
    // New fields for Language Architecture
    pub language: Option<String>,
    pub is_multi_audio: bool,
    pub available_languages: Vec<String>,
    pub provider: String, // "allanime" or "anitaku" or "awi"
    // Episode count for prioritizing main series over spinoffs
    pub episode_count: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Episode {
    pub id: String, // e.g. "one-piece-episode-1" or "allanime_id|ep_num"
    pub number: f32,
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SubtitleTrack {
    pub label: String,
    pub file: String,
    pub kind: String, // "captions"
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AudioTrack {
    pub name: String,      // "Telugu", "Hindi", "English"
    pub language: String,  // "tel", "hin", "eng"
    pub default: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VideoSource {
    pub url: String,
    pub quality: String, // "default", "backup", "hls"
    pub is_m3u8: bool,
    pub subtitles: Vec<SubtitleTrack>,
    pub audio_tracks: Vec<AudioTrack>, // Available audio languages
    pub provider: String, // "Diamond", "Gold", "Silver"
    pub provider_id: String, // "allanime", "gogo", "hianime" - for switching
}

pub async fn search_anime(query: &str) -> Result<Vec<AnimeResult>, String> {
    
    // 1. DIAMOND SEARCH: AllAnime
    // We launch it in parallel with others if desired, or prioritize it.
    // Let's do parallel for speed.
    
    let allanime_search = allanime::search(query, "sub"); // Default to sub search for broad results
    let anitaku_search = search_anitaku(query);
    let hianime_search = hianime::search(query);

    let (allanime_res, anitaku_res, hianime_res) = futures::join!(allanime_search, anitaku_search, hianime_search);

    let mut results = Vec::new();
    
    // Process Diamond (AllAnime) results
    if let Ok(r) = allanime_res {
        println!("DEBUG: AllAnime returned {} results", r.len());
        for item in r {
            // Logic to determine available languages based on counts
            let mut languages = Vec::new();
            if item.available_episodes.sub > 0 { languages.push("Japanese".to_string()); }
            if item.available_episodes.dub > 0 { languages.push("English".to_string()); }
            
            let is_multi = languages.contains(&"English".to_string()) && languages.contains(&"Japanese".to_string());
            
            results.push(AnimeResult {
                id: format!("allanime:{}", item._id), // Namespace the ID using _id from new struct
                title: item.name,
                url: format!("https://allanime.to/anime/{}", item._id),
                image: item.thumbnail.unwrap_or_default(),
                release_date: None,
                language: Some(if is_multi { "Multi".to_string() } else { "Japanese".to_string() }), // Simplify
                is_multi_audio: is_multi,
                available_languages: languages,
                provider: "allanime".to_string(),
                // Use SUB episode count for prioritizing main series over spinoffs
                episode_count: Some(item.available_episodes.sub),
            });
        }
    } else if let Err(e) = allanime_res {
        println!("DEBUG: AllAnime search error: {}", e);
    }

    // Process Gold (HiAnime) results
    if let Ok(r) = hianime_res {
        println!("DEBUG: HiAnime returned {} results", r.len());
        for item in r {
            let mut languages = Vec::new();
            // API returns episode counts for sub/dub usually
            if let Some(eps) = &item.episodes {
                if eps.sub.unwrap_or(0) > 0 { languages.push("Japanese".to_string()); }
                if eps.dub.unwrap_or(0) > 0 { languages.push("English".to_string()); }
            } else {
                // Default assumption if missing (safe fallback)
                languages.push("Japanese".to_string());
            }

            let is_multi = languages.contains(&"English".to_string()) && languages.contains(&"Japanese".to_string());
            let ep_count = item.episodes.as_ref().and_then(|e| e.sub).unwrap_or(0);

            results.push(AnimeResult {
                id: format!("hianime:{}", item.id),
                title: item.name,
                url: format!("https://hianime.to/{}", item.id),
                image: item.poster,
                release_date: None, // Could parse from 'type' or other fields if needed
                language: Some(if is_multi { "Multi".to_string() } else { "Japanese".to_string() }),
                is_multi_audio: is_multi,
                available_languages: languages,
                provider: "hianime".to_string(),
                episode_count: Some(ep_count),
            });
        }
    } else if let Err(e) = hianime_res {
        println!("DEBUG: HiAnime search error: {}", e);
    }
    
    // Process Silver (Anitaku) results
    if let Ok(r) = anitaku_res { 
        println!("DEBUG: Anitaku returned {} results", r.len());
        results.extend(r); 
    } else if let Err(e) = anitaku_res {
        println!("DEBUG: Anitaku search error: {}", e);
    }

    println!("DEBUG: Total results found: {}", results.len());
    Ok(results)
}

/// Check if an anime ID exists (Routing to correct provider)
pub async fn check_anitaku_exists(id: &str) -> Result<bool, String> {
    if id.starts_with("allanime:") {
        // Assume true for now or implement existence check
        return Ok(true);
    }
    
    let client = Client::new();
    let url = format!("{}/category/{}", BASE_URL, id);
    println!("DEBUG: Checking if Anitaku anime exists: {}", url);

    let res = client.get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let html = res.text().await.map_err(|e| e.to_string())?;
        let exists = html.contains("episode-page") || html.contains("anime_info_episodes");
        Ok(exists)
    } else {
        Ok(false)
    }
}

pub async fn search_anitaku(query: &str) -> Result<Vec<AnimeResult>, String> {
    let client = Client::new();
    let url = format!("{}/search.html", BASE_URL);
    println!("DEBUG: Searching Anitaku for: '{}'", query);

    let res = client.get(&url)
        .query(&[("keyword", query)])
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html_text = res.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_text);
    
    let list_selector = Selector::parse(".last_episodes ul.items li").unwrap();
    let name_selector = Selector::parse("p.name a").unwrap();
    let img_selector = Selector::parse("div.img a img").unwrap();
    let link_selector = Selector::parse("div.img a").unwrap();
    let release_selector = Selector::parse("p.released").unwrap();

    let mut results = Vec::new();

    for element in document.select(&list_selector) {
        let title_el = element.select(&name_selector).next();
        let img_el = element.select(&img_selector).next();
        let link_el = element.select(&link_selector).next();
        let release_el = element.select(&release_selector).next();

        if let (Some(title), Some(img), Some(link)) = (title_el, img_el, link_el) {
            let title_text = title.text().collect::<Vec<_>>().join("");
            let image_url = img.value().attr("src").unwrap_or("").to_string();
            let relative_url = link.value().attr("href").unwrap_or("").to_string();
            let id = relative_url.trim_start_matches("/category/").to_string();
            
            let release_date = release_el.map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string());

            let is_dub = title_text.to_lowercase().contains("dub");
            let language = if is_dub { "English".to_string() } else { "Japanese".to_string() };
            
            results.push(AnimeResult {
                id,
                title: title_text,
                url: format!("{}{}", BASE_URL, relative_url),
                image: image_url,
                release_date,
                language: Some(language.clone()), 
                is_multi_audio: false,
                available_languages: vec![language],
                provider: "anitaku".to_string(),
                episode_count: None,
            });
        }
    }
    Ok(results)
}

pub async fn search_awi(_query: &str) -> Result<Vec<AnimeResult>, String> {
    // AWI Provider Removed — stub returns empty
    Ok(Vec::new())
}

pub async fn get_episodes(anime_id: &str) -> Result<Vec<Episode>, String> {
    println!("DEBUG get_episodes: ENTRY with ID = '{}'", anime_id);
    
    if anime_id.starts_with("allanime:") {
        let mut real_id = anime_id.trim_start_matches("allanime:").to_string();
        println!("DEBUG get_episodes: AllAnime detected, real_id = '{}'", real_id);
        
        // New format: allanime:showid:sub or allanime:showid:dub
        // Old format: allanime:showid-dub
        let mode = if real_id.ends_with(":dub") {
            real_id = real_id.trim_end_matches(":dub").to_string();
            println!("DEBUG get_episodes: DUB mode detected (new format), stripped ID = '{}'", real_id);
            "dub"
        } else if real_id.ends_with(":sub") {
            real_id = real_id.trim_end_matches(":sub").to_string();
            println!("DEBUG get_episodes: SUB mode detected (new format), stripped ID = '{}'", real_id);
            "sub"
        } else if real_id.ends_with("-dub") {
            // Legacy format support
            real_id = real_id.replace("-dub", "");
            println!("DEBUG get_episodes: DUB mode detected (legacy format), stripped ID = '{}'", real_id);
            "dub"
        } else {
            println!("DEBUG get_episodes: SUB mode (default)");
            "sub"
        };

        println!("DEBUG get_episodes: Calling allanime::get_episodes('{}', '{}')", real_id, mode);
        match allanime::get_episodes(&real_id, mode).await {
             Ok(eps) => {
                 println!("DEBUG get_episodes: AllAnime returned {} episodes", eps.len());
                 Ok(eps.into_iter().map(|e| Episode {
                     // Encode state in ID: allanime:id|ep_num|mode
                     id: format!("allanime:{}|{}|{}", real_id, e.episode_number, mode), 
                     number: e.episode_number.parse::<f32>().unwrap_or(0.0),
                     url: e.link,
                 }).collect())
             },
             Err(e) => {
                 println!("DEBUG get_episodes: AllAnime ERROR: {}", e);
                 Err(format!("AllAnime Error: {}", e))
             },
        }
    } else if anime_id.starts_with("hianime:") {
        let real_id = anime_id.trim_start_matches("hianime:");
        println!("DEBUG get_episodes: HiAnime detected, real_id = '{}'", real_id);
        
        match hianime::get_episodes(real_id).await {
            Ok(eps) => {
                println!("DEBUG get_episodes: HiAnime returned {} episodes", eps.len());
                Ok(eps.into_iter().map(|e| Episode {
                    // hianime:id|ep_id
                    id: format!("hianime:{}|{}", real_id, e.episode_id),
                    number: e.number as f32,
                    url: format!("https://hianime.to/watch/{}", e.episode_id),
                }).collect())
            },
            Err(e) => Err(format!("HiAnime Error: {}", e)),
        }
    } else {
        // Default to Anitaku if not AllAnime
        // AWI removed
        get_anitaku_episodes(anime_id).await
    }
}

pub async fn get_awi_episodes(anime_id: &str) -> Result<Vec<Episode>, String> {
    Err("AWI Provider Removed".to_string())
}

pub async fn get_anitaku_episodes(anime_id: &str) -> Result<Vec<Episode>, String> {
    // ... existing logic ...
    println!("DEBUG: Fetching episodes from Anitaku for: {}", anime_id);
    let client = Client::new();
    let url = format!("{}/category/{}", BASE_URL, anime_id);
    
    let res = client.get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html_text = res.text().await.map_err(|e| e.to_string())?;

    // Enum to break dependency on non-Send Html struct across await points
    enum ParsingStep {
        AjaxFetch { movie_id: String, alias: String },
        DirectResult(Vec<Episode>),
        Failure(String),
    }

    let next_step = {
        let document = Html::parse_document(&html_text);

        // Try extracting params for AJAX
        let movie_id_opt = document.select(&Selector::parse("input#movie_id").unwrap()).next()
            .map(|n| n.value().attr("value").unwrap_or("").to_string());
            
        let alias_opt = document.select(&Selector::parse("input#alias_anime").unwrap()).next()
            .map(|n| n.value().attr("value").unwrap_or("").to_string());

        if let (Some(movie_id), Some(alias)) = (movie_id_opt, alias_opt) {
            ParsingStep::AjaxFetch { movie_id, alias }
        } else {
            // Fallback: Direct Scraping
            println!("DEBUG: movie_id not found. Falling back to direct HTML parsing.");
            
            // Try #episode_related li a
            let episodes = parse_episodes_from_list(&document, "#episode_related li a");
            
            if !episodes.is_empty() {
                ParsingStep::DirectResult(episodes)
            } else {
                ParsingStep::Failure("No episodes found (both AJAX and direct parse failed)".to_string())
            }
        }
    }; // document is dropped here, so we are safe to await

    match next_step {
        ParsingStep::AjaxFetch { movie_id, alias } => {
            println!("DEBUG: Found movie_id: {}, alias: {}. Using AJAX fetch.", movie_id, alias);

            let ajax_url = format!("{}/ajax/load-list-episode?ep_start=0&ep_end=9999&id={}&default_ep=0&alias={}", AJAX_URL, movie_id, alias);
            
            let ajax_res = client.get(&ajax_url)
                .header("User-Agent", USER_AGENT)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            let ajax_html = ajax_res.text().await.map_err(|e| e.to_string())?;
            // New document for AJAX response
            let ajax_doc = Html::parse_document(&ajax_html);
            
            let episodes = parse_episodes_from_list(&ajax_doc, "li a");
            println!("DEBUG: Found {} episodes via AJAX", episodes.len());
            Ok(episodes)
        },
        ParsingStep::DirectResult(episodes) => {
            println!("DEBUG: Found {} episodes via Direct Parse", episodes.len());
            Ok(episodes)
        },
        ParsingStep::Failure(msg) => Err(msg),
    }
}

fn parse_episodes_from_list(document: &Html, selector_str: &str) -> Vec<Episode> {
    let li_selector = Selector::parse(selector_str).unwrap();
    let name_selector = Selector::parse(".name").unwrap();
    let mut episodes = Vec::new();

    for element in document.select(&li_selector) {
        let href = element.value().attr("href").unwrap_or("").trim().to_string();
        let id = href.trim_start_matches('/').trim().to_string();
        
        let ep_text = element.select(&name_selector).next()
            .map(|el| el.text().collect::<Vec<_>>().join(""))
            .unwrap_or_else(|| element.text().collect::<Vec<_>>().join(""));

        let ep_clean = ep_text.replace("EP", "").replace("Episode", "").trim().to_string();
        let ep_num = ep_clean.parse::<f32>().unwrap_or(0.0);

        episodes.push(Episode {
            id,
            number: ep_num,
            url: format!("{}{}", BASE_URL, href),
        });
    }
    
    episodes.sort_by(|a, b| a.number.partial_cmp(&b.number).unwrap());
    episodes
}

pub async fn get_stream_source(episode_id: &str) -> Result<VideoSource, String> {
    if episode_id.starts_with("allanime:") {
        // ID format: allanime:show_id|ep_num|mode
        let parts: Vec<&str> = episode_id.split('|').collect();
        if parts.len() < 3 {
             return Err("Invalid AllAnime Period ID".to_string());
        }
        let show_id = parts[0].trim_start_matches("allanime:");
        let ep_num = parts[1];
        let mode = parts[2]; // "sub" or "dub"
        
        // Fetch sources
        match allanime::get_video_sources(show_id, mode, ep_num).await {
             Ok(sources) => {
                 // Smart Source Selection (User requested "Best Quality" without UI)
                 println!("DEBUG: AllAnime sources for {}: {:?}", ep_num, sources);

                 let mut candidates: Vec<&crate::extractors::allanime::AllAnimeSource> = sources.iter().collect();

                 // Priority Scoring: Higher is better
                 // Apivtwo/Luf-mp4 are HLS with multi-quality. S-mp4 is usually single file.
                 fn get_score(name: &str, _type: &str) -> i32 {
                     let n = name.to_lowercase();
                     if n.contains("apivtwo") { return 10; }
                     if n.contains("luf-mp4") { return 9; }
                     if n.contains("default") { return 8; }
                     if n.contains("fm-hls") { return 7; } // Prioritize Filemoon (HLS)
                     if n.contains("s-mp4") { return 6; }  // Usually single file, reliable backup
                     if n.contains("yt-mp4") { return 5; }
                     if n.contains("sakura") { return 4; }
                     1
                 }

                 candidates.sort_by(|a, b| {
                     let score_a = get_score(&a.source_name, &a.source_type);
                     let score_b = get_score(&b.source_name, &b.source_type);
                     score_b.cmp(&score_a) // Descending
                 });

                 println!("DEBUG: Sorted Candidates: {:?}", candidates.iter().map(|s| &s.source_name).collect::<Vec<_>>());

                 // Try to resolve sources in order until one works
                 for s in candidates {
                     println!("DEBUG: Attempting to resolve source: {}", s.source_name);
                     match allanime::resolve_source_url(&s.source_url).await {
                         Ok(mut final_url_resolved) => {
                             println!("DEBUG: Resolved successfully: {}", final_url_resolved);
                             
                             // EXTRACTION FOR FILEMOON (Fm-Hls)
                             if s.source_name.contains("Fm-Hls") || final_url_resolved.contains("bysekoze") || final_url_resolved.contains("filemoon") {
                                  println!("DEBUG: Filemoon detected, attempting HLS extraction...");
                                  let client = Client::new();
                                  if let Ok(extracted) = try_extract_hls(&client, &final_url_resolved).await {
                                      println!("DEBUG: Extracted HLS: {}", extracted.url);
                                      final_url_resolved = extracted.url;
                                  } else {
                                      println!("DEBUG: HLS Extraction failed for Filemoon");
                                  }
                             }
                             
                             let final_url = final_url_resolved;
                             // Check for m3u8 explicitly in the final URL
                             let is_hls = s.source_url.contains(".m3u8") || s.source_type == "hls" || final_url.contains(".m3u8");
                             
                             // Force HLS type if extracted from Filemoon (it's always HLS)
                             let is_hls = is_hls || (s.source_name.contains("Fm-Hls") && final_url.contains(".m3u8"));

                             let final_stream_url = if is_hls {
                                 // Route through proxy to handle CORS/Referer for HLS
                                 let headers = serde_json::json!({
                                     "Referer": "https://allanime.day",
                                     "User-Agent": USER_AGENT,
                                     "Origin": "https://allanime.day"
                                 }).to_string();
                                 format!(
                                     "http://localhost:1420/api/proxy?url={}&headers={}",
                                     urlencoding::encode(&final_url),
                                     urlencoding::encode(&headers)
                                 )
                             } else {
                                 final_url
                             };

                             return Ok(VideoSource {
                                 url: final_stream_url,
                                 quality: "default".to_string(), 
                                 is_m3u8: is_hls,
                                 subtitles: Vec::new(), 
                                 audio_tracks: Vec::new(),
                                 provider: "Diamond".to_string(),
                                 provider_id: "allanime".to_string(),
                             });
                         },
                         Err(e) => {
                             println!("DEBUG: Failed to resolve source '{}': {}", s.source_name, e);
                             // Continue to next candidate
                         }
                     }
                 }
                 
                 Err("No playable sources found (all candidates failed resolution)".to_string())
             },
             Err(e) => Err(format!("AllAnime Source Error: {}", e)),
        }
    } else if episode_id.starts_with("hianime:") {
        // hianime:id|ep_id  OR  hianime:id|ep_id|category
        let parts: Vec<&str> = episode_id.split('|').collect();
        if parts.len() < 2 { return Err("Invalid HiAnime ID format".to_string()); }
        let ep_id = parts[1];
        let category = if parts.len() >= 3 { parts[2] } else { "sub" };
        
        println!("DEBUG: HiAnime Direct stream: ep_id={}, category={}", ep_id, category);
        
        match hianime::get_sources(ep_id, category).await {
            Ok(data) => {
                if let Some(src) = data.sources.first() {
                    // Map subtitle tracks (skip thumbnails)
                    let mut tracks = Vec::new();
                    if let Some(ts) = data.tracks {
                         for t in ts {
                             if t.kind == "captions" {
                                 tracks.push(SubtitleTrack {
                                     label: t.label.unwrap_or("English".to_string()),
                                     file: t.file,
                                     kind: "captions".to_string(),
                                 });
                             }
                         }
                    }
                    
                    // Proxy the M3U8 with MegaCloud referer for CORS
                    let is_hls = src.source_type == "hls" || src.url.contains(".m3u8");
                    let final_url = if is_hls {
                        let headers = serde_json::json!({
                            "Referer": "https://megacloud.blog/",
                            "Origin": "https://megacloud.blog/",
                            "User-Agent": USER_AGENT
                        }).to_string();
                        format!(
                            "http://localhost:1420/api/proxy?url={}&headers={}",
                            urlencoding::encode(&src.url),
                            urlencoding::encode(&headers)
                        )
                    } else {
                        src.url.clone()
                    };
                    
                    println!("DEBUG: HiAnime Direct stream SUCCESS: {} (hls={})", &src.url[..std::cmp::min(80, src.url.len())], is_hls);
                    
                    return Ok(VideoSource {
                        url: final_url,
                        quality: "auto".to_string(),
                        is_m3u8: is_hls,
                        subtitles: tracks,
                        audio_tracks: Vec::new(), 
                        provider: "Gold".to_string(),
                        provider_id: "hianime".to_string(),
                    });
                }
                Err("No sources in HiAnime response".to_string())
            },
            Err(e) => Err(format!("HiAnime Source Error: {}", e)),
        }
    } else {
        // AWI removal from get_stream_source
        get_anitaku_stream(episode_id).await
    }
}


pub async fn get_awi_stream(episode_id: &str) -> Result<VideoSource, String> {
    Err("AWI Provider Removed".to_string())
}

pub async fn get_anitaku_stream(episode_id: &str) -> Result<VideoSource, String> {
    // ... existing Anitaku logic ...
    println!("DEBUG: Fetching Anitaku stream for: {}", episode_id);
    let client = Client::new();
    let url = format!("{}/{}", BASE_URL, episode_id);

    let res = client.get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = res.text().await.map_err(|e| e.to_string())?;

    // Extract embed URL using multiple strategies
    let embed_url = {
        let document = Html::parse_document(&html);
        
        // Strategy A: .play-video iframe (often empty now)
        let iframe_selector = Selector::parse(".play-video iframe").unwrap();
        let iframe_src = document.select(&iframe_selector).next()
            .and_then(|el| el.value().attr("src"))
            .map(|s| s.to_string());
            
        // Strategy B: .anime_muti_link ul li a[data-video] (Server list)
            // Strategy B: .anime_muti_link ul li a[data-video] (Server list)
        let server_selector = Selector::parse(".anime_muti_link ul li a[data-video]").unwrap();
        
        let mut best_server_src: Option<String> = None;
        let mut first_server_src: Option<String> = None;

        for element in document.select(&server_selector) {
             if let Some(mut url) = element.value().attr("data-video").map(|s| s.to_string()) {
                 if !url.starts_with("http") && url.starts_with("//") {
                     url = format!("https:{}", url);
                 }
                 
                 // Prioritize FILEMOON as we have a working extractor for it (no ads!)
                 if url.to_lowercase().contains("moon") || url.to_lowercase().contains("fembed") {
                     println!("DEBUG: Found preferred server (Filemoon): {}", url);
                     best_server_src = Some(url);
                     break;
                 }
                 
                 if first_server_src.is_none() {
                     first_server_src = Some(url);
                 }
             }
        }
        
        // Use best server (Filemoon) or fallback to first one (GogoStream/Vidstreaming)
        let final_server_src = best_server_src.or(first_server_src);
             
        match (final_server_src, iframe_src) {
            (Some(s), _) if !s.is_empty() => s,
            (_, Some(s)) if !s.is_empty() => {
                 if s.starts_with("//") { format!("https:{}", s) } else { s }
            },
            _ => return Err("No valid stream URL found".to_string()),
        }
    };
    
    // Try to extract direct HLS from the embed page
    match try_extract_hls(&client, &embed_url).await {
        Ok(video_source) => Ok(video_source),
        Err(e) => {
            println!("DEBUG: HLS extraction failed for embed: {}. Error: {}", embed_url, e);
            
            // FALLBACK: Try GogoCDN AES decryption (Seanime-inspired)
            // The GogoCDN embed page sometimes has encrypted stream data in data-value attributes
            println!("DEBUG: Attempting GogoCDN AES fallback...");
            
            let gogocdn_key = "6315b93606d60f48c964b67b14701f3848ef25af01296cf7e6a98c9460e1d2ac";
            
            // Fetch the embed page HTML
            if let Ok(embed_res) = client.get(&embed_url)
                .header("User-Agent", USER_AGENT)
                .header("Referer", BASE_URL)
                .send()
                .await {
                if let Ok(embed_html) = embed_res.text().await {
                    // Look for encrypted data in script tags or data-value attributes
                    let embed_doc = Html::parse_document(&embed_html);
                    let crypto_selector = Selector::parse("script[data-name='episode']").unwrap_or_else(|_| Selector::parse("script").unwrap());
                    
                    for script_el in embed_doc.select(&crypto_selector) {
                        if let Some(encrypted_data) = script_el.value().attr("data-value") {
                            println!("DEBUG: Found encrypted data-value, attempting decrypt...");
                            match gogaes::decrypt_aes_crypto_js(encrypted_data, gogocdn_key) {
                                Ok(decrypted) => {
                                    println!("DEBUG: GogoCDN decrypted: {}", &decrypted[..std::cmp::min(200, decrypted.len())]);
                                    // Parse the decrypted JSON for stream URL
                                    if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&decrypted) {
                                        if let Some(source) = json_val.get("source")
                                            .or(json_val.get("source_bk"))
                                            .and_then(|v| v.as_array())
                                            .and_then(|arr| arr.first())
                                            .and_then(|s| s.get("file"))
                                            .and_then(|f| f.as_str()) {
                                            println!("DEBUG: GogoCDN fallback SUCCESS: {}", source);
                                            return Ok(VideoSource {
                                                url: source.to_string(),
                                                quality: "default".to_string(),
                                                is_m3u8: source.contains(".m3u8"),
                                                subtitles: Vec::new(),
                                                audio_tracks: Vec::new(),
                                                provider: "Silver".to_string(),
                                                provider_id: "anitaku-gogocdn".to_string(),
                                            });
                                        }
                                    }
                                    // If JSON parse fails, look for raw m3u8 URL in decrypted text
                                    if let Some(m3u8_start) = decrypted.find("https://") {
                                        if let Some(m3u8_end) = decrypted[m3u8_start..].find(".m3u8") {
                                            let m3u8_url = &decrypted[m3u8_start..m3u8_start + m3u8_end + 5];
                                            println!("DEBUG: GogoCDN raw m3u8 fallback: {}", m3u8_url);
                                            return Ok(VideoSource {
                                                url: m3u8_url.to_string(),
                                                quality: "default".to_string(),
                                                is_m3u8: true,
                                                subtitles: Vec::new(),
                                                audio_tracks: Vec::new(),
                                                provider: "Silver".to_string(),
                                                provider_id: "anitaku-gogocdn".to_string(),
                                            });
                                        }
                                    }
                                },
                                Err(decrypt_err) => {
                                    println!("DEBUG: GogoCDN decrypt failed: {}", decrypt_err);
                                }
                            }
                        }
                    }
                }
            }
            
            println!("DEBUG: All extraction methods failed for Anitaku");
            Err(format!("Stream extraction failed (Filemoon + GogoCDN): {}", e))
        }
    }
}

// --- FILEMOON TYPES ---
#[derive(Deserialize, Debug)]
pub struct FilemoonPlaybackResponse {
    pub playback: FilemoonPlaybackData,
}

#[derive(Deserialize, Debug)]
pub struct FilemoonPlaybackData {
    pub iv: String,
    pub payload: String,
    pub key_parts: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct FilemoonSourceObj {
    pub url: String,
}

#[derive(Deserialize, Debug)]
pub struct FilemoonDecrypted {
    pub sources: Vec<FilemoonSourceObj>,
}

pub async fn try_extract_hls(client: &Client, embed_url: &str) -> Result<VideoSource, String> {
    println!("DEBUG: Filemoon extraction for {}", embed_url);

    // 1. Extract ID from URL
    let parsed_url = reqwest::Url::parse(embed_url).map_err(|e| e.to_string())?;
    let domain = parsed_url.host_str().ok_or("No host in URL")?;
    
    let path_segments: Vec<&str> = parsed_url.path_segments().ok_or("No path segments")?.collect();
    // Usually /e/{id} or sometimes /v/{id} or just /{id}
    // We look for the ID. Usually the last segment if not empty.
    let video_id = if path_segments.len() >= 2 && (path_segments[0] == "e" || path_segments[0] == "v") {
        path_segments[1]
    } else if !path_segments.is_empty() {
        path_segments[0] 
    } else {
        return Err("Could not extract video ID".to_string());
    };

    println!("DEBUG: Resolved Filemoon ID: {}", video_id);

    // 2. Fetch the encrypted payload
    let api_url = format!("https://{}/api/videos/{}/embed/playback", domain, video_id);
    println!("DEBUG: Fetching API: {}", api_url);

    let resp = client.get(&api_url)
        .header("Referer", embed_url)
        .header("User-Agent", USER_AGENT)
        .header("Origin", format!("https://{}", domain))
        .header("Accept", "application/json, text/javascript, */*; q=0.01")
        .header("X-Requested-With", "XMLHttpRequest")
        .header("Sec-Fetch-Dest", "empty")
        .header("Sec-Fetch-Mode", "cors")
        .header("Sec-Fetch-Site", "same-origin")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;



    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("API returned status {}: {}", status, text));
    }

    let json_text = resp.text().await.map_err(|e| format!("Failed to get text: {}", e))?;
    // println!("DEBUG: Raw JSON: {}", json_text);

    let data: FilemoonPlaybackResponse = serde_json::from_str(&json_text)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // 3. Reconstruct Key
    let mut combined_key = Vec::new();
    for part in &data.playback.key_parts {
       let part_bytes = general_purpose::URL_SAFE_NO_PAD
           .decode(part)
           .map_err(|e| format!("Base64 decode key part failed: {}", e))?;
       combined_key.extend(part_bytes);
    }

    if combined_key.len() != 32 {
        return Err(format!("Invalid key length: {}. Expected 32 for AES-256.", combined_key.len()));
    }

    // 4. Decrypt
    let iv_bytes = general_purpose::URL_SAFE_NO_PAD
        .decode(&data.playback.iv)
        .map_err(|e| format!("Base64 decode IV failed: {}", e))?;
    
    let payload_bytes = general_purpose::URL_SAFE_NO_PAD
        .decode(&data.playback.payload)
        .map_err(|e| format!("Base64 decode Payload failed: {}", e))?;

    let cipher = Aes256Gcm::new_from_slice(&combined_key)
        .map_err(|e| format!("Cipher init failed: {}", e))?;

    let nonce = Nonce::from_slice(&iv_bytes); // 96-bits

    let plaintext = cipher.decrypt(nonce, payload_bytes.as_ref())
        .map_err(|e| format!("Decryption failed (GCM): {}", e))?;

    let plaintext_str = String::from_utf8(plaintext)
        .map_err(|e| format!("Decrypted data is not UTF-8: {}", e))?;

    // println!("DEBUG: Decrypted JSON: {}", plaintext_str);

    let decrypted: FilemoonDecrypted = serde_json::from_str(&plaintext_str)
        .map_err(|e| format!("Failed to parse decrypted JSON: {}", e))?;

    // 5. Return VideoSource
    if let Some(src) = decrypted.sources.first() {
        // Construct Proxy URL to handle Referer/CORS
        let headers = serde_json::json!({
            "Referer": embed_url,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": format!("https://{}", domain)
        }).to_string();

        let proxy_url = format!(
            "http://localhost:1420/api/proxy?url={}&headers={}",
            urlencoding::encode(&src.url),
            urlencoding::encode(&headers)
        );

        return Ok(VideoSource {
            url: proxy_url,
            quality: "Auto".to_string(), // HLS is usually auto
            is_m3u8: true,
            subtitles: Vec::new(),
            audio_tracks: Vec::new(),
            provider: "Gold (Anitaku)".to_string(),
            provider_id: "gogo".to_string(), // Gold = Gogo/Anitaku
        });
    }

    Err("No sources found in decrypted payload".to_string())
}


#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_frieren_stream_extraction() {
        let ep_id = "frieren-beyond-journeys-end-season-2-episode-1";
        // ... (existing test) ...

    }
}

#[cfg(test)]
mod allanime_tests {
    use crate::extractors::allanime;

    #[tokio::test]
    async fn test_demon_slayer_episodes() {
        let show_id = "gvwLtiYciaenJRoFy";
        println!("TEST: Checking available episodes for MAIN series: {}", show_id);
        
        println!("TEST: Fetching SUB episodes...");
        match allanime::get_episodes(show_id, "sub").await {
            Ok(eps) => {
                println!("TEST: SUB episodes count: {}", eps.len());
                for ep in eps.iter().take(5) {
                    println!("TEST: Ep {}: {}", ep.episode_number, ep.link);
                }
            },
            Err(e) => println!("TEST: SUB Error: {}", e),
        }
        
        println!("TEST: Fetching DUB episodes...");
        match allanime::get_episodes(show_id, "dub").await {
            Ok(eps) => {
                println!("TEST: DUB episodes count: {}", eps.len());
            },
            Err(e) => println!("TEST: DUB Error: {}", e),
        }
    }
    
    #[tokio::test]
    async fn test_allanime_search_demon_slayer() {
        println!("TEST: Searching AllAnime for 'Demon Slayer'");
        match allanime::search("Demon Slayer", "sub").await {
            Ok(results) => {
                println!("TEST: Found {} results", results.len());
                for r in results.iter().take(10) {
                    println!("TEST: [{}] {} - Sub:{} Dub:{}", r._id, r.name, r.available_episodes.sub, r.available_episodes.dub);
                }
            },
            Err(e) => println!("TEST: Error: {}", e),
        }
        
        println!("\nTEST: Searching AllAnime for 'Kimetsu no Yaiba'");
        match allanime::search("Kimetsu no Yaiba", "sub").await {
            Ok(results) => {
                println!("TEST: Found {} results", results.len());
                for r in results.iter().take(10) {
                    println!("TEST: [{}] {} - Sub:{} Dub:{}", r._id, r.name, r.available_episodes.sub, r.available_episodes.dub);
                }
            },
            Err(e) => println!("TEST: Error: {}", e),
        }
    }
    
    #[tokio::test]
    async fn test_allanime_search_one_piece() {
        println!("TEST: Searching AllAnime for 'One Piece'");
        match allanime::search("One Piece", "sub").await {
            Ok(results) => {
                println!("TEST: Found {} results", results.len());
                let mut sorted = results.clone();
                sorted.sort_by(|a, b| b.available_episodes.sub.cmp(&a.available_episodes.sub));
                
                println!("\nTOP 15 by episode count:");
                for r in sorted.iter().take(15) {
                    println!("TEST: [{}] {} - Sub:{} Dub:{}", r._id, r.name, r.available_episodes.sub, r.available_episodes.dub);
                }
            },
            Err(e) => println!("TEST: Error: {}", e),
        }
    }
}
