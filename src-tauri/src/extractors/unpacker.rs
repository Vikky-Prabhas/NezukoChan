use regex::Regex;

pub fn unpack(script: &str) -> Option<String> {
    // Regex for P.A.C.K.E.R. pattern
    let re = Regex::new(r"eval\(function\(p,a,c,k,e,d\).*?return p\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)").ok()?;
    
    let caps = re.captures(script)?;
    let payload = caps.get(1)?.as_str();
    let _radix = caps.get(2)?.as_str().parse::<usize>().ok()?; // usually 36
    let count = caps.get(3)?.as_str().parse::<usize>().ok()?;
    let keywords = caps.get(4)?.as_str().split('|').collect::<Vec<&str>>();

    let mut decoded = payload.to_string();
    
    // Reverse logic of P.A.C.K.E.R.
    // Replace base36 encoded variable names with the keywords from the list
    for i in (0..count).rev() {
        let keyword = if keywords[i].is_empty() {
             to_base36(i)
        } else {
             keywords[i].to_string()
        };
        
        let token = to_base36(i);
        
        // This is a simplified replacement. Real implementation needs robust word boundary regex.
        // We will match word boundaries \b to avoid partial replacements.
        if let Ok(re_token) = Regex::new(&format!(r"\b{}\b", token)) {
            decoded = re_token.replace_all(&decoded, &keyword).to_string();
        }
    }

    Some(decoded)
}

fn to_base36(mut n: usize) -> String {
    let chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    if n == 0 {
        return "0".to_string();
    }
    let mut result = String::new();
    while n > 0 {
        result.insert(0, chars.chars().nth(n % 36).unwrap());
        n /= 36;
    }
    result
}
