#!/bin/bash

# Optimized WASM Build Script
# This script builds the WASM module with maximum performance optimizations

set -e

echo "🚀 Building Optimized WASM Module"
echo "================================="

# Navigate to the Rust crate directory
cd "$(dirname "$0")/../crates/image-app"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean
rm -rf ../../src/pkg

# Build with maximum optimizations
echo "⚡ Building with maximum optimizations..."
echo "  - Link Time Optimization (LTO): Enabled"
echo "  - Optimization level: 3"
echo "  - Code generation units: 1"
echo "  - Panic strategy: abort"
echo "  - Overflow checks: disabled"
echo ""

# Build the optimized WASM module
RUSTFLAGS="-C target-feature=+simd128 -C target-feature=+bulk-memory -C target-feature=+mutable-globals" \
wasm-pack build \
  --target web \
  --out-dir ../../src/pkg \
  --release \
  --scope image-editor \
  -- \
  --features "simd"

echo "🔧 Post-processing optimizations..."

# Navigate to the generated package
cd ../../src/pkg

# Check if wasm-opt is available for further optimization
if command -v wasm-opt &> /dev/null; then
    echo "📦 Running wasm-opt for size and speed optimization..."
    
    # Create backup
    cp image_app_bg.wasm image_app_bg.wasm.backup
    
    # Apply aggressive optimizations
    wasm-opt -Oz --enable-bulk-memory --enable-simd image_app_bg.wasm.backup -o image_app_bg.wasm
    
    # Show size comparison
    echo "Size comparison:"
    echo "  Before: $(du -h image_app_bg.wasm.backup | cut -f1)"
    echo "  After:  $(du -h image_app_bg.wasm | cut -f1)"
    
    # Clean up backup
    rm image_app_bg.wasm.backup
else
    echo "⚠️  wasm-opt not found. Install binaryen for additional optimizations:"
    echo "     brew install binaryen  # macOS"
    echo "     apt install binaryen   # Ubuntu"
fi

echo "📊 Final WASM module size: $(du -h image_app_bg.wasm | cut -f1)"
echo ""
echo "✅ Optimized WASM build completed!"
echo ""
echo "🎯 Optimizations applied:"
echo "  - Rust release profile with LTO"
echo "  - SIMD instructions enabled"
echo "  - Bulk memory operations"
echo "  - Mutable globals support"
echo "  - Size optimization (wasm-opt)"
echo ""
echo "💡 Performance tips:"
echo "  - Use this build for production deployments"
echo "  - Consider gzip compression on web server"
echo "  - Pre-load WASM module for faster startup"