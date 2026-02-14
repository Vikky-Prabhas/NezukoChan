use warp::Filter;
use futures::StreamExt;
use std::collections::HashMap;

pub async fn start_proxy_server() {
    // Handle both GET and HEAD for /proxy?url=...&headers=...
    let proxy_route_get = warp::path("proxy")
        .and(warp::get())
        .and(warp::query::<ProxyParams>())
        .and_then(handle_proxy_request);

    let proxy_route_head = warp::path("proxy")
        .and(warp::head())
        .and(warp::query::<ProxyParams>())
        .and_then(handle_proxy_request);

    let proxy_routes = proxy_route_get.or(proxy_route_head);

    // Allow ALL origins, methods, and headers for CORS
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "OPTIONS", "HEAD"])
        .allow_headers(vec![
            "Content-Type", "User-Agent", "Referer", "Cookie", 
            "Accept", "Origin", "X-Requested-With", "Range",
            "Authorization", "Cache-Control"
        ])
        .expose_headers(vec!["Content-Length", "Content-Range", "Accept-Ranges"])
        .max_age(86400); // Cache preflight for 24 hours

    let routes = proxy_routes.with(cors);

    println!("Starting Proxy Server on 0.0.0.0:3030");
    warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
}

#[derive(serde::Deserialize)]
struct ProxyParams {
    url: String,
    headers: Option<String>,
}

async fn handle_proxy_request(params: ProxyParams) -> Result<impl warp::Reply, warp::Rejection> {
    println!("PROXY: Received request for URL: {}", &params.url);
    let client = reqwest::Client::new();
    let mut request_builder = client.get(&params.url);

    // Add custom headers if provided (JSON string)
    let mut has_ua = false;
    if let Some(ref headers_json) = params.headers {
        if let Ok(headers_map) = serde_json::from_str::<HashMap<String, String>>(headers_json) {
            for (key, value) in headers_map {
                if key.eq_ignore_ascii_case("user-agent") {
                    has_ua = true;
                }
                request_builder = request_builder.header(key, value);
            }
        }
    }

    // Always add a User-Agent if not present (some APIs block empty UA)
    if !has_ua {
        request_builder = request_builder.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    }

    println!("PROXY: Sending request to {}", params.url);

    match request_builder.send().await {
        Ok(response) => {
            let status = response.status();
            let headers = response.headers().clone();
            
            // Detect m3u8 by URL extension OR content-type header
            let content_type = headers.get("content-type")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("");
            let is_m3u8 = params.url.contains(".m3u8") 
                || content_type.contains("mpegurl") 
                || content_type.contains("m3u8")
                || params.url.contains("/hls/"); // ZephyrFlick uses /hls/ paths
            
            // For m3u8 files, we need to rewrite relative URLs to absolute URLs
            if is_m3u8 {
                let body_text = response.text().await.unwrap_or_default();
                
                // Extract base URL from original URL
                let base_url = if let Some(pos) = params.url.rfind('/') {
                    &params.url[..=pos]
                } else {
                    &params.url
                };
                
                // Extract origin from URL
                let origin = reqwest::Url::parse(&params.url)
                    .map(|u| format!("{}://{}", u.scheme(), u.host_str().unwrap_or("")))
                    .unwrap_or_default();
                
                // Reuse headers for segment requests
                let headers_param = params.headers.clone().unwrap_or_default();
                
                // Proxy base URL (Vite proxy)
                let proxy_base = "http://localhost:1420/api/proxy";
                
                println!("PROXY: Rewriting m3u8, base_url: {}, origin: {}", base_url, origin);
                
                // Rewrite all URLs to go through our proxy
                let mut rewritten = String::new();
                for line in body_text.lines() {
                    let trimmed = line.trim();
                    if trimmed.is_empty() || trimmed.starts_with('#') {
                        // Preserve comments and empty lines, but check for URI= in comments
                        if trimmed.contains("URI=\"") {
                            // Rewrite URIs in #EXT-X-KEY or similar tags
                            let rewritten_line = rewrite_uri_in_tag(trimmed, &origin, base_url, proxy_base, &headers_param);
                            rewritten.push_str(&rewritten_line);
                        } else {
                            rewritten.push_str(line);
                        }
                    } else {
                        // Convert to absolute URL first
                        let absolute_url = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
                            trimmed.to_string()
                        } else if trimmed.starts_with('/') {
                            format!("{}{}", origin, trimmed)
                        } else {
                            format!("{}{}", base_url, trimmed)
                        };
                        
                        // Wrap through proxy
                        let proxied = format!(
                            "{}?url={}&headers={}",
                            proxy_base,
                            urlencoding::encode(&absolute_url),
                            urlencoding::encode(&headers_param)
                        );
                        rewritten.push_str(&proxied);
                    }
                    rewritten.push('\n');
                }
                
                println!("PROXY: Rewritten m3u8 ({} bytes -> {} bytes)", body_text.len(), rewritten.len());
                
                let body = warp::hyper::Body::from(rewritten);
                let mut reply = warp::reply::Response::new(body);
                *reply.status_mut() = warp::hyper::StatusCode::from_u16(status.as_u16()).unwrap_or(warp::hyper::StatusCode::INTERNAL_SERVER_ERROR);
                
                // Add CORS and content-type headers
                reply.headers_mut().insert("access-control-allow-origin", "*".parse().unwrap());
                reply.headers_mut().insert("access-control-allow-methods", "GET, POST, OPTIONS, HEAD".parse().unwrap());
                reply.headers_mut().insert("access-control-allow-headers", "*".parse().unwrap());
                reply.headers_mut().insert("content-type", "application/vnd.apple.mpegurl".parse().unwrap());
                
                Ok(reply)
            } else {
                // For non-m3u8 files, stream directly
                let stream = response.bytes_stream().map(|result| {
                    result.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
                });
                let body = warp::hyper::Body::wrap_stream(stream);

                let mut reply = warp::reply::Response::new(body);
                *reply.status_mut() = warp::hyper::StatusCode::from_u16(status.as_u16()).unwrap_or(warp::hyper::StatusCode::INTERNAL_SERVER_ERROR);

                // Add CORS headers
                reply.headers_mut().insert("access-control-allow-origin", "*".parse().unwrap());
                reply.headers_mut().insert("access-control-allow-methods", "GET, POST, OPTIONS, HEAD".parse().unwrap());
                reply.headers_mut().insert("access-control-allow-headers", "*".parse().unwrap());

                // Set content-type
                if params.url.contains(".ts") {
                    reply.headers_mut().insert("content-type", "video/mp2t".parse().unwrap());
                } else if let Some(content_type) = headers.get("content-type") {
                     reply.headers_mut().insert("content-type", content_type.clone());
                }
                
                if let Some(content_length) = headers.get("content-length") {
                    reply.headers_mut().insert("content-length", content_length.clone());
                }

                Ok(reply)
            }
        }
        Err(e) => {
            eprintln!("Proxy Request Failed: {}", e);
            Err(warp::reject::not_found())
        }
    }
}

