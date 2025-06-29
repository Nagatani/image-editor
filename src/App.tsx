import { useState, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import './App.css';
import init, * as wasm from './pkg/image_app.js';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useImageWorker, type ImageAdjustments } from './hooks/useImageWorker';
import {
  AppHeader,
  BasicAdjustments,
  FilterControls,
  AdvancedAdjustments,
  TransformTools,
  PresetManager,
  HistogramDisplay
} from './components';

// 状態管理のためのReducer
type PresetData = {
  name: string;
  params: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    hue: number;
    exposure: number;
    vibrance: number;
  };
  blurParams: {
    sigma: number;
  };
  sharpenParams: {
    amount: number;
  };
  vignetteParams: {
    strength: number;
    radius: number;
  };
  noiseReductionParams: {
    strength: number;
  };
  highlightShadowParams: {
    highlights: number;
    shadows: number;
  };
  curveParams: {
    redGamma: number;
    greenGamma: number;
    blueGamma: number;
  };
  levelsParams: {
    blackPoint: number;
    whitePoint: number;
    gamma: number;
  };
};

type HistoryState = {
  originalImage: { data: Uint8Array, url: string } | null;
  processedImageUrl: string | null;
  params: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    hue: number;
    exposure: number;
    vibrance: number;
  };
  blurParams: {
    sigma: number;
  };
  sharpenParams: {
    amount: number;
  };
  vignetteParams: {
    strength: number;
    radius: number;
  };
  noiseReductionParams: {
    strength: number;
  };
  highlightShadowParams: {
    highlights: number;
    shadows: number;
  };
  curveParams: {
    redGamma: number;
    greenGamma: number;
    blueGamma: number;
  };
  levelsParams: {
    blackPoint: number;
    whitePoint: number;
    gamma: number;
  };
};

type State = {
  originalImage: { data: Uint8Array, url: string } | null;
  processedImageUrl: string | null;
  isLoading: boolean;
  params: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    hue: number;
    exposure: number;
    vibrance: number;
  };
  resizeParams: {
    width: number;
    height: number;
    aspectLocked: boolean;
  };
  blurParams: {
    sigma: number;
  };
  sharpenParams: {
    amount: number;
  };
  vignetteParams: {
    strength: number;
    radius: number;
  };
  noiseReductionParams: {
    strength: number;
  };
  highlightShadowParams: {
    highlights: number;
    shadows: number;
  };
  curveParams: {
    redGamma: number;
    greenGamma: number;
    blueGamma: number;
  };
  levelsParams: {
    blackPoint: number;
    whitePoint: number;
    gamma: number;
  };
  presets: PresetData[];
  history: HistoryState[];
  historyIndex: number;
};

