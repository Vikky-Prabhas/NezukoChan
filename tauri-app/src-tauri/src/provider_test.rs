/// Comprehensive provider test — tests all 3 servers end-to-end
/// Run: cargo test --package tauri-app test_all_providers -- --nocapture

#[cfg(test)]
mod provider_test {
    use crate::extractors::{allanime, hianime};
    use crate::anime;

    const TEST_ANIME: &str = "Demon Slayer";

    #[tokio::test]
    async fn test_all_providers() {
        println!("\n============================================================");
        println!("  FULL PROVIDER TEST: '{}'", TEST_ANIME);
        println!("============================================================\n");

        // ========================================================
        // 1. DIAMOND (AllAnime)
        // ========================================================
        println!("DIAMOND (AllAnime) =====");
        
        match allanime::search(TEST_ANIME, "sub").await {
            Ok(results) => {
                println!("  SEARCH: {} results", results.len());
                if let Some(top) = results.first() {
                    println!("  TOP: [{}] {} -- Sub:{} Dub:{} Raw:{}", 
                        top._id, top.name, top.available_episodes.sub, top.available_episodes.dub, top.available_episodes.raw);
                    
                    // Get episodes (SUB)
                    match allanime::get_episodes(&top._id, "sub").await {
                        Ok(eps) => {
                            println!("  EPISODES (SUB): {} total", eps.len());
                            if let Some(ep1) = eps.first() {
                                let url_preview = if ep1.link.len() > 60 { &ep1.link[..60] } else { &ep1.link };
                                println!("  EP1: num={}, link={}...", ep1.episode_number, url_preview);
                                
                                // Get sources
                                match allanime::get_video_sources(&top._id, "sub", &ep1.episode_number).await {
                                    Ok(srcs) => {
                                        println!("  SOURCES: {} servers", srcs.len());
                                        for s in &srcs {
                                            let url_p = if s.source_url.len() > 50 { &s.source_url[..50] } else { &s.source_url };
                                            println!("    - {} [{}] url: {}...", s.source_name, s.source_type, url_p);
                                        }
                                        
                                        // Try resolving top source
                                        if let Some(best) = srcs.first() {
                                            match allanime::resolve_source_url(&best.source_url).await {
                                                Ok(url) => {
                                                    let p = if url.len() > 80 { &url[..80] } else { &url };
                                                    println!("  RESOLVED: {}...", p);
                                                },
                                                Err(e) => println!("  RESOLVE ERR: {}", e),
                                            }
                                        }
                                    },
                                    Err(e) => println!("  SOURCES ERR: {}", e),
                                }
                            }
                        },
                        Err(e) => println!("  EPISODES ERR: {}", e),
                    }
                    
                    // Check DUB too
                    match allanime::get_episodes(&top._id, "dub").await {
                        Ok(eps) => println!("  EPISODES (DUB): {} total", eps.len()),
                        Err(e) => println!("  EPISODES (DUB) ERR: {}", e),
                    }
                }
            },
            Err(e) => println!("  SEARCH ERR: {}", e),
        }

        // ========================================================
        // 2. GOLD (HiAnime -- Direct MegaCloud)
        // ========================================================
        println!("\nGOLD (HiAnime - Direct MegaCloud) =====");
        
        match hianime::search(TEST_ANIME).await {
            Ok(results) => {
                println!("  SEARCH: {} results", results.len());
                for r in results.iter().take(3) {
                    println!("    [{}] {} -- Sub:{:?} Dub:{:?}", r.id, r.name, 
                        r.episodes.as_ref().and_then(|e| e.sub),
                        r.episodes.as_ref().and_then(|e| e.dub));
                }
                
                if let Some(top) = results.first() {
                    // Get episodes
                    match hianime::get_episodes(&top.id).await {
                        Ok(eps) => {
                            println!("  EPISODES: {} total", eps.len());
                            if let Some(ep1) = eps.first() {
                                println!("  EP1: id={}, num={}, title={}", ep1.episode_id, ep1.number, ep1.title);
                                
                                // Get sources (SUB)
                                println!("\n  --- SUB Sources ---");
                                match hianime::get_sources(&ep1.episode_id, "sub").await {
                                    Ok(data) => {
                                        println!("  SOURCES (SUB): {} streams", data.sources.len());
                                        for s in &data.sources {
                                            let is_m3u8 = s.url.contains(".m3u8");
                                            let p = if s.url.len() > 80 { &s.url[..80] } else { &s.url };
                                            println!("    - type={} m3u8={} url={}...", s.source_type, is_m3u8, p);
                                        }
                                        if let Some(tracks) = &data.tracks {
                                            println!("  SUBTITLES: {} tracks", tracks.len());
                                            for t in tracks.iter().take(5) {
                                                let fp = if t.file.len() > 60 { &t.file[..60] } else { &t.file };
                                                println!("    SUB: {} [{}] -- {}", t.label.as_deref().unwrap_or("?"), t.kind, fp);
                                            }
                                        }
                                        if let Some(intro) = &data.intro {
                                            println!("  INTRO: {:?}s -> {:?}s", intro.start, intro.end);
                                        }
                                        if let Some(outro) = &data.outro {
                                            println!("  OUTRO: {:?}s -> {:?}s", outro.start, outro.end);
                                        }
                                    },
                                    Err(e) => println!("  SOURCES (SUB) ERR: {}", e),
                                }
                                
                                // Get sources (DUB)
                                println!("\n  --- DUB Sources ---");
                                match hianime::get_sources(&ep1.episode_id, "dub").await {
                                    Ok(data) => {
                                        println!("  SOURCES (DUB): {} streams", data.sources.len());
                                        for s in &data.sources {
                                            let p = if s.url.len() > 80 { &s.url[..80] } else { &s.url };
                                            println!("    - type={} url={}...", s.source_type, p);
                                        }
                                    },
                                    Err(e) => println!("  SOURCES (DUB) ERR: {}", e),
                                }
                            }
                        },
                        Err(e) => println!("  EPISODES ERR: {}", e),
                    }
                }
            },
            Err(e) => println!("  SEARCH ERR: {}", e),
        }

        // ========================================================
        // 3. SILVER (Anitaku)
        // ========================================================
        println!("\nSILVER (Anitaku) =====");
        
        match anime::search_anitaku(TEST_ANIME).await {
            Ok(results) => {
                println!("  SEARCH: {} results", results.len());
                for r in results.iter().take(5) {
                    println!("    [{}] {} -- lang:{:?}", r.id, r.title, r.language);
                }
                
                // Find SUB version
                let sub_anime = results.iter().find(|r| !r.title.to_lowercase().contains("dub"));
                let dub_anime = results.iter().find(|r| r.title.to_lowercase().contains("dub"));
                
                if let Some(sub_a) = sub_anime {
                    match anime::get_anitaku_episodes(&sub_a.id).await {
                        Ok(eps) => {
                            println!("  EPISODES (SUB '{}'): {} total", sub_a.title, eps.len());
                            if let Some(ep1) = eps.first() {
                                println!("  EP1: id={}, num={}", ep1.id, ep1.number);
                                
                                match anime::get_anitaku_stream(&ep1.id).await {
                                    Ok(src) => {
                                        println!("  STREAM: provider={} m3u8={} quality={}", src.provider, src.is_m3u8, src.quality);
                                        let p = if src.url.len() > 80 { &src.url[..80] } else { &src.url };
                                        println!("    url: {}...", p);
                                        println!("    subtitles: {}", src.subtitles.len());
                                        println!("    audio_tracks: {}", src.audio_tracks.len());
                                    },
                                    Err(e) => println!("  STREAM ERR: {}", e),
                                }
                            }
                        },
                        Err(e) => println!("  EPISODES ERR: {}", e),
                    }
                }
                
                if let Some(dub_a) = dub_anime {
                    match anime::get_anitaku_episodes(&dub_a.id).await {
                        Ok(eps) => {
                            println!("  EPISODES (DUB '{}'): {} total", dub_a.title, eps.len());
                        },
                        Err(e) => println!("  EPISODES (DUB) ERR: {}", e),
                    }
                } else {
                    println!("  DUB: Not found in search results");
                }
            },
            Err(e) => println!("  SEARCH ERR: {}", e),
        }

        println!("\n============================================================");
        println!("  TEST COMPLETE");
        println!("============================================================");
    }
}
