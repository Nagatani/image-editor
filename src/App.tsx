import { useState, useReducer, useEffect, useCallback, useRef } from 'react';
import './App.css';
import init, * as wasm from './pkg/image_app.js';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// 状態管理のためのReducer
type State = {
  originalImage: { data: Uint8Array, url: string } | null;
  processedImageUrl: string | null;
  isLoading: boolean;
  params: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
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
};

type Action =
  | { type: 'SET_IMAGE'; payload: { data: Uint8Array; url: string } }
  | { type: 'SET_PARAM'; payload: { key: keyof State['params']; value: number } }
  | { type: 'SET_RESIZE_PARAM'; payload: { key: keyof State['resizeParams']; value: number | boolean } }
  | { type: 'SET_BLUR_PARAM'; payload: { key: keyof State['blurParams']; value: number } }
  | { type: 'SET_SHARPEN_PARAM'; payload: { key: keyof State['sharpenParams']; value: number } }
  | { type: 'START_LOADING' }
  | { type: 'SET_PROCESSED_IMAGE'; payload: string }
  | { type: 'RESET_PARAMS' };

const initialState: State = {
  originalImage: null,
  processedImageUrl: null,
  isLoading: true,
  params: { brightness: 0, contrast: 0, saturation: 0, temperature: 0 },
  resizeParams: { width: 800, height: 600, aspectLocked: true },
  blurParams: { sigma: 0 },
  sharpenParams: { amount: 0 },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_IMAGE': {
      const newState = { ...initialState, isLoading: false, originalImage: action.payload, processedImageUrl: action.payload.url };
      if (action.payload.data) {
        // Update resize params with actual image dimensions
        const img = new Image();
        img.onload = () => {
          newState.resizeParams = { ...newState.resizeParams, width: img.naturalWidth, height: img.naturalHeight };
        };
        img.src = action.payload.url;
      }
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
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'SET_PROCESSED_IMAGE':
      return { ...state, isLoading: false, processedImageUrl: action.payload };
    case 'RESET_PARAMS':
      return { ...state, params: initialState.params, blurParams: initialState.blurParams, sharpenParams: initialState.sharpenParams };
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
    const checkFormatSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      // Check WebP support
      const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // Check AVIF support (newer feature, may not be supported in all browsers)
      let avifSupport = false;
      try {
        avifSupport = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      } catch (e) {
        avifSupport = false;
      }
      
      setSupportedFormats({
        webp: webpSupport,
        avif: avifSupport
      });
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
        
        // Apply blur if sigma > 0
        if (state.blurParams.sigma > 0) {
          imageData = wasm.gaussian_blur(imageData, state.blurParams.sigma);
        }
        
        // Apply sharpen if amount > 0
        if (state.sharpenParams.amount > 0) {
          imageData = wasm.sharpen(imageData, state.sharpenParams.amount);
        }

        const url = URL.createObjectURL(new Blob([imageData]));
        dispatch({ type: 'SET_PROCESSED_IMAGE', payload: url });
    }, 50);
  }, [state.originalImage, state.params, state.blurParams, state.sharpenParams, isWasmReady]);

  useEffect(() => {
    if (state.originalImage) {
      applyChanges();
    }
  }, [state.params, state.blurParams, state.sharpenParams, applyChanges]);

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
    dispatch({ type: 'START_LOADING' });
    const rotated = wasm.rotate(state.originalImage.data, angle);
    const url = URL.createObjectURL(new Blob([rotated]));
    dispatch({type: 'SET_IMAGE', payload: {data: rotated, url}});
  };

  const handleFlipHorizontal = () => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });
    
    try {
      const flipped = wasm.flip_horizontal(state.originalImage.data);
      console.log('Horizontal flip result length:', flipped.length);
      const url = URL.createObjectURL(new Blob([flipped]));
      dispatch({type: 'SET_IMAGE', payload: {data: flipped, url}});
    } catch (error) {
      console.error('Horizontal flip failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleFlipVertical = () => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });
    
    try {
      const flipped = wasm.flip_vertical(state.originalImage.data);
      console.log('Vertical flip result length:', flipped.length);
      const url = URL.createObjectURL(new Blob([flipped]));
      dispatch({type: 'SET_IMAGE', payload: {data: flipped, url}});
    } catch (error) {
      console.error('Vertical flip failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleRotateArbitrary = () => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });
    
    try {
      const rotated = wasm.rotate_arbitrary(state.originalImage.data, rotationAngle);
      console.log('Arbitrary rotation result length:', rotated.length);
      const url = URL.createObjectURL(new Blob([rotated]));
      dispatch({type: 'SET_IMAGE', payload: {data: rotated, url}});
      setRotationAngle(0); // Reset angle after rotation
    } catch (error) {
      console.error('Arbitrary rotation failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleResize = () => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });
    
    try {
      const resized = wasm.resize(state.originalImage.data, state.resizeParams.width, state.resizeParams.height);
      console.log('Resize result length:', resized.length);
      const url = URL.createObjectURL(new Blob([resized]));
      dispatch({type: 'SET_IMAGE', payload: {data: resized, url}});
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
    dispatch({ type: 'START_LOADING' });
    
    try {
      const grayscaled = wasm.to_grayscale(state.originalImage.data);
      console.log('Grayscale result length:', grayscaled.length);
      const url = URL.createObjectURL(new Blob([grayscaled]));
      dispatch({type: 'SET_IMAGE', payload: {data: grayscaled, url}});
    } catch (error) {
      console.error('Grayscale failed:', error);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: state.originalImage.url });
    }
  };

  const handleSepia = () => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });
    
    try {
      const sepiaed = wasm.apply_sepia(state.originalImage.data);
      console.log('Sepia result length:', sepiaed.length);
      const url = URL.createObjectURL(new Blob([sepiaed]));
      dispatch({type: 'SET_IMAGE', payload: {data: sepiaed, url}});
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
          
          {/* Save button */}
          {state.processedImageUrl && (
            <button 
              className="header-button" 
              onClick={handleShowSaveDialog}
              title="画像を保存"
            >
              💾 保存
            </button>
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
              <h3>画像調整</h3>
            </div>
            <div className="panel-content">
              {Object.keys(state.params).map((key) => {
                const paramKey = key as keyof State['params'];
                const min = -100;
                const max = 100;
                return (
                  <div key={key} className="adjustment-item">
                    <label className="adjustment-label">{key}</label>
                    <div className="adjustment-control">
                      <input 
                        type="range" 
                        min={min} 
                        max={max} 
                        value={state.params[paramKey]} 
                        onChange={(e) => handleParamChange(paramKey, e.target.value)}
                        className="adjustment-slider"
                        disabled={!state.originalImage}
                      />
                      <input 
                        type="number" 
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