#!/bin/bash

# Performance Benchmark Script for Image Editor
# This script runs comprehensive performance tests on all image processing functions

set -e

echo "🚀 Starting Image Editor Performance Benchmarks"
echo "================================================"

# Navigate to the Rust crate directory
cd "$(dirname "$0")/../crates/image-app"

# Check if criterion is available
if ! cargo bench --version > /dev/null 2>&1; then
    echo "❌ Cargo bench not available. Installing criterion..."
    cargo install criterion
fi

# Run benchmarks with different configurations
echo "📊 Running benchmarks for different image sizes (512px, 1024px, 2048px)..."
echo ""

# Basic performance test
echo "🔧 Testing Basic Adjustments..."
cargo bench --bench performance basic_adjustments

echo ""
echo "🎨 Testing Advanced Adjustments..."
cargo bench --bench performance advanced_adjustments

echo ""
echo "🛠 Testing Professional Tools..."
cargo bench --bench performance professional_tools

echo ""
echo "🎭 Testing Filters..."
cargo bench --bench performance filters

echo ""
echo "🔄 Testing Transforms..."
cargo bench --bench performance transforms

echo ""
echo "💾 Testing Memory-Intensive Operations..."
cargo bench --bench performance memory_intensive

echo ""
echo "📈 Generating HTML Reports..."
cargo bench --bench performance

echo ""
echo "✅ Benchmarks completed!"
echo ""
echo "📋 Results Summary:"
echo "- HTML reports generated in: target/criterion/"
echo "- Open target/criterion/report/index.html to view detailed results"
echo ""
echo "🔍 Key Metrics to Monitor:"
echo "- Processing time per image size"
echo "- Memory usage patterns"
echo "- Throughput (images per second)"
echo "- Performance scaling with image size"
echo ""
echo "💡 Optimization Tips:"
echo "- Functions with linear scaling are optimal"
echo "- Watch for quadratic or exponential growth patterns"
echo "- Monitor memory allocation peaks"
echo "- Consider SIMD optimizations for bottlenecks"