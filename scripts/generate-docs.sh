#!/bin/bash

# Documentation Generation Script for Image Editor
# Generates comprehensive documentation for both Rust and TypeScript code

set -e

echo "📚 Generating Comprehensive Documentation"
echo "========================================"

# Create docs directory if it doesn't exist
mkdir -p docs/api
mkdir -p docs/rust
mkdir -p docs/typescript

echo "📖 Generating Rust Documentation..."
cd "$(dirname "$0")/../crates/image-app"

# Generate Rust documentation with private items and examples
cargo doc --no-deps --document-private-items --open --target-dir ../../docs/rust

echo "📊 Generating TypeScript Documentation..."
cd "$(dirname "$0")/.."

# Check if TypeDoc is installed
if ! command -v typedoc &> /dev/null; then
    echo "Installing TypeDoc..."
    npm install -g typedoc
fi

# Generate TypeScript documentation
typedoc --out docs/typescript \
    --name "Image Editor TypeScript API" \
    --readme README.md \
    --excludePrivate \
    --theme default \
    --includeVersion \
    --searchInComments \
    --categorizeByGroup \
    src/

echo "📋 Generating API Documentation..."

# Create comprehensive API documentation
cat > docs/api/README.md << 'EOF'
# Image Editor API Documentation

This directory contains comprehensive API documentation for the Image Editor project.

## Documentation Structure

### 📁 [Rust Documentation](../rust/doc/image_app/index.html)
Complete documentation for all Rust/WASM image processing functions including:
- Function signatures and parameters
- Performance characteristics
- Usage examples
- Implementation details

### 📁 [TypeScript Documentation](../typescript/index.html)
Complete documentation for all React components and TypeScript interfaces including:
- Component props and usage
- Hook documentation
- Type definitions
- Examples and best practices

### 📁 [Performance Analysis](../../PERFORMANCE.md)
Detailed performance benchmarks and optimization guidelines

## Quick Reference

### Core Image Processing Functions

#### Basic Adjustments
- `adjust_brightness(image_data: &[u8], value: i32) -> Vec<u8>`
- `adjust_contrast(image_data: &[u8], value: f32) -> Vec<u8>`
- `adjust_saturation(image_data: &[u8], value: f32) -> Vec<u8>`
- `adjust_white_balance(image_data: &[u8], value: f32) -> Vec<u8>`

#### Advanced Adjustments
- `adjust_hue(image_data: &[u8], shift: f32) -> Vec<u8>`
- `adjust_exposure(image_data: &[u8], stops: f32) -> Vec<u8>`
- `adjust_vibrance(image_data: &[u8], amount: f32) -> Vec<u8>`
- `adjust_highlights(image_data: &[u8], amount: f32) -> Vec<u8>`
- `adjust_shadows(image_data: &[u8], amount: f32) -> Vec<u8>`

#### Professional Tools
- `adjust_curves(image_data: &[u8], r_gamma: f32, g_gamma: f32, b_gamma: f32) -> Vec<u8>`
- `adjust_levels(image_data: &[u8], black_point: u8, white_point: u8, gamma: f32) -> Vec<u8>`
- `histogram_equalization(image_data: &[u8]) -> Vec<u8>`
- `calculate_histogram(image_data: &[u8]) -> Vec<u32>`

#### Filters
- `gaussian_blur(image_data: &[u8], sigma: f32) -> Vec<u8>`
- `sharpen(image_data: &[u8], amount: f32) -> Vec<u8>`
- `apply_sepia(image_data: &[u8]) -> Vec<u8>`
- `to_grayscale(image_data: &[u8]) -> Vec<u8>`
- `apply_emboss(image_data: &[u8]) -> Vec<u8>`
- `apply_vignette(image_data: &[u8], strength: f32, radius: f32) -> Vec<u8>`
- `reduce_noise(image_data: &[u8], strength: f32) -> Vec<u8>`

