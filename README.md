# Professional Image Editor

A comprehensive web-based image editor built with Rust and WebAssembly, featuring professional-grade image processing capabilities and an intuitive dark theme UI inspired by desktop editing software.

## ✨ Features

### 🎨 Complete Image Processing Suite
- **Basic Adjustments**: Brightness, Contrast, Saturation, Temperature, Hue, Exposure, Vibrance
- **Advanced Tools**: Highlight/Shadow correction, Color Curves (RGB), Levels correction
- **Filters & Effects**: Gaussian Blur, Sharpen, Vignette, Noise Reduction, Emboss, Sepia, Grayscale
- **Geometric Operations**: Rotation (90°/180°/270°), Horizontal/Vertical flip, Precision cropping, Resize
- **Professional Features**: Histogram Equalization, Real-time Histogram display, Preset system

### 🚀 Performance & Quality
- **Rust/WASM Engine**: Near-native performance for complex image operations
- **Real-time Processing**: Instant preview with debounced updates
- **Memory Efficient**: Optimized memory management and cleanup
- **Error Handling**: Comprehensive error recovery and user feedback

### 💡 Professional UI/UX
- **Modern Interface**: Clean, professional dark theme
- **Component Architecture**: Modular, reusable React components
- **Responsive Design**: Works seamlessly across devices
- **Advanced Controls**: Dual slider/numeric inputs for precision
- **Visual Feedback**: Loading states, progress indicators, error toasts
- **Preset Management**: Save and load custom adjustment presets
- **Undo/Redo System**: Complete history management

## Tech Stack

### Frontend
- **React 19** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **CSS3** - Professional styling with gradients and animations

### Backend (Image Processing)
- **Rust** - High-performance systems programming language
- **WebAssembly (WASM)** - Native performance in the browser
- **wasm-bindgen** - Rust-JavaScript interoperability
- **image crate** - Comprehensive image processing library

### Additional Libraries
- **react-image-crop** - Interactive image cropping component
- **npm-run-all** - Parallel script execution
- **cargo-watch** - Auto-rebuilding for development

## Quick Start

### Prerequisites
- **Node.js** (v16 or later)
- **Rust** (latest stable)
- **wasm-pack** - WebAssembly package manager

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### Installation & Development

```bash
# Clone the repository
git clone <repository-url>
cd image-editor

# Install dependencies
npm install

# Start development server (builds WASM + React concurrently)
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Development Commands

```bash
# Development with hot reload
npm run dev                 # Start both Vite dev server and WASM watch mode
npm run dev:vite           # Start only React dev server
npm run dev:wasm           # Watch and rebuild WASM on Rust changes

# Building
npm run build              # Build WASM first, then build React app
npm run build:wasm         # Build only the WASM module

