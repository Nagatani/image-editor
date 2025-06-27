# Rust/WASM Image Editor

A high-performance web-based image editor built with Rust and WebAssembly, featuring a professional dark theme UI inspired by desktop image editing software.

## Features

### Image Processing (Powered by Rust/WASM)
- **Image Adjustments**: Brightness, Contrast, Saturation, White Balance
- **Image Operations**: 90° Rotation, Precise Cropping
- **Real-time Preview**: Instant feedback for all adjustments
- **High Performance**: Native Rust performance in the browser via WebAssembly

### Professional UI/UX
- **Dark Theme**: Eye-friendly professional interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Interactive Cropping**: Visual crop selection with react-image-crop
- **Intuitive Controls**: Slider + numeric input for precise adjustments

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
│   ├── App.tsx           # Main application component
│   ├── App.css           # Professional dark theme styles
│   ├── main.tsx          # React entry point
│   └── pkg/              # Generated WASM package (auto-generated)
├── crates/
│   └── image-app/        # Rust WASM module
│       ├── src/
│       │   └── lib.rs    # Image processing functions
│       └── Cargo.toml    # Rust dependencies
├── package.json          # Node.js dependencies and scripts
└── CLAUDE.md            # Development guidance for Claude Code
```

### Key Components

**Frontend (React)**
- `App.tsx` - Main UI with state management using `useReducer`
- Professional 2-pane layout (canvas + adjustment panel)
- Real-time image processing with WASM integration

**Backend (Rust/WASM)**
- `lib.rs` - Exposes image processing functions via `wasm-bindgen`
- Functions: `adjust_brightness`, `adjust_contrast`, `adjust_saturation`, `adjust_white_balance`, `rotate`, `crop`
- Uses the `image` crate for high-performance processing

## Usage

1. **Open Image**: Click "ファイルを開く" to select an image
2. **Adjust Settings**: Use the right panel sliders to modify:
   - Brightness (-100 to +100)
   - Contrast (-100 to +100) 
   - Saturation (-100 to +100)
   - Temperature (-100 to +100)
3. **Rotate**: Click "回転" for 90° clockwise rotation
4. **Crop**: 
   - Drag to select crop area on the image
   - Click "トリミング" to apply
5. **Reset**: Click "リセット" to restore original settings

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
   - Unit tests with Vitest
   - Integration tests for WASM functions

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