// Helper function to rewrite URI= attributes in m3u8 tags
fn rewrite_uri_in_tag(line: &str, origin: &str, base_url: &str, proxy_base: &str, headers_param: &str) -> String {
    use regex::Regex;
    let re = Regex::new(r#"URI="([^"]+)""#).unwrap();
    re.replace_all(line, |caps: &regex::Captures| {
        let uri = &caps[1];
        // Convert to absolute URL first
        let absolute_url = if uri.starts_with("http://") || uri.starts_with("https://") {
            uri.to_string()
        } else if uri.starts_with('/') {
            format!("{}{}", origin, uri)
        } else {
            format!("{}{}", base_url, uri)
        };
        // Wrap through proxy
        format!(
            "URI=\"{}?url={}&headers={}\"",
            proxy_base,
            urlencoding::encode(&absolute_url),
            urlencoding::encode(headers_param)
        )
    }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rewrite_m3u8_logic() {
        let origin = "https://example.com";
        let base_url = "https://example.com/hls/";
        let proxy_base = "http://localhost:3030/proxy";
        let headers_json = r#"{"Referer":"https://ref.com"}"#;

        // Test 1: Absolute URL in URI tag
        let input = r#"#EXT-X-media:TYPE=AUDIO,URI="https://other.com/audio.m3u8""#;
        let output = rewrite_uri_in_tag(input, origin, base_url, proxy_base, headers_json);
        assert!(output.contains(proxy_base));
        assert!(output.contains("url=https%3A%2F%2Fother.com%2Faudio.m3u8"));
        assert!(output.contains("headers=%7B%22Referer%22%3A%22https%3A%2F%2Fref.com%22%7D"));

        // Test 2: Relative URL (no slash)
        let input_rel = r#"#EXT-X-media:URI="720p.m3u8""#;
        let output_rel = rewrite_uri_in_tag(input_rel, origin, base_url, proxy_base, headers_json);
        assert!(output_rel.contains("url=https%3A%2F%2Fexample.com%2Fhls%2F720p.m3u8"));

        // Test 3: Relative URL (with slash)
        let input_slash = r#"#EXT-X-media:URI="/root/720p.m3u8""#;
        let output_slash = rewrite_uri_in_tag(input_slash, origin, base_url, proxy_base, headers_json);
        assert!(output_slash.contains("url=https%3A%2F%2Fexample.com%2Froot%2F720p.m3u8"));
    }
}
