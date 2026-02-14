use aes::Aes256;
use cbc::Decryptor;
use cipher::{BlockDecryptMut, KeyIvInit, block_padding::Pkcs7};
use md5::{Digest, Md5};

type Aes256CbcDec = Decryptor<Aes256>;

/// Decrypts a base64-encoded ciphertext using AES-256-CBC with a passphrase.
/// This mirrors the CryptoJS decryption pattern used by Gogoanime.
pub fn decrypt_aes_crypto_js(encrypted_base64: &str, passphrase: &str) -> Result<String, String> {
    // 1. Decode base64
    let encrypted_bytes = base64::decode(encrypted_base64.trim())
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    
    // 2. Check for "Salted__" prefix (CryptoJS format)
    if encrypted_bytes.len() < 16 || &encrypted_bytes[0..8] != b"Salted__" {
        return Err("Invalid CryptoJS format: Missing Salted__ prefix".to_string());
    }
    
    // 3. Extract salt (bytes 8-16)
    let salt = &encrypted_bytes[8..16];
    
    // 4. Actual ciphertext is after the salt
    let ciphertext = &encrypted_bytes[16..];
    
    // 5. Derive key and IV using OpenSSL's EVP_BytesToKey (MD5 based)
    let (key, iv) = derive_key_and_iv(passphrase, salt);
    
    // 6. Decrypt
    let mut buf = ciphertext.to_vec();
    let decryptor = Aes256CbcDec::new_from_slices(&key, &iv)
        .map_err(|e| format!("Cipher init error: {:?}", e))?;
    
    let decrypted = decryptor.decrypt_padded_mut::<Pkcs7>(&mut buf)
        .map_err(|e| format!("Decryption error: {:?}", e))?;
    
    String::from_utf8(decrypted.to_vec())
        .map_err(|e| format!("UTF-8 conversion error: {}", e))
}

/// Derives a 32-byte key and 16-byte IV from a passphrase and salt.
/// Uses OpenSSL's legacy EVP_BytesToKey method (MD5 based).
pub fn derive_key_and_iv(passphrase: &str, salt: &[u8]) -> (Vec<u8>, Vec<u8>) {
    let password = passphrase.as_bytes();
    let mut concatenated_hashes: Vec<u8> = Vec::new();
    let mut current_hash: Vec<u8> = Vec::new();

    // We need 48 bytes total (32 for key + 16 for IV)
    while concatenated_hashes.len() < 48 {
        let mut hasher = Md5::new();
        if !current_hash.is_empty() {
            hasher.update(&current_hash);
        }
        hasher.update(password);
        hasher.update(salt);
        current_hash = hasher.finalize().to_vec();
        concatenated_hashes.extend_from_slice(&current_hash);
    }

    let key = concatenated_hashes[0..32].to_vec();
    let iv = concatenated_hashes[32..48].to_vec();
    (key, iv)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_derivation() {
        // A simple sanity test - real test would need known passphrase/salt/result
        let (key, iv) = derive_key_and_iv("test_passphrase", b"saltsalt");
        assert_eq!(key.len(), 32);
        assert_eq!(iv.len(), 16);
    }
}
