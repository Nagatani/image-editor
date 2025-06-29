/**
 * Processing State Debug Test
 * 
 * This test helps debug the current processing indicator state issues.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock WASM module with simple implementations
vi.mock('../pkg/image_app.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  adjust_brightness: vi.fn((data: Uint8Array, value: number) => {
    console.log('WASM adjust_brightness called with value:', value);
    return new Uint8Array([...data].map(byte => Math.min(255, Math.max(0, byte + value))));
  })
}));

// Mock Worker with detailed logging
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor() {
    console.log('MockWorker: Creating worker');
    setTimeout(() => {
      console.log('MockWorker: Sending WORKER_READY');
      this.onmessage?.({ data: { type: 'WORKER_READY' } } as MessageEvent);
      setTimeout(() => {
        console.log('MockWorker: Sending WASM_INITIALIZED');
        this.onmessage?.({ data: { type: 'WASM_INITIALIZED', success: true } } as MessageEvent);
      }, 50);
    }, 10);
  }
  
  postMessage(message: any) {
    console.log('MockWorker: Received message', message.type, message.data?.taskId);
    if (message.type === 'PROCESS_IMAGE') {
      setTimeout(() => {
        console.log('MockWorker: Sending PROCESSING_PROGRESS');
        this.onmessage?.({
          data: {
            type: 'PROCESSING_PROGRESS',
            taskId: message.data.taskId,
            progress: 50,
            message: 'Processing image...'
          }
        } as MessageEvent);
      }, 100);
      
      setTimeout(() => {
        console.log('MockWorker: Sending PROCESSING_COMPLETE');
        this.onmessage?.({
          data: {
            type: 'PROCESSING_COMPLETE',
            taskId: message.data.taskId,
            result: new Uint8Array(100)
          }
        } as MessageEvent);
      }, 300);
    }
  }
  
  terminate() {
    console.log('MockWorker: Terminating');
  }
}

global.Worker = MockWorker as any;

// Mock other browser APIs
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

const mockCanvas = {
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
  toBlob: vi.fn((callback) => callback(new Blob(['mock'], { type: 'image/png' }))),
  width: 1,
  height: 1
};

global.HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;
global.HTMLCanvasElement.prototype.toBlob = mockCanvas.toBlob;

const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') return mockCanvas as any;
  return originalCreateElement(tagName);
});

class MockFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: (() => void) | null = null;
  result: ArrayBuffer | null = null;
  
  readAsArrayBuffer(file: File) {
    console.log('MockFileReader: Reading file', file.name);
    setTimeout(() => {
      this.result = new ArrayBuffer(100);
      const event = { target: { result: this.result } } as ProgressEvent<FileReader>;
      this.onload?.(event);
    }, 10);
  }
}

global.FileReader = MockFileReader as any;

describe('Processing State Debug Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log('--- Test Started ---');
  });

  it('should show the initial app state correctly', async () => {
    console.log('Rendering App...');
    render(<App />);
    
    // Check if app loads
    expect(screen.getByText('Rust/WASM Image Editor')).toBeInTheDocument();
    
    // Check for loading indicator (WASM loading)
    const loader = screen.queryByText(/WASMモジュールをロード中/);
    console.log('WASM Loader found:', !!loader);
    
    // Wait for WASM to initialize
    await waitFor(() => {
      const statusElements = screen.queryAllByText(/Worker|Starting|Ready|Loading/);
      console.log('Status elements found:', statusElements.map(el => el.textContent));
      expect(statusElements.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
    
    // Check current state
    screen.debug(undefined, 10000);
  });

  it('should handle image upload and parameter changes', async () => {
    console.log('Testing image upload and processing...');
    render(<App />);
    
    // Wait for initialization
    await waitFor(() => {
      const statusElements = screen.queryAllByText(/Worker|Ready/);
      expect(statusElements.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
    
    // Try to upload an image
    const fileInput = screen.getByLabelText(/ファイルを開く/) as HTMLInputElement;
    const file = new File([new ArrayBuffer(100)], 'test.png', { type: 'image/png' });
    
    console.log('Uploading file...');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for image to load
    await waitFor(() => {
      const placeholder = screen.queryByText(/画像を選択してください/);
      console.log('Placeholder still visible:', !!placeholder);
    }, { timeout: 1000 });
    
    // Check if sliders are enabled
    const sliders = screen.getAllByRole('slider');
    console.log('Number of sliders found:', sliders.length);
    console.log('First slider disabled:', sliders[0]?.disabled);
    
    if (sliders.length > 0 && !sliders[0].disabled) {
      console.log('Changing slider value...');
      fireEvent.change(sliders[0], { target: { value: '25' } });
      
      // Check for processing indicators
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const processingElements = screen.queryAllByText(/処理中|Processing|Worker/);
      console.log('Processing elements found:', processingElements.map(el => el.textContent));
      
      // Wait a bit more to see if processing completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalProcessingElements = screen.queryAllByText(/処理中|Processing|Worker/);
      console.log('Final processing elements:', finalProcessingElements.map(el => el.textContent));
    }
    
    // Final state debug
    screen.debug(undefined, 10000);
  });
});