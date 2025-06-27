# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a hybrid React + Rust/WASM image editor application with two main components:

1. **Frontend (React/TypeScript)**: Located in `src/`, built with Vite
   - `App.tsx` contains the main UI with image processing controls and preview
   - Uses `useReducer` for state management with centralized actions
   - Integrates `react-image-crop` for cropping functionality
   - WASM module is loaded asynchronously and UI waits for initialization

2. **Backend (Rust/WASM)**: Located in `crates/image-app/`
   - `lib.rs` exposes image processing functions via `wasm-bindgen`
   - Uses the `image` crate for core image manipulation
   - Functions include: brightness, contrast, saturation, white balance, rotation, and cropping
   - Compiled to WASM and outputs to `src/pkg/`

## Common Commands

### Development
```bash
npm run dev                 # Start both Vite dev server and WASM watch mode
npm run dev:vite           # Start only React dev server
npm run dev:wasm           # Watch and rebuild WASM on Rust changes
```

### Building
```bash
npm run build              # Build WASM first, then build React app
npm run build:wasm         # Build only the WASM module
```

### Testing
```bash
npm test                   # Run Vitest tests
```

### Other
```bash
npm run preview            # Preview production build
```

## Development Workflow

1. WASM module must be built before the React app can run
2. Use `npm run dev` to run both the React dev server and WASM watch mode simultaneously
3. Changes to Rust code in `crates/image-app/` trigger automatic WASM rebuilds
4. The React app waits for WASM initialization before enabling image processing features

## Key Implementation Details

- Image processing is done entirely in Rust/WASM for performance
- All image operations work with raw byte arrays passed between JS and WASM
- The React app manages UI state and coordinates WASM function calls
- Images are converted to PNG format for consistent processing
- WASM functions handle bounds checking and error logging via console