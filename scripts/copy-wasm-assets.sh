#!/bin/bash

# Copy WASM Assets for Web Worker Script
# This script copies the generated WASM files to public directory for Worker access

set -e

echo "📦 Copying WASM assets for Web Worker..."

# Create assets directory in public if it doesn't exist
mkdir -p public/assets

# Copy WASM files from pkg to public/assets
if [ -f "src/pkg/image_app.js" ]; then
    cp src/pkg/image_app.js public/assets/
    echo "✅ Copied image_app.js"
else
    echo "❌ image_app.js not found in src/pkg/"
fi

if [ -f "src/pkg/image_app_bg.wasm" ]; then
    cp src/pkg/image_app_bg.wasm public/assets/
    echo "✅ Copied image_app_bg.wasm"
else
    echo "❌ image_app_bg.wasm not found in src/pkg/"
fi

if [ -f "src/pkg/image_app.d.ts" ]; then
    cp src/pkg/image_app.d.ts public/assets/
    echo "✅ Copied image_app.d.ts"
else
    echo "⚠️ image_app.d.ts not found (optional)"
fi

echo "🎯 WASM assets copied successfully!"
echo "Worker can now access WASM module at /assets/image_app.js"