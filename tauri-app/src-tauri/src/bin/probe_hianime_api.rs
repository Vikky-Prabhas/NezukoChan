use reqwest::Client;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let api_base = "https://shonenx-aniwatch-instance.vercel.app/api/v2/hianime";
    
    // 1. Test Search API
    // Guessing the endpoint based on standard ANIWATCH-API structure
    // (usually /search?q=...)
    // Dart code didn't use API for search, so I am guessing.
    // If this fails, I'll try to find documentation or standard endpoints for this API (consumet/aniwatch-api).
    
    let query = "One Piece";
    let search_url = format!("{}/search?q={}", api_base, query);
    println!("--- Testing API Search: {} ---", search_url);
    
    let res = client.get(&search_url).send().await;
    match res {
        Ok(r) => {
             println!("Status: {}", r.status());
             if r.status().is_success() {
                 let text = r.text().await?;
                 println!("Body (first 500): {:.500}", text);
             }
        },
        Err(e) => println!("Error: {}", e),
    }

    // 2. Test Episodes API (Known from Dart)
    // I need a valid ID. "one-piece-100" is a good guess.
    let anime_id = "one-piece-100"; 
    let eps_url = format!("{}/anime/{}/episodes", api_base, anime_id);
    println!("\n--- Testing API Episodes: {} ---", eps_url);
    
    let res = client.get(&eps_url).send().await;
    match res {
        Ok(r) => {
             println!("Status: {}", r.status());
             if r.status().is_success() {
                 let text = r.text().await?;
                 println!("Body (first 500): {:.500}", text);
             }
        },
        Err(e) => println!("Error: {}", e),
    }

    Ok(())
}
