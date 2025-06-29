/**
 * useImageWorker Hook
 * 
 * Manages Web Worker for background image processing, providing
 * non-blocking image operations with progress tracking.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  hue: number;
  exposure: number;
  vibrance: number;
  highlights: number;
  shadows: number;
  redGamma?: number;
  greenGamma?: number;
  blueGamma?: number;
  blackPoint?: number;
  whitePoint?: number;
  gamma?: number;
  blur?: number;
  sharpen?: number;
  vignetteStrength?: number;
  vignetteRadius?: number;
  noiseReduction?: number;
}

export interface ProcessingProgress {
  progress: number;
  message: string;
}

export interface ProcessingResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

type ProcessingCallback = (result: ProcessingResult) => void;
type ProgressCallback = (progress: ProcessingProgress) => void;

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isWasmInitialized, setIsWasmInitialized] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ProcessingProgress | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);
  const processingCallbackRef = useRef<ProcessingCallback | null>(null);
  const progressCallbackRef = useRef<ProgressCallback | null>(null);
  
  /**
   * Initialize Web Worker
   */
  useEffect(() => {
    const initializeWorker = () => {
      try {
        const worker = new Worker('/imageWorker.js', { type: 'module' });
        
        worker.onmessage = (event) => {
          const { type, ...data } = event.data;
          
          switch (type) {
            case 'WORKER_READY':
              setIsWorkerReady(true);
              // Initialize WASM in worker
              worker.postMessage({ type: 'INITIALIZE_WASM' });
              break;
              
            case 'WASM_INITIALIZED':
              if (data.success) {
                setIsWasmInitialized(true);
              }
              break;
              
            case 'WASM_INITIALIZATION_ERROR':
              console.error('WASM initialization error:', data.error);
              if (processingCallbackRef.current) {
                processingCallbackRef.current({
                  success: false,
                  error: 'WASM初期化に失敗しました'
                });
              }
              break;
              
            case 'PROCESSING_PROGRESS':
              if (data.taskId === currentTaskIdRef.current) {
                const progressData = {
                  progress: data.progress,
                  message: data.message
                };
                setCurrentProgress(progressData);
                if (progressCallbackRef.current) {
                  progressCallbackRef.current(progressData);
                }
              }
              break;
              
            case 'PROCESSING_COMPLETE':
              if (data.taskId === currentTaskIdRef.current) {
                setCurrentProgress(null);
                if (processingCallbackRef.current) {
                  processingCallbackRef.current({
                    success: true,
                    data: data.result
                  });
                }
                currentTaskIdRef.current = null;
                processingCallbackRef.current = null;
                progressCallbackRef.current = null;
              }
              break;
              
            case 'PROCESSING_ERROR':
              if (data.taskId === currentTaskIdRef.current) {
                setCurrentProgress(null);
                if (processingCallbackRef.current) {
                  processingCallbackRef.current({
                    success: false,
                    error: data.error
                  });
                }
                currentTaskIdRef.current = null;
                processingCallbackRef.current = null;
                progressCallbackRef.current = null;
              }
              break;
              
            case 'TASK_CANCELLED':
              if (data.taskId === currentTaskIdRef.current) {
                setCurrentProgress(null);
                currentTaskIdRef.current = null;
                processingCallbackRef.current = null;
                progressCallbackRef.current = null;
              }
              break;
              
            default:
              console.warn('Unknown worker message type:', type);
          }
        };
        
        worker.onerror = (error) => {
          console.error('Worker error:', error);
          if (processingCallbackRef.current) {
            processingCallbackRef.current({
              success: false,
              error: 'Worker処理エラーが発生しました'
            });
          }
        };
        
        workerRef.current = worker;
        
      } catch (error) {
        console.error('Failed to create worker:', error);
      }
    };
    
    initializeWorker();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  /**
   * Process image with adjustments
   */
  const processImage = useCallback(async (
    imageData: Uint8Array,
    adjustments: ImageAdjustments,
    onProgress?: ProgressCallback
  ): Promise<ProcessingResult> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isWasmInitialized) {
        resolve({
          success: false,
          error: 'Worker または WASM が初期化されていません'
        });
        return;
      }
      
      // Cancel any existing task
      if (currentTaskIdRef.current) {
        workerRef.current.postMessage({
          type: 'CANCEL_TASK',
          data: { taskId: currentTaskIdRef.current }
        });
      }
      
      // Generate unique task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      currentTaskIdRef.current = taskId;
      
      // Set callbacks
      processingCallbackRef.current = resolve;
      progressCallbackRef.current = onProgress || null;
      
      // Start processing
      workerRef.current.postMessage({
        type: 'PROCESS_IMAGE',
        data: {
          imageData: imageData,
          adjustments: adjustments,
          taskId: taskId
        }
      });
    });
  }, [isWasmInitialized]);
  
  /**
   * Cancel current processing task
   */
  const cancelProcessing = useCallback(() => {
    if (workerRef.current && currentTaskIdRef.current) {
      workerRef.current.postMessage({
        type: 'CANCEL_TASK',
        data: { taskId: currentTaskIdRef.current }
      });
    }
  }, []);
  
  /**
   * Check if worker is ready for processing
   */
  const isReady = isWorkerReady && isWasmInitialized;
  
  /**
   * Check if currently processing
   */
  const isProcessing = currentTaskIdRef.current !== null;
  
  return {
    processImage,
    cancelProcessing,
    isReady,
    isProcessing,
    isWorkerReady,
    isWasmInitialized,
    currentProgress
  };
}