use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use image::{ImageBuffer, Rgb, DynamicImage, ImageFormat};
use image_app::*;
use std::io::Cursor;

fn create_test_image(width: u32, height: u32) -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_fn(width, height, |x, y| {
        Rgb([
            (x % 256) as u8,
            (y % 256) as u8,
            ((x + y) % 256) as u8,
        ])
    });
    
    let dynamic_img = DynamicImage::ImageRgb8(img);
    let mut buffer = Cursor::new(Vec::new());
    dynamic_img.write_to(&mut buffer, ImageFormat::Png).unwrap();
    buffer.into_inner()
}

fn bench_basic_adjustments(c: &mut Criterion) {
    let mut group = c.benchmark_group("basic_adjustments");
    
    for size in [512, 1024, 2048].iter() {
        let image_data = create_test_image(*size, *size);
        
        group.bench_with_input(
            BenchmarkId::new("brightness", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_brightness(black_box(data), black_box(50)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("contrast", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_contrast(black_box(data), black_box(1.5)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("saturation", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_saturation(black_box(data), black_box(25.0)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("white_balance", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_white_balance(black_box(data), black_box(30.0)))
            },
        );
    }
    
    group.finish();
}

fn bench_advanced_adjustments(c: &mut Criterion) {
    let mut group = c.benchmark_group("advanced_adjustments");
    
    for size in [512, 1024, 2048].iter() {
        let image_data = create_test_image(*size, *size);
        
        group.bench_with_input(
            BenchmarkId::new("hue", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_hue(black_box(data), black_box(45.0)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("exposure", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_exposure(black_box(data), black_box(0.5)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("vibrance", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_vibrance(black_box(data), black_box(0.3)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("highlights", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_highlights(black_box(data), black_box(-0.3)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("shadows", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_shadows(black_box(data), black_box(0.3)))
            },
        );
    }
    
    group.finish();
}

fn bench_professional_tools(c: &mut Criterion) {
    let mut group = c.benchmark_group("professional_tools");
    
    for size in [512, 1024, 2048].iter() {
        let image_data = create_test_image(*size, *size);
        
        group.bench_with_input(
            BenchmarkId::new("curves", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_curves(
                    black_box(data),
                    black_box(1.2),
                    black_box(1.0),
                    black_box(0.8)
                ))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("levels", size),
            &image_data,
            |b, data| {
                b.iter(|| adjust_levels(
                    black_box(data),
                    black_box(20),
                    black_box(235),
                    black_box(1.2)
                ))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("histogram_equalization", size),
            &image_data,
            |b, data| {
                b.iter(|| histogram_equalization(black_box(data)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("histogram_calculation", size),
            &image_data,
            |b, data| {
                b.iter(|| calculate_histogram(black_box(data)))
            },
        );
    }
    
    group.finish();
}

fn bench_filters(c: &mut Criterion) {
    let mut group = c.benchmark_group("filters");
    
    for size in [512, 1024, 2048].iter() {
        let image_data = create_test_image(*size, *size);
        
        group.bench_with_input(
            BenchmarkId::new("gaussian_blur", size),
            &image_data,
            |b, data| {
                b.iter(|| gaussian_blur(black_box(data), black_box(2.0)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("sharpen", size),
            &image_data,
            |b, data| {
                b.iter(|| sharpen(black_box(data), black_box(1.5)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("sepia", size),
            &image_data,
            |b, data| {
                b.iter(|| apply_sepia(black_box(data)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("grayscale", size),
            &image_data,
            |b, data| {
                b.iter(|| to_grayscale(black_box(data)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("emboss", size),
            &image_data,
            |b, data| {
                b.iter(|| apply_emboss(black_box(data)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("vignette", size),
            &image_data,
            |b, data| {
                b.iter(|| apply_vignette(black_box(data), black_box(0.5), black_box(0.8)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("noise_reduction", size),
            &image_data,
            |b, data| {
                b.iter(|| reduce_noise(black_box(data), black_box(0.3)))
            },
        );
    }
    
    group.finish();
}

fn bench_transforms(c: &mut Criterion) {
    let mut group = c.benchmark_group("transforms");
    
    for size in [512, 1024, 2048].iter() {
        let image_data = create_test_image(*size, *size);
        
        group.bench_with_input(
            BenchmarkId::new("rotate_90", size),
            &image_data,
            |b, data| {
                b.iter(|| rotate(black_box(data), black_box(90)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("rotate_arbitrary", size),
            &image_data,
            |b, data| {
                b.iter(|| rotate_arbitrary(black_box(data), black_box(45.0)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("flip_horizontal", size),
            &image_data,
            |b, data| {
                b.iter(|| flip_horizontal(black_box(data)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("flip_vertical", size),
            &image_data,
            |b, data| {
                b.iter(|| flip_vertical(black_box(data)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("resize", size),
            &image_data,
            |b, data| {
                b.iter(|| resize(black_box(data), black_box(*size / 2), black_box(*size / 2)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("crop", size),
            &image_data,
            |b, data| {
                b.iter(|| crop(
                    black_box(data),
                    black_box(*size / 4),
                    black_box(*size / 4),
                    black_box(*size / 2),
                    black_box(*size / 2)
                ))
            },
        );
    }
    
    group.finish();
}

fn bench_memory_intensive(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_intensive");
    group.sample_size(10); // Reduce sample size for memory-intensive tests
    
    // Test with larger images for memory performance
    for size in [2048, 4096].iter() {
        let image_data = create_test_image(*size, *size);
        
        group.bench_with_input(
            BenchmarkId::new("large_gaussian_blur", size),
            &image_data,
            |b, data| {
                b.iter(|| gaussian_blur(black_box(data), black_box(5.0)))
            },
        );
        
        group.bench_with_input(
            BenchmarkId::new("large_histogram_equalization", size),
            &image_data,
            |b, data| {
                b.iter(|| histogram_equalization(black_box(data)))
            },
        );
    }
    
    group.finish();
}

criterion_group!(
    benches,
    bench_basic_adjustments,
    bench_advanced_adjustments,
    bench_professional_tools,
    bench_filters,
    bench_transforms,
    bench_memory_intensive
);
criterion_main!(benches);