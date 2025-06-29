/**
 * Image Processing Web Worker
 * 
 * This worker handles heavy image processing operations in the background,
 * preventing UI blocking and providing better user experience.
 */

let wasmModule = null;
let isWasmInitialized = false;
const processingQueue = [];
let isProcessing = false;

/**
 * Initialize WASM module in the worker context
 */
async function initializeWasm() {
  if (isWasmInitialized) return;
  
  try {
    console.log('ImageWorker: Initializing WASM...');
    // Import WASM module (adjust path as needed)
    const wasmImport = await import('./src/pkg/image_app.js');
    await wasmImport.default();
    wasmModule = wasmImport;
    isWasmInitialized = true;
    
    console.log('ImageWorker: WASM initialized successfully');
    self.postMessage({
      type: 'WASM_INITIALIZED',
      success: true
    });
  } catch (error) {
    console.error('ImageWorker: WASM initialization failed:', error);
    self.postMessage({
      type: 'WASM_INITIALIZATION_ERROR',
      error: error.message
    });
  }
}

/**
 * Process image with given parameters
 */
async function processImage(imageData, adjustments, taskId) {
  if (!isWasmInitialized) {
    throw new Error('WASM module not initialized');
  }
  
  let processedData = new Uint8Array(imageData);
  const totalSteps = calculateTotalSteps(adjustments);
  let currentStep = 0;
  
  try {
    // Step 1: Basic adjustments (fast operations)
    if (needsBasicAdjustments(adjustments)) {
      self.postMessage({
        type: 'PROCESSING_PROGRESS',
        taskId,
        progress: Math.round((currentStep / totalSteps) * 100),
        message: '基本調整を適用中...'
      });
      
      if (adjustments.brightness !== 0) {
        processedData = wasmModule.adjust_brightness(processedData, adjustments.brightness);
        currentStep++;
        updateProgress(taskId, currentStep, totalSteps, '明度調整完了');
      }
      
      if (adjustments.contrast !== 0) {
        processedData = wasmModule.adjust_contrast(processedData, adjustments.contrast * 0.1);
        currentStep++;
        updateProgress(taskId, currentStep, totalSteps, 'コントラスト調整完了');
      }
      
      if (adjustments.saturation !== 0) {
        processedData = wasmModule.adjust_saturation(processedData, adjustments.saturation * 0.1);
        currentStep++;
        updateProgress(taskId, currentStep, totalSteps, '彩度調整完了');
      }
      
      if (adjustments.temperature !== 0) {
        processedData = wasmModule.adjust_white_balance(processedData, adjustments.temperature);
        currentStep++;
        updateProgress(taskId, currentStep, totalSteps, '色温度調整完了');
      }
    }
    
    // Yield control to allow other tasks
    await yieldToMain();
    
    // Step 2: Color adjustments
    if (adjustments.hue !== 0) {
      updateProgress(taskId, currentStep, totalSteps, '色相調整を適用中...');
      processedData = wasmModule.adjust_hue(processedData, adjustments.hue);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, '色相調整完了');
      await yieldToMain();
    }
    
    if (adjustments.exposure !== 0) {
      updateProgress(taskId, currentStep, totalSteps, '露出調整を適用中...');
      processedData = wasmModule.adjust_exposure(processedData, adjustments.exposure);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, '露出調整完了');
      await yieldToMain();
    }
    
    if (adjustments.vibrance !== 0) {
      updateProgress(taskId, currentStep, totalSteps, 'バイブランス調整を適用中...');
      processedData = wasmModule.adjust_vibrance(processedData, adjustments.vibrance);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'バイブランス調整完了');
      await yieldToMain();
    }
    
    // Step 3: Advanced adjustments
    if (adjustments.highlights !== 0) {
      updateProgress(taskId, currentStep, totalSteps, 'ハイライト調整を適用中...');
      processedData = wasmModule.adjust_highlights(processedData, adjustments.highlights);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'ハイライト調整完了');
      await yieldToMain();
    }
    
    if (adjustments.shadows !== 0) {
      updateProgress(taskId, currentStep, totalSteps, 'シャドウ調整を適用中...');
      processedData = wasmModule.adjust_shadows(processedData, adjustments.shadows);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'シャドウ調整完了');
      await yieldToMain();
    }
    
    if (needsCurveAdjustments(adjustments)) {
      updateProgress(taskId, currentStep, totalSteps, 'カラーカーブを適用中...');
      processedData = wasmModule.adjust_curves(
        processedData, 
        adjustments.redGamma || 1.0, 
        adjustments.greenGamma || 1.0, 
        adjustments.blueGamma || 1.0
      );
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'カラーカーブ調整完了');
      await yieldToMain();
    }
    
    if (needsLevelsAdjustments(adjustments)) {
      updateProgress(taskId, currentStep, totalSteps, 'レベル補正を適用中...');
      processedData = wasmModule.adjust_levels(
        processedData, 
        adjustments.blackPoint || 0, 
        adjustments.whitePoint || 255, 
        adjustments.gamma || 1.0
      );
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'レベル補正完了');
      await yieldToMain();
    }
    
    // Step 4: Filters (heavy operations)
    if (adjustments.blur && adjustments.blur > 0) {
      updateProgress(taskId, currentStep, totalSteps, 'ブラー効果を適用中...');
      processedData = wasmModule.gaussian_blur(processedData, adjustments.blur);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'ブラー効果完了');
      await yieldToMain();
    }
    
    if (adjustments.sharpen && adjustments.sharpen > 0) {
      updateProgress(taskId, currentStep, totalSteps, 'シャープ効果を適用中...');
      processedData = wasmModule.sharpen(processedData, adjustments.sharpen);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'シャープ効果完了');
      await yieldToMain();
    }
    
    if (adjustments.vignetteStrength && adjustments.vignetteStrength > 0) {
      updateProgress(taskId, currentStep, totalSteps, 'ビネット効果を適用中...');
      processedData = wasmModule.apply_vignette(
        processedData, 
        adjustments.vignetteStrength, 
        adjustments.vignetteRadius || 0.8
      );
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'ビネット効果完了');
      await yieldToMain();
    }
    
    if (adjustments.noiseReduction && adjustments.noiseReduction > 0) {
      updateProgress(taskId, currentStep, totalSteps, 'ノイズ除去を適用中...');
      processedData = wasmModule.reduce_noise(processedData, adjustments.noiseReduction);
      currentStep++;
      updateProgress(taskId, currentStep, totalSteps, 'ノイズ除去完了');
    }
    
    // Complete processing
    self.postMessage({
      type: 'PROCESSING_COMPLETE',
      taskId,
      result: processedData,
      progress: 100,
      message: '処理完了'
    });
    
  } catch (error) {
    self.postMessage({
      type: 'PROCESSING_ERROR',
      taskId,
      error: error.message
    });
  }
}

