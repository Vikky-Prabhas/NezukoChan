
#[cfg(test)]
mod tests {
    use crate::extractors::allanime::{get_episodes, get_video_sources};

    #[tokio::test]
    async fn test_demon_slayer_episodes() {
        // ID from user logs that returned 0 episodes
        let id = "gvwLtiYciaenJRoFy"; 
        println!("TEST: Fetching episodes for {}", id);
        match get_episodes(id, "dub").await {
            Ok(eps) => {
                println!("TEST: Success! Found {} DUB episodes", eps.len());
                for ep in eps.iter().take(5) {
                    println!("TEST: Ep {}: {}", ep.episode_number, ep.link);
                }
            },
            Err(e) => println!("TEST: Failed: {}", e),
        }
    }

    #[tokio::test]
    async fn test_one_piece_fetching() {
        // ID from user logs that returned 0 episodes
        let id = "ReooPAxPMsHM4KPMY"; 
        println!("TEST: Fetching One Piece episodes for {}", id);
        
        // Try SUB first
        match get_episodes(id, "sub").await {
            Ok(eps) => {
                println!("TEST: Success! Found {} SUB episodes", eps.len());
                if eps.is_empty() {
                    println!("TEST: WARNING - 0 episodes returned!");
                }
                for ep in eps.iter().take(5) {
                    println!("TEST: Ep {}: {}", ep.episode_number, ep.link);
                }
            },
            Err(e) => println!("TEST: SUB Failed: {}", e),
        }
    }

    #[tokio::test]
    async fn test_one_piece_stream() {
        let id = "ReooPAxPMsHM4KPMY";
        let ep_nums = vec!["0", "1"]; 
        let mode = "sub";

        for ep_num in ep_nums {
            println!("TEST: Fetching stream for {} Ep {} ({})", id, ep_num, mode);

            match get_video_sources(id, mode, ep_num).await {
                Ok(sources) => {
                    println!("TEST: Found {} sources for Ep {}", sources.len(), ep_num);
                    for s in sources {
                        println!("TEST: Source: {} ({}) - {}", s.source_name, s.source_type, s.source_url);
                    }
                },
                Err(e) => println!("TEST: Stream Fetch Error for Ep {}: {}", ep_num, e),
            }
        }
    }
}
