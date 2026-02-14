use reqwest::Client;
use scraper::{Html, Selector};

#[tokio::main]
async fn main() {
    let client = Client::new();
    
    for page in 1..=10 {
        let url = format!("https://watchanimeworld.net/series/page/{}/", page);
        println!("Scraping Series Page: {}", page);
        
        match client.get(&url).send().await {
            Ok(resp) => {
                if let Ok(html_text) = resp.text().await {
                    let document = Html::parse_document(&html_text);
                    let selector = Selector::parse(".lnk-blk").unwrap();
                    
                    for element in document.select(&selector) {
                        if let Some(href) = element.value().attr("href") {
                            if href.to_lowercase().contains("one-piece") {
                                println!("  FOUND: {}", href);
                            }
                        }
                    }
                }
            },
            Err(_) => println!("  Failed to fetch page {}", page),
        }
    }
}
