use wasm_bindgen::prelude::*;
use image::GenericImageView;
use crate::utils::{load_image, to_bytes, console_log};

/// Adjust image brightness
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `value` - Brightness adjustment (-100 to +100)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn adjust_brightness(image_data: &[u8], value: i32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = img.brighten(value);
    to_bytes(&processed)
}

/// Adjust image contrast
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `value` - Contrast multiplier (0.0 to 3.0, 1.0 = no change)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn adjust_contrast(image_data: &[u8], value: f32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = img.adjust_contrast(value);
    to_bytes(&processed)
}

/// Adjust image saturation/hue
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `value` - Hue rotation in degrees (-180 to +180)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn adjust_saturation(image_data: &[u8], value: f32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = img.huerotate(value as i32);
    to_bytes(&processed)
}

/// Adjust white balance (color temperature)
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `value` - Temperature adjustment (-100 to +100, negative=cooler, positive=warmer)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn adjust_white_balance(image_data: &[u8], value: f32) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("White balance adjustment function called");
    
    if value == 0.0 {
        console_log("No white balance adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Normalize value to -1.0 to 1.0 range
    let factor = value / 100.0; // -1.0 (寒色/cool) to 1.0 (暖色/warm)
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        
        let (new_r, new_g, new_b) = if factor > 0.0 {
            // 暖色に調整 (Make warmer - increase red/orange, decrease blue)
            (
                r + (50.0 * factor),
                g + (20.0 * factor),  // Slightly increase green for natural orange tone
                b - (40.0 * factor)
            )
        } else {
            // 寒色に調整 (Make cooler - decrease red, increase blue)
            let abs_factor = factor.abs();
            (
                r - (40.0 * abs_factor),
                g - (10.0 * abs_factor),  // Slightly decrease green
                b + (50.0 * abs_factor)
            )
        };
        
        pixel[0] = new_r.clamp(0.0, 255.0) as u8;
        pixel[1] = new_g.clamp(0.0, 255.0) as u8;
        pixel[2] = new_b.clamp(0.0, 255.0) as u8;
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    console_log("White balance adjustment successful");
    
    to_bytes(&processed)
}

// Advanced adjustments will be added here...

/// Adjust hue (color rotation)
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `shift` - Hue shift in degrees (-180 to +180)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn adjust_hue(image_data: &[u8], shift: f32) -> Vec<u8> {
    let img = load_image(image_data);
    
    console_log("Hue adjustment function called");
    
    if shift == 0.0 {
        console_log("No hue shift needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Normalize hue shift to -180 to +180 degrees, then convert to 0-360 range
    let hue_shift = ((shift % 360.0) + 360.0) % 360.0;
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32 / 255.0;
        let g = pixel[1] as f32 / 255.0;
        let b = pixel[2] as f32 / 255.0;
        
        // Convert RGB to HSV
        let max = r.max(g.max(b));
        let min = r.min(g.min(b));
        let delta = max - min;
        
        // Calculate HSV values
        let mut h = if delta == 0.0 {
            0.0
        } else if max == r {
            60.0 * (((g - b) / delta) % 6.0)
        } else if max == g {
            60.0 * ((b - r) / delta + 2.0)
        } else {
            60.0 * ((r - g) / delta + 4.0)
        };
        
        if h < 0.0 {
            h += 360.0;
        }
        
        let s = if max == 0.0 { 0.0 } else { delta / max };
        let v = max;
        
        // Apply hue shift
        h = (h + hue_shift) % 360.0;
        
        // Convert back to RGB
        let c = v * s;
        let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
        let m = v - c;
        
        let (r_prime, g_prime, b_prime) = if h < 60.0 {
            (c, x, 0.0)
        } else if h < 120.0 {
            (x, c, 0.0)
        } else if h < 180.0 {
            (0.0, c, x)
        } else if h < 240.0 {
            (0.0, x, c)
        } else if h < 300.0 {
            (x, 0.0, c)
        } else {
            (c, 0.0, x)
        };
        
        let new_r = ((r_prime + m) * 255.0).clamp(0.0, 255.0) as u8;
        let new_g = ((g_prime + m) * 255.0).clamp(0.0, 255.0) as u8;
        let new_b = ((b_prime + m) * 255.0).clamp(0.0, 255.0) as u8;
        
        pixel[0] = new_r;
        pixel[1] = new_g;
        pixel[2] = new_b;
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    console_log("Hue adjustment successful");
    
    to_bytes(&processed)
}