/**
 * Helper functions
 */
function calculateTotalSteps(adjustments) {
  let steps = 0;
  
  if (adjustments.brightness !== 0) steps++;
  if (adjustments.contrast !== 0) steps++;
  if (adjustments.saturation !== 0) steps++;
  if (adjustments.temperature !== 0) steps++;
  if (adjustments.hue !== 0) steps++;
  if (adjustments.exposure !== 0) steps++;
  if (adjustments.vibrance !== 0) steps++;
  if (adjustments.highlights !== 0) steps++;
  if (adjustments.shadows !== 0) steps++;
  if (needsCurveAdjustments(adjustments)) steps++;
  if (needsLevelsAdjustments(adjustments)) steps++;
  if (adjustments.blur && adjustments.blur > 0) steps++;
  if (adjustments.sharpen && adjustments.sharpen > 0) steps++;
  if (adjustments.vignetteStrength && adjustments.vignetteStrength > 0) steps++;
  if (adjustments.noiseReduction && adjustments.noiseReduction > 0) steps++;
  
  return Math.max(steps, 1);
}

function needsBasicAdjustments(adjustments) {
  return adjustments.brightness !== 0 || 
         adjustments.contrast !== 0 || 
         adjustments.saturation !== 0 || 
         adjustments.temperature !== 0;
}

function needsCurveAdjustments(adjustments) {
  return (adjustments.redGamma && adjustments.redGamma !== 1.0) ||
         (adjustments.greenGamma && adjustments.greenGamma !== 1.0) ||
         (adjustments.blueGamma && adjustments.blueGamma !== 1.0);
}

function needsLevelsAdjustments(adjustments) {
  return (adjustments.blackPoint && adjustments.blackPoint !== 0) ||
         (adjustments.whitePoint && adjustments.whitePoint !== 255) ||
         (adjustments.gamma && adjustments.gamma !== 1.0);
}

function updateProgress(taskId, currentStep, totalSteps, message) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  self.postMessage({
    type: 'PROCESSING_PROGRESS',
    taskId,
    progress,
    message
  });
}

async function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Process task queue
 */
async function processQueue() {
  if (isProcessing || processingQueue.length === 0) return;
  
  isProcessing = true;
  
  while (processingQueue.length > 0) {
    const task = processingQueue.shift();
    await processImage(task.imageData, task.adjustments, task.taskId);
  }
  
  isProcessing = false;
}

/**
 * Message handler
 */
self.onmessage = async function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'INITIALIZE_WASM':
      await initializeWasm();
      break;
      
    case 'PROCESS_IMAGE':
      const { imageData, adjustments, taskId } = data;
      
      // Cancel any pending tasks with the same taskId
      const existingTaskIndex = processingQueue.findIndex(task => task.taskId === taskId);
      if (existingTaskIndex !== -1) {
        processingQueue.splice(existingTaskIndex, 1);
      }
      
      // Add new task to queue
      processingQueue.push({ imageData, adjustments, taskId });
      
      // Process queue
      await processQueue();
      break;
      
    case 'CANCEL_TASK':
      const { taskId: cancelTaskId } = data;
      const taskIndex = processingQueue.findIndex(task => task.taskId === cancelTaskId);
      if (taskIndex !== -1) {
        processingQueue.splice(taskIndex, 1);
        self.postMessage({
          type: 'TASK_CANCELLED',
          taskId: cancelTaskId
        });
      }
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

// Initialize immediately
console.log('ImageWorker: Starting up...');
self.postMessage({ type: 'WORKER_READY' });
console.log('ImageWorker: Ready message sent');