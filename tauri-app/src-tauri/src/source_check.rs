#[cfg(test)]
mod tests {
    use crate::extractors::{allanime, animeworldindia};
    use crate::anime::get_stream_source;

    // A fast way to check what servers give us for a popular show
    #[tokio::test]
    async fn check_one_piece_sources() {
        // ONE PIECE (Sub) - Ep 1000
        // ID construction: allanime:<show_id>|<ep_num>|<mode>
        // One Piece ID on AllAnime is usually "ReOOPFuL7" or similar, but let's use the search to find it first if needed.
        // Actually, let's use a known ID or searching logic.
        
        let show_id = "ReOOPFuL7"; // One Piece
        let ep = "1000";
        let mode = "sub";
        
        println!("\n=== CHECKING ALLANIME SOURCES FOR ONE PIECE EP {} ===", ep);
        let sources = allanime::get_video_sources(show_id, mode, ep).await.unwrap();
        
        for (i, source) in sources.iter().enumerate() {
            println!("#{}: Name='{}', Type='{}'", i, source.source_name, source.source_type);
            // If it's a clock link, we need to resolve it to see the final URL structure (m3u8 vs mp4)
            if source.source_url.contains("clock") || source.source_url.contains("apivtwo") {
                 match allanime::resolve_source_url(&source.source_url).await {
                     Ok(final_url) => {
                         println!("    -> Resolved: {}", final_url);
                         if final_url.contains(".m3u8") {
                             println!("       [MULTI-QUALITY POSSIBLE]");
                         } else {
                             println!("       [SINGLE FILE]");
                         }
                     },
                     Err(e) => println!("    -> Resolve Failed: {}", e),
                 }
            } else {
                println!("    -> Raw: {}", source.source_url);
            }
        }
    }

    #[tokio::test]
    async fn check_awi_sources() {
        println!("\n=== CHECKING AWI SOURCES ===");
        // AWI Search for One Piece
        let results = animeworldindia::search("One Piece").await.unwrap();
        if let Some(first) = results.first() {
            println!("Found AWI Entry: {}", first.title);
            // Get episodes
            let eps = animeworldindia::get_episodes(&first.url).await.unwrap();
            if let Some(ep) = eps.first() {
                 println!("Extaction Stream for First Ep: {}", ep.url);
                 let source = animeworldindia::extract_stream(&ep.url).await.unwrap();
                 println!("Source URL: {}", source.url);
                 println!("Is M3U8: {}", source.is_m3u8);
                 println!("Audio Tracks: {:?}", source.audio_tracks);
                 println!("Subtitles: {:?}", source.subtitles);
            }
        }
    }
}
