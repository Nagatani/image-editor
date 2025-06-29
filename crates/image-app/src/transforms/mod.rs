use wasm_bindgen::prelude::*;
use image::GenericImageView;
use crate::utils::{load_image, to_bytes, console_log};

/// Rotate image by fixed angles (90, 180, 270 degrees)
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `angle` - Rotation angle in degrees (90, 180, or 270)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn rotate(image_data: &[u8], angle: u32) -> Vec<u8> {
    let img = load_image(image_data);
    let processed = match angle {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => {
            console_log(&format!("Warning: Unsupported rotation angle {}, returning original image", angle));
            img
        },
    };
    
    to_bytes(&processed)
}

/// Flip image horizontally
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn flip_horizontal(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Flip horizontal function called");
    
    let processed = img.fliph();
    console_log("Horizontal flip successful");
    
    to_bytes(&processed)
}

/// Flip image vertically
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn flip_vertical(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Flip vertical function called");
    
    let processed = img.flipv();
    console_log("Vertical flip successful");
    
    to_bytes(&processed)
}

/// Resize image to specified dimensions
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `width` - Target width in pixels
/// * `height` - Target height in pixels
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn resize(image_data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Resize function called");
    
    if width == 0 || height == 0 {
        console_log("Error: Width and height must be greater than 0");
        return image_data.to_vec();
    }
    
    let processed = img.resize(width, height, image::imageops::FilterType::Lanczos3);
    console_log("Resize successful");
    
    to_bytes(&processed)
}

/// Crop image to specified rectangle
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `x` - X coordinate of crop area
/// * `y` - Y coordinate of crop area
/// * `width` - Width of crop area
/// * `height` - Height of crop area
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn crop(image_data: &[u8], x: u32, y: u32, width: u32, height: u32) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Crop function called");
    
    if x + width > img.width() || y + height > img.height() {
        console_log("Error: Crop area is out of bounds.");
        return image_data.to_vec();
    }
    
    let processed = img.crop_imm(x, y, width, height);
    console_log("Crop successful");
    
    to_bytes(&processed)
}

/// Rotate image by arbitrary angle
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `angle` - Rotation angle in degrees (any float value)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn rotate_arbitrary(image_data: &[u8], angle: f32) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Arbitrary rotation function called");
    
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
    
    console_log("Arbitrary rotation successful");
    
    to_bytes(&processed)
}