type Action =
  | { type: 'SET_IMAGE'; payload: { data: Uint8Array; url: string } }
  | { type: 'SET_PARAM'; payload: { key: keyof State['params']; value: number } }
  | { type: 'SET_RESIZE_PARAM'; payload: { key: keyof State['resizeParams']; value: number | boolean } }
  | { type: 'SET_BLUR_PARAM'; payload: { key: keyof State['blurParams']; value: number } }
  | { type: 'SET_SHARPEN_PARAM'; payload: { key: keyof State['sharpenParams']; value: number } }
  | { type: 'SET_VIGNETTE_PARAM'; payload: { key: keyof State['vignetteParams']; value: number } }
  | { type: 'SET_NOISE_REDUCTION_PARAM'; payload: { key: keyof State['noiseReductionParams']; value: number } }
  | { type: 'SET_HIGHLIGHT_SHADOW_PARAM'; payload: { key: keyof State['highlightShadowParams']; value: number } }
  | { type: 'SET_CURVE_PARAM'; payload: { key: keyof State['curveParams']; value: number } }
  | { type: 'SET_LEVELS_PARAM'; payload: { key: keyof State['levelsParams']; value: number } }
  | { type: 'SAVE_PRESET'; payload: { name: string } }
  | { type: 'LOAD_PRESET'; payload: { preset: PresetData } }
  | { type: 'DELETE_PRESET'; payload: { index: number } }
  | { type: 'SET_PRESETS'; payload: PresetData[] }
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'SET_PROCESSED_IMAGE'; payload: string }
  | { type: 'RESET_PARAMS' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_TO_HISTORY' };

const initialState: State = {
  originalImage: null,
  processedImageUrl: null,
  isLoading: true,
  params: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, hue: 0, exposure: 0, vibrance: 0 },
  resizeParams: { width: 800, height: 600, aspectLocked: true },
  blurParams: { sigma: 0 },
  sharpenParams: { amount: 0 },
  vignetteParams: { strength: 0, radius: 50 },
  noiseReductionParams: { strength: 0 },
  highlightShadowParams: { highlights: 0, shadows: 0 },
  curveParams: { redGamma: 1.0, greenGamma: 1.0, blueGamma: 1.0 },
  levelsParams: { blackPoint: 0, whitePoint: 255, gamma: 1.0 },
  presets: [],
  history: [],
  historyIndex: -1,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_IMAGE': {
      console.log('SET_IMAGE action:', {
        hasOriginalImage: !!state.originalImage,
        actionUrl: action.payload.url,
        currentHistory: state.history.length,
        currentIndex: state.historyIndex
      });
      
      // Check if this is completely new image from file input (not a processed result)
      const isCompletelyNewImage = !state.originalImage;
      
      const newState = { 
        ...state,
        isLoading: false, 
        originalImage: action.payload, 
        processedImageUrl: action.payload.url,
        // Reset params only for completely new images
        params: isCompletelyNewImage ? initialState.params : state.params,
        blurParams: isCompletelyNewImage ? initialState.blurParams : state.blurParams,
        sharpenParams: isCompletelyNewImage ? initialState.sharpenParams : state.sharpenParams,
        vignetteParams: isCompletelyNewImage ? initialState.vignetteParams : state.vignetteParams,
        noiseReductionParams: isCompletelyNewImage ? initialState.noiseReductionParams : state.noiseReductionParams,
        highlightShadowParams: isCompletelyNewImage ? initialState.highlightShadowParams : state.highlightShadowParams,
        curveParams: isCompletelyNewImage ? initialState.curveParams : state.curveParams,
        levelsParams: isCompletelyNewImage ? initialState.levelsParams : state.levelsParams,
        // Reset history only for completely new images - DO NOT modify history for processed results
        history: isCompletelyNewImage ? [] : state.history,
        historyIndex: isCompletelyNewImage ? -1 : state.historyIndex
      };
      
      if (action.payload.data && isCompletelyNewImage) {
        // Update resize params with actual image dimensions
        const img = new Image();
        img.onload = () => {
          newState.resizeParams = { ...newState.resizeParams, width: img.naturalWidth, height: img.naturalHeight };
        };
        img.src = action.payload.url;
      }
      
      console.log('SET_IMAGE result:', {
        newHistory: newState.history.length,
        newIndex: newState.historyIndex,
        isNewImage: isCompletelyNewImage
      });
      
      return newState;
    }
    case 'SET_PARAM':
      return { ...state, params: { ...state.params, [action.payload.key]: action.payload.value } };
    case 'SET_RESIZE_PARAM':
      return { ...state, resizeParams: { ...state.resizeParams, [action.payload.key]: action.payload.value } };
    case 'SET_BLUR_PARAM':
      return { ...state, blurParams: { ...state.blurParams, [action.payload.key]: action.payload.value } };
    case 'SET_SHARPEN_PARAM':
      return { ...state, sharpenParams: { ...state.sharpenParams, [action.payload.key]: action.payload.value } };
    case 'SET_VIGNETTE_PARAM':
      return { ...state, vignetteParams: { ...state.vignetteParams, [action.payload.key]: action.payload.value } };
    case 'SET_NOISE_REDUCTION_PARAM':
      return { ...state, noiseReductionParams: { ...state.noiseReductionParams, [action.payload.key]: action.payload.value } };
    case 'SET_HIGHLIGHT_SHADOW_PARAM':
      return { ...state, highlightShadowParams: { ...state.highlightShadowParams, [action.payload.key]: action.payload.value } };
    case 'SET_CURVE_PARAM':
      return { ...state, curveParams: { ...state.curveParams, [action.payload.key]: action.payload.value } };
    case 'SET_LEVELS_PARAM':
      return { ...state, levelsParams: { ...state.levelsParams, [action.payload.key]: action.payload.value } };
    case 'SAVE_PRESET': {
      const newPreset: PresetData = {
        name: action.payload.name,
        params: { ...state.params },
        blurParams: { ...state.blurParams },
        sharpenParams: { ...state.sharpenParams },
        vignetteParams: { ...state.vignetteParams },
        noiseReductionParams: { ...state.noiseReductionParams },
        highlightShadowParams: { ...state.highlightShadowParams },
        curveParams: { ...state.curveParams },
        levelsParams: { ...state.levelsParams },
      };
      return { ...state, presets: [...state.presets, newPreset] };
    }
    case 'LOAD_PRESET': {
      const preset = action.payload.preset;
      return {
        ...state,
        params: { ...preset.params },
        blurParams: { ...preset.blurParams },
        sharpenParams: { ...preset.sharpenParams },
        vignetteParams: { ...preset.vignetteParams },
        noiseReductionParams: { ...preset.noiseReductionParams },
        highlightShadowParams: { ...preset.highlightShadowParams },
        curveParams: { ...preset.curveParams },
        levelsParams: { ...preset.levelsParams },
      };
    }
    case 'DELETE_PRESET': {
      const newPresets = [...state.presets];
      newPresets.splice(action.payload.index, 1);
      return { ...state, presets: newPresets };
    }
    case 'SET_PRESETS':
      return { ...state, presets: action.payload };
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'STOP_LOADING':
      return { ...state, isLoading: false };
    case 'SET_PROCESSED_IMAGE':
      return { ...state, isLoading: false, processedImageUrl: action.payload };
    case 'RESET_PARAMS':
      return { ...state, params: initialState.params, blurParams: initialState.blurParams, sharpenParams: initialState.sharpenParams, vignetteParams: initialState.vignetteParams, noiseReductionParams: initialState.noiseReductionParams, highlightShadowParams: initialState.highlightShadowParams, curveParams: initialState.curveParams, levelsParams: initialState.levelsParams };
    case 'SAVE_TO_HISTORY': {
      const currentHistoryState: HistoryState = {
        originalImage: state.originalImage,
        processedImageUrl: state.processedImageUrl,
        params: { ...state.params },
        blurParams: { ...state.blurParams },
        sharpenParams: { ...state.sharpenParams },
        vignetteParams: { ...state.vignetteParams },
        noiseReductionParams: { ...state.noiseReductionParams },
        highlightShadowParams: { ...state.highlightShadowParams },
        curveParams: { ...state.curveParams },
        levelsParams: { ...state.levelsParams },
      };
      
      console.log('SAVE_TO_HISTORY:', {
        beforeSave: { historyLength: state.history.length, historyIndex: state.historyIndex },
        saving: !!state.originalImage
      });
      
      // Remove any future history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(currentHistoryState);
      
      // Limit history to 20 items to prevent memory issues
      const limitedHistory = newHistory.slice(-20);
      
      console.log('SAVE_TO_HISTORY result:', {
        afterSave: { historyLength: limitedHistory.length, historyIndex: limitedHistory.length - 1 }
      });
      
      return {
        ...state,
        history: limitedHistory,
        historyIndex: limitedHistory.length - 1,
      };
    }
    case 'UNDO': {
      console.log('UNDO reducer:', { historyIndex: state.historyIndex, historyLength: state.history.length });
      if (state.historyIndex <= 0) {
        console.log('Cannot undo: at beginning of history');
        return state;
      }
      
      const prevState = state.history[state.historyIndex - 1];
      console.log('Undoing to state:', state.historyIndex - 1);
      return {
        ...state,
        originalImage: prevState.originalImage,
        processedImageUrl: prevState.processedImageUrl,
        params: { ...prevState.params },
        blurParams: { ...prevState.blurParams },
        sharpenParams: { ...prevState.sharpenParams },
        vignetteParams: { ...prevState.vignetteParams },
        noiseReductionParams: { ...prevState.noiseReductionParams },
        highlightShadowParams: { ...prevState.highlightShadowParams },
        curveParams: { ...prevState.curveParams },
        levelsParams: { ...prevState.levelsParams },
        historyIndex: state.historyIndex - 1,
      };
    }
    case 'REDO': {
      console.log('REDO reducer:', { historyIndex: state.historyIndex, historyLength: state.history.length });
      if (state.historyIndex >= state.history.length - 1) {
        console.log('Cannot redo: at end of history');
        return state;
      }
      
      const nextState = state.history[state.historyIndex + 1];
      console.log('Redoing to state:', state.historyIndex + 1);
      return {
        ...state,
        originalImage: nextState.originalImage,
        processedImageUrl: nextState.processedImageUrl,
        params: { ...nextState.params },
        blurParams: { ...nextState.blurParams },
        sharpenParams: { ...nextState.sharpenParams },
        vignetteParams: { ...nextState.vignetteParams },
        noiseReductionParams: { ...nextState.noiseReductionParams },
        highlightShadowParams: { ...nextState.highlightShadowParams },
        curveParams: { ...nextState.curveParams },
        levelsParams: { ...nextState.levelsParams },
        historyIndex: state.historyIndex + 1,
      };
    }
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [crop, setCrop] = useState<Crop>();
  const [isWasmReady, setWasmReady] = useState(false);
  
  // Web Worker for background processing
  const { 
    processImage: processWithWorker, 
    isReady: isWorkerReady,
    isProcessing: isWorkerProcessing,
    cancelProcessing
  } = useImageWorker();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('edited-image');
  const [saveFormat, setSaveFormat] = useState<'png' | 'jpeg' | 'webp' | 'avif'>('png');
  const [saveQuality, setSaveQuality] = useState(90); // 0-100 for JPEG/WebP/AVIF
  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false
  });
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init().then(() => {
      setWasmReady(true);
      dispatch({ type: 'START_LOADING' });
    });
    
    // Load presets from localStorage
    const savedPresets = localStorage.getItem('imageEditorPresets');
    if (savedPresets) {
      try {
        const presets = JSON.parse(savedPresets);
        dispatch({ type: 'SET_PRESETS', payload: presets });
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    }
    
    // Check browser support for WebP and AVIF
    const checkFormatSupport = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      // Check WebP support
      const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // Check AVIF support using a more reliable method
      let avifSupport = false;
      try {
        // Try creating a blob first
        const dataUrl = canvas.toDataURL('image/avif');
        avifSupport = dataUrl.indexOf('data:image/avif') === 0;
        
        // Alternative check: use feature detection
        if (!avifSupport) {
          // Check if the browser supports AVIF by testing toBlob
          const hasToBlob = new Promise((resolve) => {
            canvas.toBlob((blob) => {
              resolve(!!blob && blob.type === 'image/avif');
            }, 'image/avif', 0.8);
          });
          avifSupport = await hasToBlob as boolean;
        }
      } catch (e) {
        console.log('AVIF not supported:', e);
        avifSupport = false;
      }
      
      // Fallback: Enable AVIF for modern browsers (Chrome 85+, Firefox 93+)
      if (!avifSupport) {
        const userAgent = navigator.userAgent;
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
        
        if (chromeMatch && parseInt(chromeMatch[1]) >= 85) {
          avifSupport = true;
        } else if (firefoxMatch && parseInt(firefoxMatch[1]) >= 93) {
          avifSupport = true;
        }
      }
      
      setSupportedFormats({
        webp: webpSupport,
        avif: avifSupport
      });
      
      console.log('Format support:', { webp: webpSupport, avif: avifSupport });
    };
    
    checkFormatSupport();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      showErrorMessage('サポートされていないファイル形式です。JPEG、PNG、WebP、AVIF、BMP、TIFFファイルをお選びください。');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showErrorMessage('ファイルサイズが大きすぎます。50MB以下のファイルをお選びください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        
        // Validate that we got data
        if (!data || data.length === 0) {
          showErrorMessage('ファイルの読み込みに失敗しました。ファイルが破損している可能性があります。');
          return;
        }
        
        const url = URL.createObjectURL(new Blob([data]));
        dispatch({ type: 'SET_IMAGE', payload: { data, url } });
        
        // Save initial state to history after image load
        setTimeout(() => {
          dispatch({ type: 'SAVE_TO_HISTORY' });
        }, 100);
        
        // Clear any previous errors
        hideError();
      } catch (error) {
        console.error('File processing failed:', error);
        showErrorMessage('ファイルの読み込み中にエラーが発生しました。');
      }
    };
    
    reader.onerror = () => {
      showErrorMessage('ファイルの読み込み中にエラーが発生しました。');
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  const handleParamChange = (key: keyof State['params'], value: string) => {
      dispatch({ type: 'SET_PARAM', payload: { key, value: Number(value) } });
  }

  // Error handling utility
  const showErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
    setShowError(true);
    
    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // Auto-hide error after 5 seconds
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(false);
      setErrorMessage('');
    }, 5000);
  }, []);

  const hideError = useCallback(() => {
    setShowError(false);
    setErrorMessage('');
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
  }, []);

  // Optimized processing queue to prioritize fast operations
  const processImage = useCallback(async (imageData: Uint8Array): Promise<Uint8Array> => {
    let processedData = imageData;
    let currentData: Uint8Array | null = null;
    
    // Helper function to manage memory and clean up intermediate results
    const applyAdjustment = (data: Uint8Array, adjustmentFn: () => Uint8Array): Uint8Array => {
      const result = adjustmentFn();
      // Clean up previous data if it's not the original
      if (currentData && currentData !== imageData) {
        currentData = null; // Allow GC
      }
      currentData = result;
      return result;
    };
    
    // Step 1: Fast basic adjustments (batched for better performance)
    setProcessingProgress('基本調整を適用中...');
    
    // Only apply adjustments if they're not at default values
    const needsBrightness = state.params.brightness !== 0;
    const needsContrast = state.params.contrast !== 0;
    const needsSaturation = state.params.saturation !== 0;
    const needsTemperature = state.params.temperature !== 0;
    
    if (needsBrightness || needsContrast || needsSaturation || needsTemperature) {
      if (needsBrightness) {
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_brightness(processedData, state.params.brightness)
        );
      }
      if (needsContrast) {
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_contrast(processedData, state.params.contrast * 0.1)
        );
      }
      if (needsSaturation) {
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_saturation(processedData, state.params.saturation * 0.1)
        );
      }
      if (needsTemperature) {
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_white_balance(processedData, state.params.temperature)
        );
      }
    }
    
    // Step 2: Color adjustments (yield to UI after basic adjustments)
    const hasColorAdjustments = state.params.hue !== 0 || state.params.exposure !== 0 || state.params.vibrance !== 0;
    
    if (hasColorAdjustments) {
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (state.params.hue !== 0) {
        setProcessingProgress('色相調整を適用中...');
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_hue(processedData, state.params.hue)
        );
      }
      
      if (state.params.exposure !== 0) {
        setProcessingProgress('露出調整を適用中...');
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_exposure(processedData, state.params.exposure)
        );
      }
      
      if (state.params.vibrance !== 0) {
        setProcessingProgress('バイブランス調整を適用中...');
        processedData = applyAdjustment(processedData, () => 
          wasm.adjust_vibrance(processedData, state.params.vibrance)
        );
      }
    }
    
    // Step 3: Advanced adjustments (potentially slower)
    if (state.highlightShadowParams.highlights !== 0) {
      setProcessingProgress('ハイライト調整を適用中...');
      processedData = wasm.adjust_highlights(processedData, state.highlightShadowParams.highlights);
    }
    
    if (state.highlightShadowParams.shadows !== 0) {
      setProcessingProgress('シャドウ調整を適用中...');
      processedData = wasm.adjust_shadows(processedData, state.highlightShadowParams.shadows);
    }
    
    if (state.curveParams.redGamma !== 1.0 || state.curveParams.greenGamma !== 1.0 || state.curveParams.blueGamma !== 1.0) {
      setProcessingProgress('カラーカーブを適用中...');
      processedData = wasm.adjust_curves(processedData, state.curveParams.redGamma, state.curveParams.greenGamma, state.curveParams.blueGamma);
    }
    
    if (state.levelsParams.blackPoint !== 0 || state.levelsParams.whitePoint !== 255 || state.levelsParams.gamma !== 1.0) {
      setProcessingProgress('レベル補正を適用中...');
      processedData = wasm.adjust_levels(processedData, state.levelsParams.blackPoint, state.levelsParams.whitePoint, state.levelsParams.gamma);
    }
    
    // Step 4: Filters (often the slowest operations)
    if (state.blurParams.sigma > 0) {
      setProcessingProgress('ブラー効果を適用中...');
      processedData = wasm.gaussian_blur(processedData, state.blurParams.sigma);
    }
    
    if (state.sharpenParams.amount > 0) {
      setProcessingProgress('シャープ効果を適用中...');
      processedData = wasm.sharpen(processedData, state.sharpenParams.amount);
    }
    
    if (state.vignetteParams.strength > 0) {
      setProcessingProgress('ビネット効果を適用中...');
      processedData = wasm.apply_vignette(processedData, state.vignetteParams.strength, state.vignetteParams.radius);
    }
    
    if (state.noiseReductionParams.strength > 0) {
      setProcessingProgress('ノイズ除去を適用中...');
      processedData = wasm.reduce_noise(processedData, state.noiseReductionParams.strength);
    }
    
    return processedData;
  }, [state.params, state.blurParams, state.sharpenParams, state.vignetteParams, state.noiseReductionParams, state.highlightShadowParams, state.curveParams, state.levelsParams]);

  const applyChanges = useCallback(() => {
    if (!state.originalImage || (!isWasmReady && !isWorkerReady) || isWorkerProcessing) return;
    
    // Clear any existing debounce timeout and cancel processing
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      cancelProcessing();
    }
    
    // Debounce rapid changes
    debounceTimeoutRef.current = setTimeout(async () => {
      // Prefer Worker processing, fallback to direct WASM
      if (isWorkerReady) {
        // Use Web Worker for background processing
        const adjustments: ImageAdjustments = {
          brightness: state.params.brightness,
          contrast: state.params.contrast,
          saturation: state.params.saturation,
          temperature: state.params.temperature,
          hue: state.params.hue,
          exposure: state.params.exposure,
          vibrance: state.params.vibrance,
          highlights: state.highlightShadowParams.highlights,
          shadows: state.highlightShadowParams.shadows,
          redGamma: state.curveParams.redGamma,
          greenGamma: state.curveParams.greenGamma,
          blueGamma: state.curveParams.blueGamma,
          blackPoint: state.levelsParams.blackPoint,
          whitePoint: state.levelsParams.whitePoint,
          gamma: state.levelsParams.gamma,
          blur: state.blurParams.sigma,
          sharpen: state.sharpenParams.amount,
          vignetteStrength: state.vignetteParams.strength,
          vignetteRadius: state.vignetteParams.radius,
          noiseReduction: state.noiseReductionParams.strength
        };
        
        dispatch({ type: 'START_LOADING' });
        
        try {
          const result = await processWithWorker(
            state.originalImage!.data,
            adjustments,
            (progress) => {
              setProcessingProgress(progress.message);
            }
          );
          
          if (result.success && result.data) {
            const url = URL.createObjectURL(new Blob([result.data]));
            dispatch({ type: 'SET_PROCESSED_IMAGE', payload: url });
            
            // Clean up old blob URLs
            if (state.processedImageUrl && state.processedImageUrl !== state.originalImage!.url) {
              URL.revokeObjectURL(state.processedImageUrl);
            }
          } else {
            throw new Error(result.error || 'Worker処理に失敗しました');
          }
        } catch (error) {
          console.error('Worker processing failed:', error);
          const errorMsg = error instanceof Error ? error.message : '画像処理中に予期しないエラーが発生しました';
          showErrorMessage(`画像処理エラー: ${errorMsg}`);
        } finally {
          setProcessingProgress('');
          dispatch({ type: 'STOP_LOADING' });
        }
      } else if (isWasmReady) {
        // Fallback to direct WASM processing
        setIsProcessing(true);
        dispatch({ type: 'START_LOADING' });
        setProcessingProgress('処理を開始中...');
        
        try {
          const processedData = await processImage(state.originalImage!.data);
          setProcessingProgress('画像を生成中...');
          
          const url = URL.createObjectURL(new Blob([processedData]));
          dispatch({ type: 'SET_PROCESSED_IMAGE', payload: url });
          
          if (state.processedImageUrl && state.processedImageUrl !== state.originalImage!.url) {
            URL.revokeObjectURL(state.processedImageUrl);
          }
        } catch (error) {
          console.error('Fallback processing failed:', error);
          const errorMsg = error instanceof Error ? error.message : '画像処理中に予期しないエラーが発生しました';
          showErrorMessage(`画像処理エラー: ${errorMsg}`);
        } finally {
          setIsProcessing(false);
          setProcessingProgress('');
          dispatch({ type: 'STOP_LOADING' });
        }
      }
    }, 150); // 150ms debounce
  }, [
    state.originalImage, 
    state.processedImageUrl, 
    state.params, 
    state.blurParams, 
    state.sharpenParams, 
    state.vignetteParams, 
    state.noiseReductionParams,
    state.highlightShadowParams,
    state.curveParams,
    state.levelsParams,
    isWasmReady,
    isWorkerReady, 
    isWorkerProcessing, 
    processWithWorker,
    cancelProcessing,
    processImage,
    showErrorMessage
  ]);

  useEffect(() => {
    if (state.originalImage) {
      applyChanges();
    }
  }, [state.params, state.blurParams, state.sharpenParams, state.vignetteParams, state.noiseReductionParams, state.originalImage, applyChanges]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProcessMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending debounce operations
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Clean up blob URLs to prevent memory leaks
      if (state.processedImageUrl && state.processedImageUrl !== state.originalImage?.url) {
        URL.revokeObjectURL(state.processedImageUrl);
      }
    };
  }, [state.processedImageUrl, state.originalImage]);


  const handleRotate = (angle: 90 | 180 | 270) => {
    if (!state.originalImage || !isWasmReady || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingProgress(`${angle}度回転を適用中...`);
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    setTimeout(() => {
      try {
        const rotated = wasm.rotate(state.originalImage!.data, angle);
        const url = URL.createObjectURL(new Blob([rotated]));
        dispatch({type: 'SET_IMAGE', payload: {data: rotated, url}});
        // Save state after operation for redo functionality
        setTimeout(() => {
          dispatch({ type: 'SAVE_TO_HISTORY' });
        }, 100);
      } catch (error) {
        console.error('Rotation failed:', error);
        setProcessingProgress('回転処理中にエラーが発生しました');
      } finally {
        setIsProcessing(false);
        setProcessingProgress('');
      }
    }, 50);
  };

  const handleFlipHorizontal = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const flipped = wasm.flip_horizontal(state.originalImage.data);
      console.log('Horizontal flip result length:', flipped.length);
      const url = URL.createObjectURL(new Blob([flipped]));
      dispatch({type: 'SET_IMAGE', payload: {data: flipped, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
      console.log('History after flip:', state.history.length, 'Index:', state.historyIndex);
    } catch (error) {
      console.error('Horizontal flip failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleFlipVertical = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const flipped = wasm.flip_vertical(state.originalImage.data);
      console.log('Vertical flip result length:', flipped.length);
      const url = URL.createObjectURL(new Blob([flipped]));
      dispatch({type: 'SET_IMAGE', payload: {data: flipped, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    } catch (error) {
      console.error('Vertical flip failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleRotateArbitrary = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const rotated = wasm.rotate_arbitrary(state.originalImage.data, rotationAngle);
      console.log('Arbitrary rotation result length:', rotated.length);
      const url = URL.createObjectURL(new Blob([rotated]));
      dispatch({type: 'SET_IMAGE', payload: {data: rotated, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
      setRotationAngle(0); // Reset angle after rotation
    } catch (error) {
      console.error('Arbitrary rotation failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleResize = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const resized = wasm.resize(state.originalImage.data, state.resizeParams.width, state.resizeParams.height);
      console.log('Resize result length:', resized.length);
      const url = URL.createObjectURL(new Blob([resized]));
      dispatch({type: 'SET_IMAGE', payload: {data: resized, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    } catch (error) {
      console.error('Resize failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleResizeParamChange = (key: keyof State['resizeParams'], value: string | boolean) => {
    if (key === 'aspectLocked') {
      dispatch({ type: 'SET_RESIZE_PARAM', payload: { key, value: value as boolean } });
    } else {
      const numValue = Number(value);
      if (key === 'width' && state.resizeParams.aspectLocked && imgRef.current) {
        const aspectRatio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
        dispatch({ type: 'SET_RESIZE_PARAM', payload: { key: 'width', value: numValue } });
        dispatch({ type: 'SET_RESIZE_PARAM', payload: { key: 'height', value: Math.round(numValue * aspectRatio) } });
      } else if (key === 'height' && state.resizeParams.aspectLocked && imgRef.current) {
        const aspectRatio = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
        dispatch({ type: 'SET_RESIZE_PARAM', payload: { key: 'height', value: numValue } });
        dispatch({ type: 'SET_RESIZE_PARAM', payload: { key: 'width', value: Math.round(numValue * aspectRatio) } });
      } else {
        dispatch({ type: 'SET_RESIZE_PARAM', payload: { key, value: numValue } });
      }
    }
  };

  const handleGrayscale = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const grayscaled = wasm.to_grayscale(state.originalImage.data);
      console.log('Grayscale result length:', grayscaled.length);
      const url = URL.createObjectURL(new Blob([grayscaled]));
      dispatch({type: 'SET_IMAGE', payload: {data: grayscaled, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    } catch (error) {
      console.error('Grayscale failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleSepia = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const sepiaed = wasm.apply_sepia(state.originalImage.data);
      console.log('Sepia result length:', sepiaed.length);
      const url = URL.createObjectURL(new Blob([sepiaed]));
      dispatch({type: 'SET_IMAGE', payload: {data: sepiaed, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    } catch (error) {
      console.error('Sepia failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleEmboss = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const embossed = wasm.apply_emboss(state.originalImage.data);
      console.log('Emboss result length:', embossed.length);
      const url = URL.createObjectURL(new Blob([embossed]));
      dispatch({type: 'SET_IMAGE', payload: {data: embossed, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    } catch (error) {
      console.error('Emboss failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleHistogramEqualization = () => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    
    try {
      const equalized = wasm.histogram_equalization(state.originalImage.data);
      console.log('Histogram equalization result length:', equalized.length);
      const url = URL.createObjectURL(new Blob([equalized]));
      dispatch({type: 'SET_IMAGE', payload: {data: equalized, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    } catch (error) {
      console.error('Histogram equalization failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleBlurParamChange = (key: keyof State['blurParams'], value: string) => {
    dispatch({ type: 'SET_BLUR_PARAM', payload: { key, value: Number(value) } });
  };

  const handleSharpenParamChange = (key: keyof State['sharpenParams'], value: string) => {
    dispatch({ type: 'SET_SHARPEN_PARAM', payload: { key, value: Number(value) } });
  };

  const handleVignetteParamChange = (key: keyof State['vignetteParams'], value: string) => {
    dispatch({ type: 'SET_VIGNETTE_PARAM', payload: { key, value: Number(value) } });
  };

  const handleNoiseReductionParamChange = (key: keyof State['noiseReductionParams'], value: string) => {
    dispatch({ type: 'SET_NOISE_REDUCTION_PARAM', payload: { key, value: Number(value) } });
  };

  const handleHighlightShadowParamChange = (key: keyof State['highlightShadowParams'], value: string) => {
    dispatch({ type: 'SET_HIGHLIGHT_SHADOW_PARAM', payload: { key, value: Number(value) } });
  };

  const handleCurveParamChange = (key: keyof State['curveParams'], value: string) => {
    dispatch({ type: 'SET_CURVE_PARAM', payload: { key, value: Number(value) } });
  };

  const handleLevelsParamChange = (key: keyof State['levelsParams'], value: string) => {
    dispatch({ type: 'SET_LEVELS_PARAM', payload: { key, value: Number(value) } });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    dispatch({ type: 'SAVE_PRESET', payload: { name: presetName.trim() } });
    
    // Save to localStorage
    const updatedPresets = [...state.presets, {
      name: presetName.trim(),
      params: { ...state.params },
      blurParams: { ...state.blurParams },
      sharpenParams: { ...state.sharpenParams },
      vignetteParams: { ...state.vignetteParams },
      noiseReductionParams: { ...state.noiseReductionParams },
      highlightShadowParams: { ...state.highlightShadowParams },
      curveParams: { ...state.curveParams },
      levelsParams: { ...state.levelsParams },
    }];
    localStorage.setItem('imageEditorPresets', JSON.stringify(updatedPresets));
    
    setPresetName('');
    setShowPresetDialog(false);
  };

  const handleLoadPreset = (preset: PresetData) => {
    dispatch({ type: 'LOAD_PRESET', payload: { preset } });
  };

  const handleDeletePreset = (index: number) => {
    dispatch({ type: 'DELETE_PRESET', payload: { index } });
    
    // Update localStorage
    const updatedPresets = [...state.presets];
    updatedPresets.splice(index, 1);
    localStorage.setItem('imageEditorPresets', JSON.stringify(updatedPresets));
  };

  const handleSaveImage = () => {
    if (!state.processedImageUrl || !saveFileName.trim()) return;
    
    // Create a canvas to convert the processed image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx?.drawImage(img, 0, 0);
      
      // Set quality based on format
      let quality: number | undefined;
      let mimeType: string;
      
      switch (saveFormat) {
        case 'jpeg':
          quality = saveQuality / 100; // Convert 0-100 to 0-1
          mimeType = 'image/jpeg';
          break;
        case 'webp':
          quality = saveQuality / 100; // Convert 0-100 to 0-1
          mimeType = 'image/webp';
          break;
        case 'avif':
          quality = saveQuality / 100; // Convert 0-100 to 0-1
          mimeType = 'image/avif';
          break;
        case 'png':
        default:
          quality = undefined; // PNG is lossless, no quality setting
          mimeType = 'image/png';
          break;
      }
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          alert(`${saveFormat.toUpperCase()}形式での保存に失敗しました。ブラウザがこの形式をサポートしていない可能性があります。`);
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${saveFileName}.${saveFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowSaveDialog(false);
      }, mimeType, quality);
    };
    
    img.src = state.processedImageUrl;
  };

  const handleShowSaveDialog = () => {
    setShowSaveDialog(true);
  };

  const handleUndo = () => {
    console.log('Undo clicked. Current state:', {
      history: state.history.length,
      index: state.historyIndex
    });
    dispatch({ type: 'UNDO' });
  };

  const handleRedo = () => {
    console.log('Redo clicked. Current state:', {
      history: state.history.length,
      index: state.historyIndex,
      canRedo: state.historyIndex < state.history.length - 1
    });
    dispatch({ type: 'REDO' });
  };

  const saveToHistory = () => {
    console.log('Saving to history. Current state:', {
      history: state.history.length,
      index: state.historyIndex,
      hasImage: !!state.originalImage
    });
    dispatch({ type: 'SAVE_TO_HISTORY' });
  };

  const handleCrop = () => {
    if (!state.originalImage || !crop || !crop.width || !crop.height || !isWasmReady) {
      console.log('Crop conditions not met:', {
        hasImage: !!state.originalImage,
        hasCrop: !!crop,
        cropWidth: crop?.width,
        cropHeight: crop?.height,
        wasmReady: isWasmReady
      });
      return;
    }
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });

    const img = imgRef.current;
    if(!img) {
      console.log('Image ref not available');
      return;
    }

    console.log('Found image element:', {
      className: img.className,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.width,
      displayHeight: img.height
    });

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropParams = {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.round(crop.width * scaleX),
      height: Math.round(crop.height * scaleY)
    };

    console.log('Crop parameters:', {
      original: crop,
      imgDimensions: { natural: { width: img.naturalWidth, height: img.naturalHeight }, display: { width: img.width, height: img.height } },
      scale: { scaleX, scaleY },
      final: cropParams
    });

    try {
      const cropped = wasm.crop(
        state.originalImage.data,
        cropParams.x,
        cropParams.y,
        cropParams.width,
        cropParams.height
      );
      console.log('Crop result length:', cropped.length);
      const url = URL.createObjectURL(new Blob([cropped]));
      dispatch({type: 'SET_IMAGE', payload: {data: cropped, url}});
      // Save state after operation for redo functionality
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
      setCrop(undefined); // トリミング選択をリセット
    } catch (error) {
      console.error('Crop failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  if (!isWasmReady) {
    return <div className="loader">WASMモジュールをロード中...</div>;
  }

  return (
    <div className="photoshop-app">
      {/* Header */}
      <div className="app-header">
        <div className="app-title">Rust/WASM Image Editor</div>
        <div className="header-controls">
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept="image/*" 
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="header-button" title="画像を開く">
            📁 ファイルを開く
          </label>
          
          {/* Save and History buttons */}
          {state.processedImageUrl && (
            <>
              <button 
                className="header-button" 
                onClick={handleUndo}
                disabled={state.history.length === 0 || state.historyIndex <= 0}
                title={`元に戻す (履歴: ${state.history.length}, 位置: ${state.historyIndex})`}
              >
                ↶ 元に戻す
              </button>
              <button 
                className="header-button" 
                onClick={handleRedo}
                disabled={state.history.length === 0 || state.historyIndex >= state.history.length - 1}
                title={`やり直し (履歴: ${state.history.length}, 位置: ${state.historyIndex})`}
              >
                ↷ やり直し
              </button>
              <button 
                className="header-button" 
                onClick={handleShowSaveDialog}
                title="画像を保存"
              >
                💾 保存
              </button>
            </>
          )}
          
          {/* Image Processing Menu */}
          <div className="dropdown-menu" ref={menuRef}>
            <button 
              className="header-button dropdown-trigger" 
              onClick={() => setIsProcessMenuOpen(!isProcessMenuOpen)}
              title="画像処理メニュー"
              disabled={!state.originalImage}
            >
              🎨 画像処理 ▼
            </button>
            {isProcessMenuOpen && (
              <div className="dropdown-content">
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleRotate(90);
                    setIsProcessMenuOpen(false);
                  }}
                  title="90°回転"
                >
                  🔄 回転
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleFlipHorizontal();
                    setIsProcessMenuOpen(false);
                  }}
                  title="水平反転"
                >
                  ↔️ 水平反転
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleFlipVertical();
                    setIsProcessMenuOpen(false);
                  }}
                  title="垂直反転"
                >
                  ↕️ 垂直反転
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleCrop();
                    setIsProcessMenuOpen(false);
                  }}
                  disabled={!crop?.width}
                  title="トリミング実行"
                >
                  ✂️ トリミング
                </button>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleGrayscale();
                    setIsProcessMenuOpen(false);
                  }}
                  title="グレースケール変換"
                >
                  ⬛ グレースケール
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleSepia();
                    setIsProcessMenuOpen(false);
                  }}
                  title="セピア効果"
                >
                  🟤 セピア
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleEmboss();
                    setIsProcessMenuOpen(false);
                  }}
                  title="エンボス効果（3D浮き出し）"
                >
                  🔳 エンボス
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleHistogramEqualization();
                    setIsProcessMenuOpen(false);
                  }}
                  title="ヒストグラム均等化（自動コントラスト補正）"
                >
                  📊 ヒストグラム均等化
                </button>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item reset-item" 
                  onClick={() => {
                    dispatch({type: 'RESET_PARAMS'});
                    setIsProcessMenuOpen(false);
                  }}
                  title="調整をリセット"
                >
                  🔄 リセット
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="workspace">
        {/* Center Canvas */}
        <div className="canvas-area">
          <div className="canvas-content">
            {state.originalImage ? (
              <div className="canvas-viewport">
                <ReactCrop 
                  crop={crop} 
                  onChange={c => setCrop(c)}
                  onComplete={c => setCrop(c)}
                  aspect={undefined}
                  keepSelection={true}
                  className="image-crop"
                >
                  <img 
                    ref={imgRef}
                    src={state.processedImageUrl || state.originalImage.url} 
                    alt="Processed" 
                    className="canvas-image"
                  />
                </ReactCrop>
              </div>
            ) : (
              <div className="canvas-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🖼️</div>
                  <div className="placeholder-text">
                    <h3>画像を選択してください</h3>
                    <p>上部の「ファイルを開く」ボタンをクリックして画像を選択してください</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Adjustments */}
        <div className="right-panel">
          <div className="panel-group">
            <div className="panel-header">
              <h3>プリセット</h3>
            </div>
            <div className="panel-content">
              <button 
                className="apply-rotation-button"
                onClick={() => setShowPresetDialog(true)}
                disabled={!state.originalImage}
                style={{ marginBottom: '12px' }}
              >
                💾 現在の設定を保存
              </button>
              
              {state.presets.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="adjustment-label" style={{ marginBottom: '8px' }}>保存済みプリセット:</label>
                  {state.presets.map((preset, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '6px',
                      padding: '6px',
                      background: '#1a1a1a',
                      borderRadius: '3px',
                      border: '1px solid #555'
                    }}>
                      <span style={{ 
                        flex: 1, 
                        fontSize: '11px', 
                        color: '#cccccc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {preset.name}
                      </span>
                      <button 
                        onClick={() => handleLoadPreset(preset)}
                        disabled={!state.originalImage}
                        style={{
                          background: '#4478c4',
                          border: 'none',
                          color: 'white',
                          padding: '2px 6px',
                          fontSize: '10px',
                          borderRadius: '2px',
                          marginRight: '4px',
                          cursor: state.originalImage ? 'pointer' : 'not-allowed',
                          opacity: state.originalImage ? 1 : 0.4
                        }}
                      >
                        適用
                      </button>
                      <button 
                        onClick={() => handleDeletePreset(index)}
                        style={{
                          background: '#ff6b6b',
                          border: 'none',
                          color: 'white',
                          padding: '2px 6px',
                          fontSize: '10px',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>回転</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">角度 (degrees)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={-180} 
                    max={180} 
                    value={rotationAngle} 
                    onChange={(e) => setRotationAngle(Number(e.target.value))}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={rotationAngle} 
                    onChange={(e) => setRotationAngle(Number(e.target.value))}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={-180}
                    max={180}
                  />
                </div>
              </div>
              <button 
                className="apply-rotation-button"
                onClick={handleRotateArbitrary}
                disabled={!state.originalImage || rotationAngle === 0}
                title="回転を適用"
              >
                🔄 回転を適用
              </button>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>リサイズ</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">
                  <input 
                    type="checkbox" 
                    checked={state.resizeParams.aspectLocked}
                    onChange={(e) => handleResizeParamChange('aspectLocked', e.target.checked)}
                    disabled={!state.originalImage}
                  />
                  アスペクト比を保持
                </label>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">幅 (px)</label>
                <div className="adjustment-control">
                  <input 
                    type="number" 
                    value={state.resizeParams.width} 
                    onChange={(e) => handleResizeParamChange('width', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={1}
                    max={5000}
                    style={{ width: '80px' }}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">高さ (px)</label>
                <div className="adjustment-control">
                  <input 
                    type="number" 
                    value={state.resizeParams.height} 
                    onChange={(e) => handleResizeParamChange('height', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={1}
                    max={5000}
                    style={{ width: '80px' }}
                  />
                </div>
              </div>
              <button 
                className="apply-rotation-button"
                onClick={handleResize}
                disabled={!state.originalImage || (state.resizeParams.width === 0 || state.resizeParams.height === 0)}
                title="リサイズを適用"
              >
                📏 リサイズを適用
              </button>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>ブラー</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">強度 (sigma)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0} 
                    max={10} 
                    step={0.1}
                    value={state.blurParams.sigma} 
                    onChange={(e) => handleBlurParamChange('sigma', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.blurParams.sigma} 
                    onChange={(e) => handleBlurParamChange('sigma', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>シャープン</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">強度 (amount)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0} 
                    max={1} 
                    step={0.01}
                    value={state.sharpenParams.amount} 
                    onChange={(e) => handleSharpenParamChange('amount', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.sharpenParams.amount} 
                    onChange={(e) => handleSharpenParamChange('amount', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>ビネット効果</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">強度 (Strength)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={state.vignetteParams.strength} 
                    onChange={(e) => handleVignetteParamChange('strength', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.vignetteParams.strength} 
                    onChange={(e) => handleVignetteParamChange('strength', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">半径 (Radius)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={state.vignetteParams.radius} 
                    onChange={(e) => handleVignetteParamChange('radius', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.vignetteParams.radius} 
                    onChange={(e) => handleVignetteParamChange('radius', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>ノイズ除去</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">強度 (Strength)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={state.noiseReductionParams.strength} 
                    onChange={(e) => handleNoiseReductionParamChange('strength', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.noiseReductionParams.strength} 
                    onChange={(e) => handleNoiseReductionParamChange('strength', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>ハイライト・シャドウ</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">ハイライト (Highlights)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={state.highlightShadowParams.highlights} 
                    onChange={(e) => handleHighlightShadowParamChange('highlights', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.highlightShadowParams.highlights} 
                    onChange={(e) => handleHighlightShadowParamChange('highlights', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={-100}
                    max={100}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">シャドウ (Shadows)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={-100} 
                    max={100} 
                    value={state.highlightShadowParams.shadows} 
                    onChange={(e) => handleHighlightShadowParamChange('shadows', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.highlightShadowParams.shadows} 
                    onChange={(e) => handleHighlightShadowParamChange('shadows', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={-100}
                    max={100}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>カラーカーブ</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">赤チャンネル (Red Gamma)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0.1} 
                    max={3.0} 
                    step={0.1}
                    value={state.curveParams.redGamma} 
                    onChange={(e) => handleCurveParamChange('redGamma', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.curveParams.redGamma} 
                    onChange={(e) => handleCurveParamChange('redGamma', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">緑チャンネル (Green Gamma)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0.1} 
                    max={3.0} 
                    step={0.1}
                    value={state.curveParams.greenGamma} 
                    onChange={(e) => handleCurveParamChange('greenGamma', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.curveParams.greenGamma} 
                    onChange={(e) => handleCurveParamChange('greenGamma', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">青チャンネル (Blue Gamma)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0.1} 
                    max={3.0} 
                    step={0.1}
                    value={state.curveParams.blueGamma} 
                    onChange={(e) => handleCurveParamChange('blueGamma', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.curveParams.blueGamma} 
                    onChange={(e) => handleCurveParamChange('blueGamma', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>レベル補正</h3>
            </div>
            <div className="panel-content">
              <div className="adjustment-item">
                <label className="adjustment-label">黒点 (Black Point)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0} 
                    max={254} 
                    value={state.levelsParams.blackPoint} 
                    onChange={(e) => handleLevelsParamChange('blackPoint', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.levelsParams.blackPoint} 
                    onChange={(e) => handleLevelsParamChange('blackPoint', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0}
                    max={254}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">白点 (White Point)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={1} 
                    max={255} 
                    value={state.levelsParams.whitePoint} 
                    onChange={(e) => handleLevelsParamChange('whitePoint', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.levelsParams.whitePoint} 
                    onChange={(e) => handleLevelsParamChange('whitePoint', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={1}
                    max={255}
                  />
                </div>
              </div>
              <div className="adjustment-item">
                <label className="adjustment-label">ガンマ (Gamma)</label>
                <div className="adjustment-control">
                  <input 
                    type="range" 
                    min={0.1} 
                    max={3.0} 
                    step={0.1}
                    value={state.levelsParams.gamma} 
                    onChange={(e) => handleLevelsParamChange('gamma', e.target.value)}
                    className="adjustment-slider"
                    disabled={!state.originalImage}
                  />
                  <input 
                    type="number" 
                    value={state.levelsParams.gamma} 
                    onChange={(e) => handleLevelsParamChange('gamma', e.target.value)}
                    className="adjustment-input"
                    disabled={!state.originalImage}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-group">
            <div className="panel-header">
              <h3>画像調整</h3>
            </div>
            <div className="panel-content">
              {Object.keys(state.params).map((key) => {
                const paramKey = key as keyof State['params'];
                
                // Set appropriate ranges and labels for each parameter
                let min, max, label;
                switch (paramKey) {
                  case 'hue':
                    min = -180;
                    max = 180;
                    label = '色相 (Hue)';
                    break;
                  case 'brightness':
                    min = -100;
                    max = 100;
                    label = '明度 (Brightness)';
                    break;
                  case 'contrast':
                    min = -100;
                    max = 100;
                    label = 'コントラスト (Contrast)';
                    break;
                  case 'saturation':
                    min = -100;
                    max = 100;
                    label = '彩度 (Saturation)';
                    break;
                  case 'temperature':
                    min = -100;
                    max = 100;
                    label = '色温度 (Temperature)';
                    break;
                  case 'exposure':
                    min = -3;
                    max = 3;
                    label = '露出 (Exposure)';
                    break;
                  case 'vibrance':
                    min = -100;
                    max = 100;
                    label = 'バイブランス (Vibrance)';
                    break;
                  default:
                    min = -100;
                    max = 100;
                    label = key;
                }
                
                // Set step based on parameter type
                const step = paramKey === 'exposure' ? 0.1 : 1;
                
                return (
                  <div key={key} className="adjustment-item">
                    <label className="adjustment-label">{label}</label>
                    <div className="adjustment-control">
                      <input 
                        type="range" 
                        min={min} 
                        max={max} 
                        step={step}
                        value={state.params[paramKey]} 
                        onChange={(e) => handleParamChange(paramKey, e.target.value)}
                        className="adjustment-slider"
                        disabled={!state.originalImage}
                      />
                      <input 
                        type="number" 
                        min={min} 
                        max={max} 
                        step={step}
                        value={state.params[paramKey]} 
                        onChange={(e) => handleParamChange(paramKey, e.target.value)}
                        className="adjustment-input"
                        disabled={!state.originalImage}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className={`worker-status ${isWorkerReady ? 'ready' : 'not-ready'}`}>
            {isWorkerReady ? '🚀 Worker Ready' : '⏳ Worker Loading'}
          </span>
        </div>
        <div className="status-center">
          {state.originalImage ? `画像サイズ: ${imgRef.current?.naturalWidth || 0} × ${imgRef.current?.naturalHeight || 0}px` : '画像が選択されていません'}
        </div>
        <div className="status-right">
          {isWorkerProcessing && (
            <span className="processing-status">🔄 処理中</span>
          )}
        </div>
      </div>

      {(state.isLoading || isProcessing || isWorkerProcessing) && state.originalImage && (
        <div className="processing-indicator">
          <div className="processing-message">
            {processingProgress || (isWorkerProcessing ? 'バックグラウンド処理中...' : '処理中...')}
          </div>
          <div className="processing-mode">
            {isWorkerProcessing ? '🔄 Worker処理' : isProcessing ? '⚡ Direct処理' : ''}
          </div>
        </div>
      )}
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="save-dialog-header">
              <h3>画像を保存</h3>
              <button 
                className="close-button"
                onClick={() => setShowSaveDialog(false)}
                title="閉じる"
              >
                ✕
              </button>
            </div>
            <div className="save-dialog-content">
              <div className="save-input-group">
                <label htmlFor="filename">ファイル名:</label>
                <input 
                  id="filename"
                  type="text" 
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  className="save-filename-input"
                  placeholder="ファイル名を入力"
                />
              </div>
              <div className="save-input-group">
                <label htmlFor="format">形式:</label>
                <select 
                  id="format"
                  value={saveFormat}
                  onChange={(e) => setSaveFormat(e.target.value as 'png' | 'jpeg' | 'webp' | 'avif')}
                  className="save-format-select"
                >
                  <option value="png">PNG (無劣化)</option>
                  <option value="jpeg">JPEG (高圧縮)</option>
                  {supportedFormats.webp && (
                    <option value="webp">WebP (高効率)</option>
                  )}
                  {supportedFormats.avif && (
                    <option value="avif">AVIF (最新高効率)</option>
                  )}
                </select>
              </div>
              {/* Quality Setting - only for lossy formats */}
              {(saveFormat === 'jpeg' || saveFormat === 'webp' || saveFormat === 'avif') && (
                <div className="save-input-group">
                  <label htmlFor="quality">品質: {saveQuality}%</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      id="quality"
                      type="range" 
                      min={1}
                      max={100}
                      value={saveQuality}
                      onChange={(e) => setSaveQuality(Number(e.target.value))}
                      className="adjustment-slider"
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="number" 
                      value={saveQuality}
                      onChange={(e) => setSaveQuality(Number(e.target.value))}
                      className="adjustment-input"
                      min={1}
                      max={100}
                      style={{ width: '60px' }}
                    />
                  </div>
                  <small style={{ color: '#999', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    {saveFormat === 'jpeg' ? '高い値ほど高品質（ファイルサイズ大）' :
                     saveFormat === 'webp' ? 'WebP: 90%以上推奨（高効率圧縮）' :
                     'AVIF: 80%以上推奨（最新高効率圧縮）'}
                  </small>
                </div>
              )}
            </div>
            <div className="save-dialog-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowSaveDialog(false)}
              >
                キャンセル
              </button>
              <button 
                className="save-button"
                onClick={handleSaveImage}
                disabled={!saveFileName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Preset Save Dialog */}
      {showPresetDialog && (
        <div className="modal-overlay" onClick={() => setShowPresetDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="save-dialog-header">
              <h3>プリセットを保存</h3>
              <button 
                className="close-button"
                onClick={() => setShowPresetDialog(false)}
                title="閉じる"
              >
                ✕
              </button>
            </div>
            <div className="save-dialog-content">
              <div className="save-input-group">
                <label htmlFor="presetName">プリセット名:</label>
                <input 
                  id="presetName"
                  type="text" 
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="save-filename-input"
                  placeholder="プリセット名を入力"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && presetName.trim()) {
                      handleSavePreset();
                    }
                  }}
                />
              </div>
            </div>
            <div className="save-dialog-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowPresetDialog(false)}
              >
                キャンセル
              </button>
              <button 
                className="save-button"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="error-toast">
          <div className="error-toast-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMessage}</span>
            <button 
              className="error-close"
              onClick={hideError}
              title="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;