#### Transforms
- `rotate(image_data: &[u8], angle: u32) -> Vec<u8>`
- `rotate_arbitrary(image_data: &[u8], angle: f32) -> Vec<u8>`
- `flip_horizontal(image_data: &[u8]) -> Vec<u8>`
- `flip_vertical(image_data: &[u8]) -> Vec<u8>`
- `resize(image_data: &[u8], width: u32, height: u32) -> Vec<u8>`
- `crop(image_data: &[u8], x: u32, y: u32, width: u32, height: u32) -> Vec<u8>`

### React Components

#### Core Components
- `AdjustmentSlider` - Dual slider/number input control
- `BasicAdjustments` - Fundamental image adjustments panel
- `AdvancedAdjustments` - Professional adjustment controls
- `FilterControls` - Image filter application panel
- `TransformTools` - Geometric transformation controls
- `AppHeader` - Main application header with file operations
- `PresetManager` - Adjustment preset save/load functionality
- `HistogramDisplay` - Real-time histogram visualization

### Performance Guidelines

#### Recommended Usage Patterns
```typescript
// Debounce adjustments for performance
const debouncedApply = useCallback(
  debounce((params) => applyAdjustments(params), 150),
  []
);

// Batch multiple adjustments
const applyMultipleAdjustments = async (adjustments) => {
  // Apply all adjustments in sequence for better performance
  let result = originalImage;
  for (const adjustment of adjustments) {
    result = await applyAdjustment(result, adjustment);
  }
  return result;
};
```

#### Memory Management
```typescript
// Clean up resources properly
useEffect(() => {
  return () => {
    // Clean up any pending operations
    clearTimeout(debounceRef.current);
    // Release large objects
    processedImageRef.current = null;
  };
}, []);
```

## Getting Started

1. **View Rust Documentation**: Open `docs/rust/doc/image_app/index.html`
2. **View TypeScript Documentation**: Open `docs/typescript/index.html`
3. **Run Performance Benchmarks**: Execute `./scripts/benchmark.sh`
4. **Test Components**: Run `npm test` for component tests

## Contributing

When adding new functions or components:
1. Add comprehensive JSDoc/RustDoc comments
2. Include usage examples
3. Document performance characteristics
4. Add unit tests
5. Update this documentation

For more information, see the project README and contribution guidelines.
EOF

echo "🔧 Generating Configuration Documentation..."

cat > docs/api/configuration.md << 'EOF'
# Configuration Guide

## Environment Variables

### Development
- `NODE_ENV=development` - Enables development mode
- `REACT_APP_DEBUG=true` - Enables debug logging

### Production
- `NODE_ENV=production` - Enables production optimizations
- `REACT_APP_VERSION` - Application version string

## Build Configuration

### WASM Build
```bash
# Development build (with debug symbols)
wasm-pack build --target web --out-dir ../../src/pkg --dev

# Production build (optimized)
wasm-pack build --target web --out-dir ../../src/pkg --release
```

### React Build
```bash
# Development server
npm start

# Production build
npm run build
```

## Performance Configuration

### Image Processing Limits
- Maximum image size: 4096x4096 pixels
- Memory limit: 100MB per operation
- Processing timeout: 30 seconds

### UI Configuration
- Debounce delay: 150ms
- Maximum history states: 50
- Auto-save interval: 30 seconds

## Browser Compatibility

### Required Features
- WebAssembly support
- Canvas API
- File API
- Web Workers (optional, for performance)

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
EOF

echo "✅ Documentation generation completed!"
echo ""
echo "📋 Generated Documentation:"
echo "- Rust API: docs/rust/doc/image_app/index.html"
echo "- TypeScript API: docs/typescript/index.html"
echo "- API Reference: docs/api/README.md"
echo "- Configuration: docs/api/configuration.md"
echo "- Performance: PERFORMANCE.md"
echo ""
echo "🌐 To view documentation:"
echo "1. Open docs/rust/doc/image_app/index.html in browser"
echo "2. Open docs/typescript/index.html in browser"
echo "3. View README.md for project overview"