use reqwest::Client;
use scraper::{Html, Selector};
use serde_json::Value;

const BASE_URL: &str = "https://hianime.to";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    // 1. Test Search
    println!("--- Testing Search ---");
    let query = "One Piece";
    let search_url = format!("{}/search?keyword={}", BASE_URL, query);
    
    let res = client.get(&search_url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await;
        
    match res {
        Ok(response) => {
            println!("Search Status: {}", response.status());
            if !response.status().is_success() {
                println!("Search Failed with status: {}", response.status());
                // Print body if possible
                if let Ok(text) = response.text().await {
                   println!("Error Body (first 200 chars): {:.200}", text);
                }
                return Ok(());
            }
            
            let html = response.text().await?;
            let document = Html::parse_document(&html);
            let item_selector = Selector::parse(".flw-item").unwrap();
            let name_selector = Selector::parse(".film-name a").unwrap();
            
            let mut anime_id = String::new();
            
            for element in document.select(&item_selector).take(1) {
                if let Some(name_el) = element.select(&name_selector).next() {
                    let name = name_el.text().collect::<Vec<_>>().join("");
                    let href = name_el.value().attr("href").unwrap_or("");
                    println!("Found Anime: {} ({})", name, href);
                    anime_id = href.trim_start_matches('/').to_string();
                    if let Some(idx) = anime_id.find('?') {
                        anime_id = anime_id[..idx].to_string();
                    }
                }
            }
            
            if anime_id.is_empty() {
                println!("Search parsed but found no results.");
            } else {
                 println!("Extracted Anime ID: {}", anime_id);
                 
                 // 2. Test Episode List
                 println!("\n--- Testing Episode List ---");
                 let anime_url = format!("{}/{}", BASE_URL, anime_id);
                 let res_anime = client.get(&anime_url).header("User-Agent", USER_AGENT).send().await?;
                 
                 if res_anime.status().is_success() {
                     let html_anime = res_anime.text().await?;
                     let doc = Html::parse_document(&html_anime);
                     
                     // Try to find data-id
                     let mut data_id = String::new();
                     let wrapper_sel = Selector::parse("#wrapper").unwrap();
                     if let Some(w) = doc.select(&wrapper_sel).next() {
                         if let Some(id) = w.value().attr("data-id") { 
                             data_id = id.to_string(); 
                             println!("Found #wrapper data-id: {}", data_id);
                         }
                     }
                     
                     if data_id.is_empty() {
                         let input_sel = Selector::parse("input#movie_id").unwrap();
                         if let Some(i) = doc.select(&input_sel).next() {
                             if let Some(v) = i.value().attr("value") { 
                                 data_id = v.to_string(); 
                                 println!("Found input#movie_id: {}", data_id);
                             }
                         }
                     }
                     
                     if !data_id.is_empty() {
                         let ajax_url = format!("{}/ajax/v2/episode/list/{}", BASE_URL, data_id);
                         println!("Fetching AJAX: {}", ajax_url);
                         let res_ajax = client.get(&ajax_url)
                             .header("User-Agent", USER_AGENT)
                             .header("X-Requested-With", "XMLHttpRequest")
                             .send()
                             .await?;
                             
                         println!("AJAX Status: {}", res_ajax.status());
                         if res_ajax.status().is_success() {
                             println!("AJAX Success.");
                         }
                     } else {
                         println!("Could not find movie_id in HTML.");
                         // println!("HTML Dump (first 500): {:.500}", html_anime);
                     }
                 } else {
                     println!("Anime Page Failed: {}", res_anime.status());
                 }
            }
        },
        Err(e) => println!("Search Request Error: {}", e),
    }

    Ok(())
}