# Testing
npm test                   # Run Vitest tests
```

## Project Architecture

```
image-editor/
├── src/                   # React frontend
│   ├── components/       # Modular React components
│   │   ├── AdjustmentSlider.tsx
│   │   ├── BasicAdjustments.tsx
│   │   ├── FilterControls.tsx
│   │   ├── AdvancedAdjustments.tsx
│   │   ├── TransformTools.tsx
│   │   ├── PresetManager.tsx
│   │   ├── HistogramDisplay.tsx
│   │   ├── AppHeader.tsx
│   │   ├── __tests__/    # Component tests
│   │   └── index.ts      # Component exports
│   ├── App.tsx           # Main application component
│   ├── App.css           # Professional dark theme styles
│   ├── main.tsx          # React entry point
│   └── pkg/              # Generated WASM package (auto-generated)
├── crates/
│   └── image-app/        # Rust WASM module
│       ├── src/
│       │   └── lib.rs    # 25+ image processing functions with tests
│       └── Cargo.toml    # Rust dependencies
├── package.json          # Node.js dependencies and scripts
├── TODO.md              # Feature implementation tracking
└── CLAUDE.md            # Development guidance for Claude Code
```

### Key Components

**Frontend (React)**
- `App.tsx` - Main UI with state management using `useReducer`
- Professional 2-pane layout (canvas + adjustment panel)
- Real-time image processing with WASM integration

**Backend (Rust/WASM)**
- `lib.rs` - Exposes 25+ image processing functions via `wasm-bindgen`
- **Core Functions**: Brightness, Contrast, Saturation, Hue, Exposure, Vibrance
- **Advanced Functions**: Curves, Levels, Highlight/Shadow, Histogram processing
- **Filters**: Blur, Sharpen, Vignette, Noise Reduction, Emboss, Sepia
- **Transforms**: Rotation, Flipping, Resizing, Cropping
- Uses the `image` crate for professional-grade processing

## 📖 Usage Guide

### Getting Started
1. **Load Image**: Click "📁 画像を開く" to select your image (supports JPEG, PNG, WebP, AVIF, BMP, TIFF)
2. **Real-time Editing**: All adjustments are applied instantly with live preview
3. **Save Results**: Click "💾 保存" to download your edited image in multiple formats

### Basic Adjustments Panel
- **Brightness** (-100 to +100): Lighten or darken the entire image
- **Contrast** (-2.0 to +2.0): Increase or decrease tonal contrast
- **Saturation** (-180 to +180): Enhance or reduce color intensity
- **Temperature** (-100 to +100): Warm (orange) or cool (blue) color cast
- **Hue** (-180° to +180°): Shift all colors around the color wheel
- **Exposure** (-3 to +3 stops): Simulate camera exposure adjustments
- **Vibrance** (-100 to +100): Natural saturation enhancement (protects skin tones)

### Advanced Tools
- **Highlights/Shadows**: Separate control for bright and dark areas
- **Color Curves**: Individual RGB channel gamma correction
- **Levels**: Black point, white point, and gamma adjustment
- **Histogram**: Real-time color distribution visualization

### Filters & Effects
- **Gaussian Blur**: Artistic blur with adjustable intensity
- **Sharpen**: Enhance image details and edges
- **Vignette**: Subtle darkening around image edges
- **Noise Reduction**: Advanced bilateral filtering
- **Creative Effects**: Emboss, Sepia, Grayscale conversion

### Transform Tools
- **Rotation**: 90°, 180°, 270° quick rotations
- **Flip**: Horizontal and vertical mirroring
- **Auto Enhance**: One-click histogram equalization

### Professional Features
- **Preset System**: Save and recall your favorite adjustment combinations
- **Undo/Redo**: Complete edit history with Ctrl+Z/Ctrl+Y support
- **Error Recovery**: Automatic fallback and user-friendly error messages
- **Performance**: Debounced processing for smooth real-time editing

## Development Workflow

1. **WASM Development**: 
   - Edit Rust code in `crates/image-app/src/lib.rs`
   - WASM automatically rebuilds via `cargo-watch`
   - Changes reflected immediately in browser

2. **Frontend Development**:
   - Edit React components in `src/`
   - Vite provides hot module replacement
   - TypeScript ensures type safety

3. **Testing**:
   - **React Components**: Comprehensive unit tests with Vitest and Testing Library
   - **Rust Functions**: Unit tests for all image processing functions
   - **Integration**: End-to-end testing of WASM-React integration
   - **Coverage**: Test coverage for critical paths and edge cases

## Performance Features

- **WebAssembly**: Near-native performance for image processing
- **Incremental Processing**: Only reprocess when parameters change
- **Memory Efficient**: Direct memory operations in Rust
- **Responsive UI**: Non-blocking operations with loading states

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **WebAssembly Support**: Required (supported by 95%+ of browsers)
- **Mobile**: Responsive design works on iOS and Android browsers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Build and test locally (`npm run build && npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Rust WebAssembly Working Group** for excellent WASM tooling
- **React Team** for the powerful frontend framework
- **image-rs** community for the comprehensive image processing library
- **Vite** for the fast development experience

---

Built with Rust and React