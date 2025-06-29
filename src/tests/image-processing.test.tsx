/**
 * Image Processing Integration Tests
 * 
 * These tests ensure that image processing functionality works correctly
 * and that the processing indicator displays properly during operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock WASM module
vi.mock('../pkg/image_app.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  adjust_brightness: vi.fn((data: Uint8Array, value: number) => {
    // Simulate processing time
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(new Uint8Array([...data].map(byte => Math.min(255, Math.max(0, byte + value)))));
      }, 100);
    });
  }),
  adjust_contrast: vi.fn((data: Uint8Array, value: number) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(new Uint8Array([...data].map(byte => Math.min(255, Math.max(0, byte * (1 + value))))));
      }, 100);
    });
  }),
  adjust_saturation: vi.fn((data: Uint8Array) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(new Uint8Array(data));
      }, 100);
    });
  }),
  rotate: vi.fn((data: Uint8Array) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(new Uint8Array(data));
      }, 50);
    });
  })
}));

// Mock Web Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor() {
    // Simulate worker initialization
    setTimeout(() => {
      this.onmessage?.({ data: { type: 'WORKER_READY' } } as MessageEvent);
      setTimeout(() => {
        this.onmessage?.({ data: { type: 'WASM_INITIALIZED', success: true } } as MessageEvent);
      }, 50);
    }, 10);
  }
  
  postMessage(message: any) {
    // Simulate processing
    if (message.type === 'PROCESS_IMAGE') {
      setTimeout(() => {
        this.onmessage?.({
          data: {
            type: 'PROCESSING_PROGRESS',
            taskId: message.data.taskId,
            progress: 50,
            message: 'Processing...'
          }
        } as MessageEvent);
      }, 50);
      
      setTimeout(() => {
        this.onmessage?.({
          data: {
            type: 'PROCESSING_COMPLETE',
            taskId: message.data.taskId,
            result: new Uint8Array(100)
          }
        } as MessageEvent);
      }, 200);
    }
  }
  
  terminate() {}
}

global.Worker = MockWorker as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Canvas API
const mockCanvas = {
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
  toBlob: vi.fn((callback) => {
    callback(new Blob(['mock'], { type: 'image/png' }));
  }),
  width: 1,
  height: 1
};

global.HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;
global.HTMLCanvasElement.prototype.toBlob = mockCanvas.toBlob;

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }
  return originalCreateElement(tagName);
});

// Mock FileReader
class MockFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: (() => void) | null = null;
  result: ArrayBuffer | null = null;
  
  readAsArrayBuffer(file: File) {
    setTimeout(() => {
      this.result = new ArrayBuffer(100);
      const event = {
        target: { result: this.result }
      } as ProgressEvent<FileReader>;
      this.onload?.(event);
    }, 10);
  }
}

global.FileReader = MockFileReader as any;

describe('Image Processing Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process image when brightness slider is changed', async () => {
    render(<App />);
    
    // Wait for WASM to initialize
    await waitFor(() => {
      expect(screen.queryByText(/Worker Ready/)).toBeInTheDocument();
    });
    
    // Upload a test image
    const file = new File([new ArrayBuffer(100)], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/画像を選択/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for image to load
    await waitFor(() => {
      expect(screen.queryByText(/画像を選択してください/)).not.toBeInTheDocument();
    });
    
    // Find brightness slider
    const brightnessSlider = screen.getByDisplayValue('0');
    
    // Change brightness value
    fireEvent.change(brightnessSlider, { target: { value: '50' } });
    
    // Should trigger processing
    await waitFor(() => {
      expect(screen.queryByText(/処理中/)).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Processing should complete
    await waitFor(() => {
      expect(screen.queryByText(/処理中/)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show processing indicator during worker processing', async () => {
    render(<App />);
    
    // Wait for worker to be ready
    await waitFor(() => {
      expect(screen.queryByText(/Worker Ready/)).toBeInTheDocument();
    });
    
    // Upload image
    const file = new File([new ArrayBuffer(100)], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/画像を選択/);
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.queryByText(/画像を選択してください/)).not.toBeInTheDocument();
    });
    
    // Trigger processing by changing a parameter
    const contrastSlider = screen.getAllByRole('slider')[1]; // Second slider should be contrast
    fireEvent.change(contrastSlider, { target: { value: '1' } });
    
    // Should show processing indicator
    await waitFor(() => {
      const processingElements = screen.queryAllByText(/処理中|Processing|Worker処理/);
      expect(processingElements.length).toBeGreaterThan(0);
    }, { timeout: 1000 });
    
    // Processing should eventually complete
    await waitFor(() => {
      const processingElements = screen.queryAllByText(/処理中|Processing|Worker処理/);
      expect(processingElements.length).toBe(0);
    }, { timeout: 5000 });
  });

  it('should handle rapid parameter changes without breaking', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Worker Ready/)).toBeInTheDocument();
    });
    
    // Upload image
    const file = new File([new ArrayBuffer(100)], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/画像を選択/);
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.queryByText(/画像を選択してください/)).not.toBeInTheDocument();
    });
    
    // Rapidly change multiple parameters
    const sliders = screen.getAllByRole('slider');
    
    fireEvent.change(sliders[0], { target: { value: '25' } });
    fireEvent.change(sliders[1], { target: { value: '0.5' } });
    fireEvent.change(sliders[0], { target: { value: '50' } });
    fireEvent.change(sliders[1], { target: { value: '1' } });
    
    // Should handle rapid changes gracefully
    await waitFor(() => {
      // App should still be responsive
      expect(screen.getByRole('main')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Eventually processing should complete
    await waitFor(() => {
      const processingElements = screen.queryAllByText(/処理中|Processing|Worker処理/);
      expect(processingElements.length).toBe(0);
    }, { timeout: 10000 });
  });

  it('should show worker status correctly', async () => {
    render(<App />);
    
    // Initially should show worker starting
    expect(screen.getByText(/Worker Starting/)).toBeInTheDocument();
    
    // Should progress to WASM loading
    await waitFor(() => {
      expect(screen.queryByText(/WASM Loading/)).toBeInTheDocument();
    }, { timeout: 500 });
    
    // Finally should show ready
    await waitFor(() => {
      expect(screen.queryByText(/Worker Ready/)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});