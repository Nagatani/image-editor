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
        _ => {
            log(&format!("Warning: Unsupported rotation angle {}, returning original image", angle));
            img
        },
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
    let img = load_image(image_data);
    
    log("White balance adjustment function called");
    
    
    if value == 0.0 {
        log("No white balance adjustment needed, returning original image");
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
    log("White balance adjustment successful");
    
    to_bytes(&processed)
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

#[wasm_bindgen]
pub fn sharpen(image_data: &[u8], amount: f32) -> Vec<u8> {
    let img = load_image(image_data);
    
    log("Sharpen function called");
    
    if amount <= 0.0 {
        log("Amount must be greater than 0, returning original image");
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
    
    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut r_sum: f32 = 0.0;
            let mut g_sum: f32 = 0.0;
            let mut b_sum: f32 = 0.0;
            
            // Apply kernel
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
            
            // Clamp values to 0-255 range
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
    log("Sharpen successful");
    
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_hue(image_data: &[u8], shift: f32) -> Vec<u8> {
    let img = load_image(image_data);
    
    log("Hue adjustment function called");
    
    
    if shift == 0.0 {
        log("No hue shift needed, returning original image");
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
        
        // Convert HSV back to RGB
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
    log("Hue adjustment successful");
    
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_exposure(image_data: &[u8], stops: f32) -> Vec<u8> {
    let img = load_image(image_data);
    
    log("Exposure adjustment function called");
    
    if stops == 0.0 {
        log("No exposure adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Calculate exposure multiplier: each stop doubles or halves the exposure
    // Positive stops brighten, negative stops darken
    let exposure_multiplier = 2.0_f32.powf(stops);
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32 / 255.0;
        let g = pixel[1] as f32 / 255.0;
        let b = pixel[2] as f32 / 255.0;
        
        // Apply exposure adjustment in linear space
        let new_r = (r * exposure_multiplier).clamp(0.0, 1.0);
        let new_g = (g * exposure_multiplier).clamp(0.0, 1.0);
        let new_b = (b * exposure_multiplier).clamp(0.0, 1.0);
        
        pixel[0] = (new_r * 255.0) as u8;
        pixel[1] = (new_g * 255.0) as u8;
        pixel[2] = (new_b * 255.0) as u8;
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Exposure adjustment successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_vibrance(image_data: &[u8], amount: f32) -> Vec<u8> {
    let img = load_image(image_data);
    
    log("Vibrance adjustment function called");
    
    if amount == 0.0 {
        log("No vibrance adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Normalize amount to -1.0 to 1.0 range
    let factor = amount / 100.0;
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32 / 255.0;
        let g = pixel[1] as f32 / 255.0;
        let b = pixel[2] as f32 / 255.0;
        
        // Calculate current saturation level
        let max = r.max(g.max(b));
        let min = r.min(g.min(b));
        let delta = max - min;
        
        // Only adjust pixels that aren't already highly saturated
        // Vibrance protects skin tones and already saturated colors
        if max > 0.0 && delta > 0.01 {
            let current_saturation = delta / max;
            
            // Create a protection factor - less effect on already saturated colors
            // and on skin tones (reddish colors)
            let skin_tone_protection = if r > g && r > b {
                // Reduce effect on reddish colors (potential skin tones)
                0.3
            } else {
                1.0
            };
            
            let saturation_protection = 1.0 - current_saturation.powf(0.5);
            let protection_factor = skin_tone_protection * saturation_protection;
            
            // Apply vibrance adjustment with protection
            let adjusted_factor = factor * protection_factor;
            
            // Convert RGB to HSV for saturation adjustment
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
            
            let s = current_saturation;
            let v = max;
            
            // Adjust saturation with vibrance protection
            let new_s = (s + adjusted_factor * (1.0 - s)).clamp(0.0, 1.0);
            
            // Convert HSV back to RGB
            let c = v * new_s;
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
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Vibrance adjustment successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn apply_vignette(image_data: &[u8], strength: f32, radius: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Vignette effect function called");
    
    if strength == 0.0 {
        log("No vignette effect needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();
    
    // Calculate center of the image
    let center_x = width as f32 / 2.0;
    let center_y = height as f32 / 2.0;
    
    // Calculate maximum distance from center to corner
    let max_distance = ((center_x * center_x) + (center_y * center_y)).sqrt();
    
    // Normalize strength and radius
    let vignette_strength = strength / 100.0; // 0.0 to 1.0
    let vignette_radius = radius / 100.0; // 0.0 to 1.0
    
    // Calculate effective radius for vignette
    let effective_radius = max_distance * vignette_radius;
    
    for y in 0..height {
        for x in 0..width {
            let pixel = rgb_img.get_pixel_mut(x, y);
            
            // Calculate distance from center
            let dx = x as f32 - center_x;
            let dy = y as f32 - center_y;
            let distance = (dx * dx + dy * dy).sqrt();
            
            // Calculate vignette factor
            let vignette_factor = if distance <= effective_radius {
                1.0 // No darkening within the radius
            } else {
                // Smooth transition from radius to edge
                let normalized_distance = (distance - effective_radius) / (max_distance - effective_radius);
                let falloff = 1.0 - (normalized_distance * vignette_strength);
                falloff.max(0.0) // Prevent negative values
            };
            
            // Apply vignette by darkening the pixel
            let r = pixel[0] as f32;
            let g = pixel[1] as f32;
            let b = pixel[2] as f32;
            
            pixel[0] = (r * vignette_factor).clamp(0.0, 255.0) as u8;
            pixel[1] = (g * vignette_factor).clamp(0.0, 255.0) as u8;
            pixel[2] = (b * vignette_factor).clamp(0.0, 255.0) as u8;
        }
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Vignette effect successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn reduce_noise(image_data: &[u8], strength: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Noise reduction function called");
    
    if strength <= 0.0 {
        log("No noise reduction needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();
    
    // Normalize strength to determine filter size and intensity
    let normalized_strength = strength / 100.0; // 0.0 to 1.0
    
    // Create output buffer
    let mut output = image::ImageBuffer::new(width, height);
    
    // Apply bilateral filter-like noise reduction
    // This preserves edges while smoothing noise
    let filter_radius = (normalized_strength * 3.0 + 1.0) as i32; // 1 to 4 pixels
    let spatial_sigma = normalized_strength * 2.0 + 0.5; // Spatial smoothing
    let intensity_sigma = normalized_strength * 30.0 + 10.0; // Intensity threshold
    
    for y in 0..height {
        for x in 0..width {
            let center_pixel = rgb_img.get_pixel(x, y);
            let center_r = center_pixel[0] as f32;
            let center_g = center_pixel[1] as f32;
            let center_b = center_pixel[2] as f32;
            
            let mut sum_r = 0.0;
            let mut sum_g = 0.0;
            let mut sum_b = 0.0;
            let mut weight_sum = 0.0;
            
            // Sample pixels in the neighborhood
            for dy in -filter_radius..=filter_radius {
                for dx in -filter_radius..=filter_radius {
                    let nx = (x as i32 + dx).clamp(0, width as i32 - 1) as u32;
                    let ny = (y as i32 + dy).clamp(0, height as i32 - 1) as u32;
                    
                    let neighbor_pixel = rgb_img.get_pixel(nx, ny);
                    let neighbor_r = neighbor_pixel[0] as f32;
                    let neighbor_g = neighbor_pixel[1] as f32;
                    let neighbor_b = neighbor_pixel[2] as f32;
                    
                    // Calculate spatial weight (Gaussian)
                    let spatial_distance = ((dx * dx + dy * dy) as f32).sqrt();
                    let spatial_weight = (-spatial_distance * spatial_distance / (2.0 * spatial_sigma * spatial_sigma)).exp();
                    
                    // Calculate intensity weight (preserve edges)
                    let intensity_diff_r = (center_r - neighbor_r).abs();
                    let intensity_diff_g = (center_g - neighbor_g).abs();
                    let intensity_diff_b = (center_b - neighbor_b).abs();
                    let intensity_diff = (intensity_diff_r + intensity_diff_g + intensity_diff_b) / 3.0;
                    let intensity_weight = (-intensity_diff * intensity_diff / (2.0 * intensity_sigma * intensity_sigma)).exp();
                    
                    // Combine weights
                    let total_weight = spatial_weight * intensity_weight;
                    
                    sum_r += neighbor_r * total_weight;
                    sum_g += neighbor_g * total_weight;
                    sum_b += neighbor_b * total_weight;
                    weight_sum += total_weight;
                }
            }
            
            // Normalize and apply
            if weight_sum > 0.0 {
                let filtered_r = (sum_r / weight_sum).clamp(0.0, 255.0) as u8;
                let filtered_g = (sum_g / weight_sum).clamp(0.0, 255.0) as u8;
                let filtered_b = (sum_b / weight_sum).clamp(0.0, 255.0) as u8;
                
                output.put_pixel(x, y, image::Rgb([filtered_r, filtered_g, filtered_b]));
            } else {
                output.put_pixel(x, y, *center_pixel);
            }
        }
    }
    
    let processed = image::DynamicImage::ImageRgb8(output);
    log("Noise reduction successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn apply_emboss(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    log("Emboss effect function called");
    
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
    log("Emboss effect successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn histogram_equalization(image_data: &[u8]) -> Vec<u8> {
    let img = load_image(image_data);
    log("Histogram equalization function called");
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();
    let total_pixels = (width * height) as f32;
    
    // Calculate histogram for each channel
    let mut hist_r = [0u32; 256];
    let mut hist_g = [0u32; 256];
    let mut hist_b = [0u32; 256];
    
    for pixel in rgb_img.pixels() {
        hist_r[pixel[0] as usize] += 1;
        hist_g[pixel[1] as usize] += 1;
        hist_b[pixel[2] as usize] += 1;
    }
    
    // Calculate cumulative distribution function (CDF) for each channel
    let mut cdf_r = [0f32; 256];
    let mut cdf_g = [0f32; 256];
    let mut cdf_b = [0f32; 256];
    
    // Red channel CDF
    cdf_r[0] = hist_r[0] as f32 / total_pixels;
    for i in 1..256 {
        cdf_r[i] = cdf_r[i - 1] + (hist_r[i] as f32 / total_pixels);
    }
    
    // Green channel CDF
    cdf_g[0] = hist_g[0] as f32 / total_pixels;
    for i in 1..256 {
        cdf_g[i] = cdf_g[i - 1] + (hist_g[i] as f32 / total_pixels);
    }
    
    // Blue channel CDF
    cdf_b[0] = hist_b[0] as f32 / total_pixels;
    for i in 1..256 {
        cdf_b[i] = cdf_b[i - 1] + (hist_b[i] as f32 / total_pixels);
    }
    
    // Create lookup tables for histogram equalization
    let mut lut_r = [0u8; 256];
    let mut lut_g = [0u8; 256];
    let mut lut_b = [0u8; 256];
    
    for i in 0..256 {
        lut_r[i] = (cdf_r[i] * 255.0).round().clamp(0.0, 255.0) as u8;
        lut_g[i] = (cdf_g[i] * 255.0).round().clamp(0.0, 255.0) as u8;
        lut_b[i] = (cdf_b[i] * 255.0).round().clamp(0.0, 255.0) as u8;
    }
    
    // Apply histogram equalization using lookup tables
    for pixel in rgb_img.pixels_mut() {
        pixel[0] = lut_r[pixel[0] as usize];
        pixel[1] = lut_g[pixel[1] as usize];
        pixel[2] = lut_b[pixel[2] as usize];
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Histogram equalization successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_highlights(image_data: &[u8], amount: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Highlight adjustment function called");
    
    if amount == 0.0 {
        log("No highlight adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Normalize amount to -1.0 to 1.0 range
    let factor = amount / 100.0;
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32 / 255.0;
        let g = pixel[1] as f32 / 255.0;
        let b = pixel[2] as f32 / 255.0;
        
        // Calculate luminance to determine if this is a highlight region
        let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Only adjust pixels in highlight range (above 0.7 luminance)
        if luminance > 0.7 {
            // Calculate highlight mask (stronger effect for brighter pixels)
            let highlight_mask = ((luminance - 0.7) / 0.3).clamp(0.0, 1.0);
            
            // Apply adjustment with mask
            let adjustment = factor * highlight_mask;
            
            let new_r = (r + adjustment * (1.0 - r)).clamp(0.0, 1.0);
            let new_g = (g + adjustment * (1.0 - g)).clamp(0.0, 1.0);
            let new_b = (b + adjustment * (1.0 - b)).clamp(0.0, 1.0);
            
            pixel[0] = (new_r * 255.0) as u8;
            pixel[1] = (new_g * 255.0) as u8;
            pixel[2] = (new_b * 255.0) as u8;
        }
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Highlight adjustment successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_shadows(image_data: &[u8], amount: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Shadow adjustment function called");
    
    if amount == 0.0 {
        log("No shadow adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Normalize amount to -1.0 to 1.0 range
    let factor = amount / 100.0;
    
    for pixel in rgb_img.pixels_mut() {
        let r = pixel[0] as f32 / 255.0;
        let g = pixel[1] as f32 / 255.0;
        let b = pixel[2] as f32 / 255.0;
        
        // Calculate luminance to determine if this is a shadow region
        let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Only adjust pixels in shadow range (below 0.3 luminance)
        if luminance < 0.3 {
            // Calculate shadow mask (stronger effect for darker pixels)
            let shadow_mask = (1.0 - (luminance / 0.3)).clamp(0.0, 1.0);
            
            // Apply adjustment with mask
            let adjustment = factor * shadow_mask;
            
            let new_r = (r + adjustment * r).clamp(0.0, 1.0);
            let new_g = (g + adjustment * g).clamp(0.0, 1.0);
            let new_b = (b + adjustment * b).clamp(0.0, 1.0);
            
            pixel[0] = (new_r * 255.0) as u8;
            pixel[1] = (new_g * 255.0) as u8;
            pixel[2] = (new_b * 255.0) as u8;
        }
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Shadow adjustment successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_curves(image_data: &[u8], red_gamma: f32, green_gamma: f32, blue_gamma: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Color curves adjustment function called");
    
    if red_gamma == 1.0 && green_gamma == 1.0 && blue_gamma == 1.0 {
        log("No curve adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Create lookup tables for each channel using gamma correction
    let mut red_lut = [0u8; 256];
    let mut green_lut = [0u8; 256];
    let mut blue_lut = [0u8; 256];
    
    // Generate lookup tables with gamma correction
    // Gamma values: < 1.0 = brighter mid-tones, > 1.0 = darker mid-tones
    for i in 0..256 {
        let normalized = i as f32 / 255.0;
        
        // Apply gamma correction: output = input^(1/gamma)
        // Clamp gamma values to reasonable range to prevent extreme results
        let red_gamma_clamped = red_gamma.clamp(0.1, 3.0);
        let green_gamma_clamped = green_gamma.clamp(0.1, 3.0);
        let blue_gamma_clamped = blue_gamma.clamp(0.1, 3.0);
        
        red_lut[i] = (normalized.powf(1.0 / red_gamma_clamped) * 255.0).clamp(0.0, 255.0) as u8;
        green_lut[i] = (normalized.powf(1.0 / green_gamma_clamped) * 255.0).clamp(0.0, 255.0) as u8;
        blue_lut[i] = (normalized.powf(1.0 / blue_gamma_clamped) * 255.0).clamp(0.0, 255.0) as u8;
    }
    
    // Apply lookup tables to each pixel
    for pixel in rgb_img.pixels_mut() {
        pixel[0] = red_lut[pixel[0] as usize];
        pixel[1] = green_lut[pixel[1] as usize];
        pixel[2] = blue_lut[pixel[2] as usize];
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Color curves adjustment successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn adjust_levels(image_data: &[u8], black_point: u8, white_point: u8, gamma: f32) -> Vec<u8> {
    let img = load_image(image_data);
    log("Levels correction function called");
    
    // Validate input parameters
    if black_point >= white_point {
        log("Invalid levels: black point must be less than white point");
        return image_data.to_vec();
    }
    
    if black_point == 0 && white_point == 255 && gamma == 1.0 {
        log("No levels adjustment needed, returning original image");
        return image_data.to_vec();
    }
    
    // Convert to RGB8 format for pixel manipulation
    let mut rgb_img = img.to_rgb8();
    
    // Create lookup table for levels adjustment
    let mut lut = [0u8; 256];
    
    // Calculate the input range
    let input_range = (white_point as f32) - (black_point as f32);
    
    // Clamp gamma to reasonable range to prevent extreme results
    let gamma_clamped = gamma.clamp(0.1, 3.0);
    
    // Generate lookup table
    for i in 0..256 {
        let input_value = i as f32;
        
        // Step 1: Apply input levels (black and white point mapping)
        let normalized = if input_value <= black_point as f32 {
            0.0
        } else if input_value >= white_point as f32 {
            1.0
        } else {
            (input_value - black_point as f32) / input_range
        };
        
        // Step 2: Apply gamma correction
        let gamma_corrected = if gamma_clamped != 1.0 {
            normalized.powf(1.0 / gamma_clamped)
        } else {
            normalized
        };
        
        // Step 3: Map to output range (0-255)
        let output_value = (gamma_corrected * 255.0).clamp(0.0, 255.0);
        
        lut[i] = output_value as u8;
    }
    
    // Apply lookup table to each pixel
    for pixel in rgb_img.pixels_mut() {
        pixel[0] = lut[pixel[0] as usize];
        pixel[1] = lut[pixel[1] as usize];
        pixel[2] = lut[pixel[2] as usize];
    }
    
    let processed = image::DynamicImage::ImageRgb8(rgb_img);
    log("Levels correction successful");
    to_bytes(&processed)
}

#[wasm_bindgen]
pub fn calculate_histogram(image_data: &[u8]) -> Vec<u32> {
    let img = load_image(image_data);
    log("Calculate histogram function called");
    
    // Convert to RGB8 format for pixel analysis
    let rgb_img = img.to_rgb8();
    
    // Initialize histograms for each channel (R, G, B)
    let mut hist_r = [0u32; 256];
    let mut hist_g = [0u32; 256];
    let mut hist_b = [0u32; 256];
    
    // Count pixel values for each channel
    for pixel in rgb_img.pixels() {
        hist_r[pixel[0] as usize] += 1;
        hist_g[pixel[1] as usize] += 1;
        hist_b[pixel[2] as usize] += 1;
    }
    
    // Combine all histograms into a single vector
    // Format: [R0, R1, R2, ..., R255, G0, G1, G2, ..., G255, B0, B1, B2, ..., B255]
    let mut result = Vec::with_capacity(768); // 256 * 3
    
    // Add Red channel histogram
    for count in hist_r.iter() {
        result.push(*count);
    }
    
    // Add Green channel histogram
    for count in hist_g.iter() {
        result.push(*count);
    }
    
    // Add Blue channel histogram
    for count in hist_b.iter() {
        result.push(*count);
    }
    
    log("Histogram calculation successful");
    result
}