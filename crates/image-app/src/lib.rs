use wasm_bindgen::prelude::*;
use image::{DynamicImage, ImageFormat};
use std::io::Cursor;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// --- ヘルパー関数 ---
fn to_bytes(img: &DynamicImage) -> Vec<u8> {
    let mut buffer = Cursor::new(Vec::new());
    img.write_to(&mut buffer, ImageFormat::Png).unwrap();
    buffer.into_inner()
}

fn load_image(image_data: &[u8]) -> DynamicImage {
    image::load_from_memory(image_data).unwrap()
}

// --- JavaScriptに公開する関数 ---

#[wasm_bindgen]
pub fn adjust_brightness(image_data: &[u8], value: i32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = img.brighten(value);
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_contrast(image_data: &[u8], value: f32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = img.adjust_contrast(value);
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_saturation(image_data: &[u8], value: f32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = img.huerotate(value as i32);
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn rotate(image_data: &[u8], angle: u32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = match angle {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img,
    };
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn crop(image_data: &[u8], x: u32, y: u32, width: u32, height: u32) -> Vec<u8> {
    let img = load_image(image_data);
    if x + width > img.width() || y + height > img.height() {
        log("Error: Crop area is out of bounds.");
        return image_data.to_vec();
    }
    let processed = img.crop_imm(x, y, width, height);
    to_bytes(&processed)
}


#[wasm_bindgen]
pub fn adjust_white_balance(image_data: &[u8], value: f32) -> Vec<u8> {
    let mut img = load_image(image_data);
    let factor = value / 100.0; // -1.0 (寒色) to 1.0 (暖色)

    if let Some(rgb_img) = img.as_mut_rgb8() {
        for pixel in rgb_img.pixels_mut() {
            let mut r = pixel[0] as f32;
            let mut b = pixel[2] as f32;

            if factor > 0.0 { // 暖色に
                r += 30.0 * factor;
                b -= 30.0 * factor;
            } else { // 寒色に
                r += 30.0 * factor;
                b -= 30.0 * factor;
            }
            
            pixel[0] = r.clamp(0.0, 255.0) as u8;
            pixel[2] = b.clamp(0.0, 255.0) as u8;
        }
    }
    to_bytes(&img)
}