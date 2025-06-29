import { useState, useReducer, useEffect, useCallback, useRef } from 'react';
import './App.css';
import init, * as wasm from './pkg/image_app.js';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// 状態管理のためのReducer
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
  | { type: 'START_LOADING' }
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
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'SET_PROCESSED_IMAGE':
      return { ...state, isLoading: false, processedImageUrl: action.payload };
    case 'RESET_PARAMS':
      return { ...state, params: initialState.params, blurParams: initialState.blurParams, sharpenParams: initialState.sharpenParams, vignetteParams: initialState.vignetteParams, noiseReductionParams: initialState.noiseReductionParams };
    case 'SAVE_TO_HISTORY': {
      const currentHistoryState: HistoryState = {
        originalImage: state.originalImage,
        processedImageUrl: state.processedImageUrl,
        params: { ...state.params },
        blurParams: { ...state.blurParams },
        sharpenParams: { ...state.sharpenParams },
        vignetteParams: { ...state.vignetteParams },
        noiseReductionParams: { ...state.noiseReductionParams },
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
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState('edited-image');
  const [saveFormat, setSaveFormat] = useState<'png' | 'jpeg' | 'webp' | 'avif'>('png');
  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init().then(() => {
      setWasmReady(true);
      dispatch({ type: 'START_LOADING' });
    });
    
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const url = URL.createObjectURL(new Blob([data]));
      dispatch({ type: 'SET_IMAGE', payload: { data, url } });
      // Save initial state to history after image load
      setTimeout(() => {
        dispatch({ type: 'SAVE_TO_HISTORY' });
      }, 100);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleParamChange = (key: keyof State['params'], value: string) => {
      dispatch({ type: 'SET_PARAM', payload: { key, value: Number(value) } });
  }

  const applyChanges = useCallback(() => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });

    setTimeout(() => {
        let imageData = state.originalImage!.data;
        imageData = wasm.adjust_brightness(imageData, state.params.brightness);
        imageData = wasm.adjust_contrast(imageData, state.params.contrast * 0.1); // スケール調整
        imageData = wasm.adjust_saturation(imageData, state.params.saturation * 0.1); // スケール調整
        imageData = wasm.adjust_white_balance(imageData, state.params.temperature);
        
        // Apply hue adjustment if shift != 0
        if (state.params.hue !== 0) {
          imageData = wasm.adjust_hue(imageData, state.params.hue);
        }
        
        // Apply exposure adjustment if stops != 0
        if (state.params.exposure !== 0) {
          imageData = wasm.adjust_exposure(imageData, state.params.exposure);
        }
        
        // Apply vibrance adjustment if amount != 0
        if (state.params.vibrance !== 0) {
          imageData = wasm.adjust_vibrance(imageData, state.params.vibrance);
        }
        
        // Apply blur if sigma > 0
        if (state.blurParams.sigma > 0) {
          imageData = wasm.gaussian_blur(imageData, state.blurParams.sigma);
        }
        
        // Apply sharpen if amount > 0
        if (state.sharpenParams.amount > 0) {
          imageData = wasm.sharpen(imageData, state.sharpenParams.amount);
        }
        
        // Apply vignette if strength > 0
        if (state.vignetteParams.strength > 0) {
          imageData = wasm.apply_vignette(imageData, state.vignetteParams.strength, state.vignetteParams.radius);
        }
        
        // Apply noise reduction if strength > 0
        if (state.noiseReductionParams.strength > 0) {
          imageData = wasm.reduce_noise(imageData, state.noiseReductionParams.strength);
        }

        const url = URL.createObjectURL(new Blob([imageData]));
        dispatch({ type: 'SET_PROCESSED_IMAGE', payload: url });
    }, 50);
  }, [state.originalImage, state.params, state.blurParams, state.sharpenParams, state.vignetteParams, state.noiseReductionParams, isWasmReady]);

  useEffect(() => {
    if (state.originalImage) {
      applyChanges();
    }
  }, [state.params, state.blurParams, state.sharpenParams, state.vignetteParams, state.noiseReductionParams, applyChanges]);

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


  const handleRotate = (angle: 90 | 180 | 270) => {
    if (!state.originalImage || !isWasmReady) return;
    saveToHistory(); // Save current state before modification
    dispatch({ type: 'START_LOADING' });
    const rotated = wasm.rotate(state.originalImage.data, angle);
    const url = URL.createObjectURL(new Blob([rotated]));
    dispatch({type: 'SET_IMAGE', payload: {data: rotated, url}});
    // Save state after operation for redo functionality
    setTimeout(() => {
      dispatch({ type: 'SAVE_TO_HISTORY' });
    }, 100);
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
          quality = 0.9;
          mimeType = 'image/jpeg';
          break;
        case 'webp':
          quality = 0.9;
          mimeType = 'image/webp';
          break;
        case 'avif':
          quality = 0.8; // AVIF typically needs lower quality for good compression
          mimeType = 'image/avif';
          break;
        case 'png':
        default:
          quality = undefined;
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
        <div className="status-center">
          {state.originalImage ? `画像サイズ: ${imgRef.current?.naturalWidth || 0} × ${imgRef.current?.naturalHeight || 0}px` : '画像が選択されていません'}
        </div>
      </div>

      {state.isLoading && state.originalImage && <div className="processing-indicator">処理中...</div>}
      
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
    </div>
  );
}

export default App;