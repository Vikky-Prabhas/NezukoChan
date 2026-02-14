// debug_quality.rs — Fixed stale AWI import, only AllAnime search test remains.
#[cfg(test)]
mod tests {
    use crate::extractors::allanime;

    #[tokio::test]
    async fn debug_demon_slayer_search() {
        println!("\n=== DEBUG: SEARCHING DEMON SLAYER (ALLANIME) ===");
        match allanime::search("Demon Slayer", "sub").await {
            Ok(results) => {
                println!("Found {} results:", results.len());
                for r in results.iter().take(10) {
                     println!("- [{}] {} ({} eps) | Available: sub={} dub={}", r._id, r.name, r.available_episodes.sub, r.available_episodes.sub, r.available_episodes.dub);
                }
            },
            Err(e) => println!("ERROR: {}", e),
        }
    }
}
