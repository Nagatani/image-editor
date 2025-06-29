use wasm_bindgen::prelude::*;
use image::{DynamicImage, ImageFormat, GenericImageView};
use std::io::Cursor;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Convert a DynamicImage to PNG bytes
/// 
/// # Arguments
/// * `img` - The image to convert
/// 
/// # Returns
/// Vector of PNG-encoded bytes
pub fn to_bytes(img: &DynamicImage) -> Vec<u8> {
    let mut buffer = Cursor::new(Vec::new());
    img.write_to(&mut buffer, ImageFormat::Png).unwrap();
    buffer.into_inner()
}

/// Load an image from byte array
/// 
/// # Arguments
/// * `image_data` - Byte array containing image data
/// 
/// # Returns
/// DynamicImage instance
pub fn load_image(image_data: &[u8]) -> DynamicImage {
    image::load_from_memory(image_data).unwrap()
}

/// Log a message to browser console
/// 
/// # Arguments
/// * `message` - Message to log
pub fn console_log(message: &str) {
    log(message);
}