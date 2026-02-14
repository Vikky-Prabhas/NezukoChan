use reqwest::Client;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let api_base = "https://shonenx-aniwatch-instance.vercel.app/api/v2/hianime";
    let yuma_base = "https://yumaapi.vercel.app";
    
    // 1. Get Episodes for One Piece
    let anime_id = "one-piece-100";
    let eps_url = format!("{}/anime/{}/episodes", api_base, anime_id);
    println!("1. Fetching Episodes: {}", eps_url);
    
    let res = client.get(&eps_url).send().await?;
    let json: Value = res.json().await?;
    
    // Extract first episode ID
    // structure: data.episodes[0].episodeId
    if let Some(episodes) = json.get("data").and_then(|d| d.get("episodes")).and_then(|e| e.as_array()) {
        if let Some(first_ep) = episodes.first() {
             let ep_id = first_ep.get("episodeId").and_then(|s| s.as_str()).unwrap_or("");
             println!("Found First Episode ID: {}", ep_id); // e.g. one-piece-100?ep=12345
             
             // 2. Fetch Sources (ShonenX API)
             // URL: .../api/v2/hianime/episode/sources?animeEpisodeId=...
             
             let source_url = format!("{}/episode/sources?animeEpisodeId={}&server=hd-1&category=sub", api_base, ep_id);
             println!("2. Fetching Sources (ShonenX): {}", source_url);
             
             let src_res = client.get(&source_url).send().await?;
             println!("Status: {}", src_res.status());
             if src_res.status().is_success() {
                 let src_text = src_res.text().await?;
                 println!("Source Body (first 500): {:.500}", src_text);
             } else {
                 println!("ShonenX Sources Failed: {}", src_res.status());
                 // Try another server if hd-1 fails?
                 // Dart code used 'vidcloud' or 'megacloud'
                 let source_url_2 = format!("{}/episode/sources?animeEpisodeId={}&server=vidcloud&category=sub", api_base, ep_id);
                 println!("Retrying with vidcloud: {}", source_url_2);
                 let src_res_2 = client.get(&source_url_2).send().await?;
                 if src_res_2.status().is_success() {
                      let text = src_res_2.text().await?;
                      println!("Vidcloud Body: {:.500}", text);
                 } else {
                      println!("Vidcloud Failed: {}", src_res_2.status());
                 }
             }
        }
    }

    Ok(())
}
