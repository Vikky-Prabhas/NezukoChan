use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let candidates = vec![
        "https://hianime-api-gamma.vercel.app/api/v2/hianime",
        "https://aniwatch-api-v2.vercel.app/api/v2/hianime",
        "https://aniwatch-api-net.vercel.app/api/v2/hianime",
    ];
    
    // We need a valid episode ID. Assuming one-piece-100?ep=2145 from previous run (or similar)
    // Actually, I need to fetch the episode ID first from the instance itself to be sure.
    // But let's assume valid ID format `one-piece-100?ep=2145` (standard for this API).
    
    // Let's first fetch one valid episode ID from the first candidate that works for episodes.
    let mut valid_ep_id = String::new();
    
    for base in &candidates {
         let eps_url = format!("{}/anime/one-piece-100/episodes", base);
         println!("Trying Episodes on: {}", base);
         if let Ok(res) = client.get(&eps_url).send().await {
             if res.status().is_success() {
                 if let Ok(json) = res.json::<serde_json::Value>().await {
                     if let Some(ep) = json.get("data").and_then(|d| d.get("episodes")).and_then(|e| e.get(0)) {
                         if let Some(id) = ep.get("episodeId").and_then(|s| s.as_str()) {
                             valid_ep_id = id.to_string();
                             println!("Got Episode ID: {} from {}", valid_ep_id, base);
                             break;
                         }
                     }
                 }
             }
         }
    }
    
    if valid_ep_id.is_empty() {
        println!("Could not find any working instance for Episodes.");
        valid_ep_id = "one-piece-100?ep=2145".to_string(); // Fallback guess
    }
    
    println!("\n--- Testing Sources for {} ---", valid_ep_id);
    
    for base in &candidates {
        let src_url = format!("{}/episode/sources?animeEpisodeId={}&server=hd-1&category=sub", base, valid_ep_id);
        println!("Trying Sources on: {}", base);
        match client.get(&src_url).send().await {
            Ok(res) => {
                println!("Status: {}", res.status());
                if res.status().is_success() {
                    let text = res.text().await?;
                    println!("SUCCESS! Body: {:.300}", text);
                    println!("WORKING API FOUND: {}", base);
                    return Ok(());
                }
            },
            Err(_) => println!("Connection failed."),
        }
    }
    
    println!("All candidates failed.");
    Ok(())
}
