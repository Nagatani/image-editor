use wasm_bindgen::prelude::*;
use image::{DynamicImage, ImageFormat, GenericImageView};
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
    log("Crop function called");
    
    if x + width > img.width() || y + height > img.height() {
        log("Error: Crop area is out of bounds.");
        return image_data.to_vec();
    }
    
    let processed = img.crop_imm(x, y, width, height);
    log("Crop successful");
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

#[wasm_bindgen]
pub fn flip_horizontal(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    log("Flip horizontal function called");
    
    let processed = img.fliph();
    log("Horizontal flip successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn flip_vertical(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    log("Flip vertical function called");
    
    let processed = img.flipv();
    log("Vertical flip successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn rotate_arbitrary(image_data: &[u8], angle: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Arbitrary rotation function called");
    
    // Convert angle to radians
    let angle_rad = angle * std::f32::consts::PI / 180.0;
    
    // For arbitrary rotation, we'll use a combination of existing rotations
    // and handle common angles efficiently
    let processed = if (angle % 360.0).abs() < 0.1 {
        // 0 degrees - no rotation
        img
    } else if ((angle % 360.0) - 90.0).abs() < 0.1 {
        // 90 degrees
        img.rotate90()
    } else if ((angle % 360.0) - 180.0).abs() < 0.1 {
        // 180 degrees  
        img.rotate180()
    } else if ((angle % 360.0) - 270.0).abs() < 0.1 {
        // 270 degrees
        img.rotate270()
    } else {
        // For arbitrary angles, we need to implement manual rotation
        // This is a simplified version - in a real implementation, 
        // you would use proper interpolation and handle transparency
        use image::{ImageBuffer, Rgb};
        
        let (width, height) = img.dimensions();
        let center_x = width as f32 / 2.0;
        let center_y = height as f32 / 2.0;
        
        // Calculate new image dimensions after rotation
        let cos_a = angle_rad.cos().abs();
        let sin_a = angle_rad.sin().abs();
        let new_width = ((width as f32) * cos_a + (height as f32) * sin_a).ceil() as u32;
        let new_height = ((height as f32) * cos_a + (width as f32) * sin_a).ceil() as u32;
        
        let mut rotated = ImageBuffer::new(new_width, new_height);
        let new_center_x = new_width as f32 / 2.0;
        let new_center_y = new_height as f32 / 2.0;
        
        for (x, y, pixel) in rotated.enumerate_pixels_mut() {
            // Translate to origin
            let translated_x = x as f32 - new_center_x;
            let translated_y = y as f32 - new_center_y;
            
            // Rotate coordinates (inverse rotation)
            let rotated_x = translated_x * (-angle_rad).cos() - translated_y * (-angle_rad).sin();
            let rotated_y = translated_x * (-angle_rad).sin() + translated_y * (-angle_rad).cos();
            
            // Translate back and map to original image
            let orig_x = (rotated_x + center_x).round() as i32;
            let orig_y = (rotated_y + center_y).round() as i32;
            
            // Check bounds and sample pixel
            if orig_x >= 0 && orig_x < width as i32 && orig_y >= 0 && orig_y < height as i32 {
                let source_pixel = img.get_pixel(orig_x as u32, orig_y as u32);
                *pixel = Rgb([source_pixel[0], source_pixel[1], source_pixel[2]]);
            } else {
                // Background color (white)
                *pixel = Rgb([255, 255, 255]);
            }
        }
        
        image::DynamicImage::ImageRgb8(rotated)
    };
    
    log("Arbitrary rotation successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn resize(image_data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Resize function called");
    
    if width == 0 || height == 0 {
        log("Error: Width and height must be greater than 0");
        return image_data.to_vec();
    }
    
    let processed = img.resize(width, height, image::imageops::FilterType::Lanczos3);
    log("Resize successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn to_grayscale(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    log("Grayscale conversion function called");
    
    let processed = img.grayscale();
    log("Grayscale conversion successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn apply_sepia(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    log("Sepia effect function called");
    
    // Convert to RGB8 format first to ensure we can modify pixels
    let mut rgb_img = img.to_rgb8();
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        
        // Sepia transformation matrix
        let sepia_r = (r * 0.393) + (g * 0.769) + (b * 0.189);
        let sepia_g = (r * 0.349) + (g * 0.686) + (b * 0.168);
        let sepia_b = (r * 0.272) + (g * 0.534) + (b * 0.131);
        
        pixel[0] = sepia_r.min(255.0) as u8;
        pixel[1] = sepia_g.min(255.0) as u8;
        pixel[2] = sepia_b.min(255.0) as u8;
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Sepia effect successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn gaussian_blur(image_data: &[u8], sigma: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Gaussian blur function called");
    
    if sigma <= 0.0 {
        log("Sigma must be greater than 0, returning original image");
        return image_data.to_vec();
    }
    
    let processed = img.blur(sigma);
    log("Gaussian blur successful");
    to_bytes(&processed)
}