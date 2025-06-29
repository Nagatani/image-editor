use wasm_bindgen::prelude::*;
use crate::utils::{load_image, to_bytes, console_log};

/// Apply Gaussian blur to image
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `sigma` - Blur intensity (0.0 to 10.0)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn gaussian_blur(image_data: &[u8], sigma: f32) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Gaussian blur function called");
    
    if sigma <= 0.0 {
        console_log("Sigma must be greater than 0, returning original image");
        return image_data.to_vec();
    }
    
    let processed = img.blur(sigma);
    console_log("Gaussian blur successful");
    to_bytes(&processed)
}

/// Apply sharpening filter to image
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// * `amount` - Sharpening intensity (0.0 to 1.0)
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn sharpen(image_data: &[u8], amount: f32) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Sharpen function called");
    
    if amount <= 0.0 {
        console_log("Amount must be greater than 0, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 for pixel manipulation
    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();
    
    // Create a sharpening kernel (unsharp mask approach)
    // We'll use a simple 3x3 kernel for sharpening
    let kernel = [
        0.0, -amount, 0.0,
        -amount, 1.0 + 4.0 * amount, -amount,
        0.0, -amount, 0.0
    ];
    
    let mut output = image::ImageBuffer::new(width, height);
    
    // Apply the kernel to each pixel (excluding edges)
    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut r_sum: f32 = 0.0;
            let mut g_sum: f32 = 0.0;
            let mut b_sum: f32 = 0.0;
            
            // Apply the 3x3 kernel
            for ky in 0..3 {
                for kx in 0..3 {
                    let px = (x as i32 + kx as i32 - 1) as u32;
                    let py = (y as i32 + ky as i32 - 1) as u32;
                    let pixel = rgb_img.get_pixel(px, py);
                    let weight = kernel[ky * 3 + kx];
                    
                    r_sum += pixel[0] as f32 * weight;
                    g_sum += pixel[1] as f32 * weight;
                    b_sum += pixel[2] as f32 * weight;
                }
            }
            
            let r = r_sum.clamp(0.0, 255.0) as u8;
            let g = g_sum.clamp(0.0, 255.0) as u8;
            let b = b_sum.clamp(0.0, 255.0) as u8;
            
            output.put_pixel(x, y, image::Rgb([r, g, b]));
        }
    }
    
    // Handle edges by copying original pixels
    for y in 0..height {
        for x in 0..width {
            if x == 0 || x == width-1 || y == 0 || y == height-1 {
                output.put_pixel(x, y, *rgb_img.get_pixel(x, y));
            }
        }
    }
    
    let processed = image::DynamicImage::ImageRgb8(output);
    console_log("Sharpen successful");
    
    to_bytes(&processed)
}

/// Convert image to grayscale
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn to_grayscale(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Grayscale conversion function called");
    
    let processed = img.grayscale();
    console_log("Grayscale conversion successful");
    
    to_bytes(&processed)
}

/// Apply sepia effect to image
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn apply_sepia(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Sepia effect function called");
    
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
    console_log("Sepia effect successful");
    
    to_bytes(&processed)
}

/// Apply emboss effect to image
/// 
/// # Arguments
/// * `image_data` - Input image bytes
/// 
/// # Returns
/// Processed image bytes
#[wasm_bindgen]
pub fn apply_emboss(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    console_log("Emboss effect function called");
    
    // Convert to RGB8 format for pixel manipulation
    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();
    
    // Create output buffer
    let mut output = image::ImageBuffer::new(width, height);
    
    // Emboss kernel - creates 3D raised effect
    // This kernel emphasizes edges in a directional manner
    let emboss_kernel = [
        -2.0, -1.0,  0.0,
        -1.0,  1.0,  1.0,
         0.0,  1.0,  2.0
    ];
    
    // Apply emboss filter
    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut r_sum: f32 = 0.0;
            let mut g_sum: f32 = 0.0;
            let mut b_sum: f32 = 0.0;
            
            // Apply the 3x3 emboss kernel
            for ky in 0..3 {
                for kx in 0..3 {
                    let px = (x as i32 + kx as i32 - 1) as u32;
                    let py = (y as i32 + ky as i32 - 1) as u32;
                    let pixel = rgb_img.get_pixel(px, py);
                    let weight = emboss_kernel[ky * 3 + kx];
                    
                    r_sum += pixel[0] as f32 * weight;
                    g_sum += pixel[1] as f32 * weight;
                    b_sum += pixel[2] as f32 * weight;
                }
            }
            
            // Add bias to center the values around middle gray (128)
            // This prevents the image from being too dark
            let bias = 128.0;
            let embossed_r = (r_sum + bias).clamp(0.0, 255.0) as u8;
            let embossed_g = (g_sum + bias).clamp(0.0, 255.0) as u8;
            let embossed_b = (b_sum + bias).clamp(0.0, 255.0) as u8;
            
            output.put_pixel(x, y, image::Rgb([embossed_r, embossed_g, embossed_b]));
        }
    }
    
    // Handle edges by copying original pixels (or setting to gray)
    for y in 0..height {
        for x in 0..width {
            if x == 0 || x == width-1 || y == 0 || y == height-1 {
                // Set edge pixels to middle gray for consistent emboss effect
                output.put_pixel(x, y, image::Rgb([128, 128, 128]));
            }
        }
    }
    
    let processed = image::DynamicImage::ImageRgb8(output);
    console_log("Emboss effect successful");
    to_bytes(&processed)
}