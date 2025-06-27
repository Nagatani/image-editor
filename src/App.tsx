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
};

type Action =
  | { type: 'SET_IMAGE'; payload: { data: Uint8Array; url: string } }
  | { type: 'SET_PARAM'; payload: { key: keyof State['params']; value: number } }
  | { type: 'START_LOADING' }
  | { type: 'SET_PROCESSED_IMAGE'; payload: string }
  | { type: 'RESET_PARAMS' };

const initialState: State = {
  originalImage: null,
  processedImageUrl: null,
  isLoading: true,
  params: { brightness: 0, contrast: 0, saturation: 0, temperature: 0 },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...initialState, isLoading: false, originalImage: action.payload, processedImageUrl: action.payload.url };
    case 'SET_PARAM':
      return { ...state, params: { ...state.params, [action.payload.key]: action.payload.value } };
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'SET_PROCESSED_IMAGE':
      return { ...state, isLoading: false, processedImageUrl: action.payload };
    case 'RESET_PARAMS':
      return { ...state, params: initialState.params };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [crop, setCrop] = useState<Crop>();
  const [isWasmReady, setWasmReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    init().then(() => {
      setWasmReady(true);
      dispatch({ type: 'START_LOADING' });
    });
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

        const url = URL.createObjectURL(new Blob([imageData]));
        dispatch({ type: 'SET_PROCESSED_IMAGE', payload: url });
    }, 50);
  }, [state.originalImage, state.params, isWasmReady]);

  useEffect(() => {
    if (state.originalImage) {
      applyChanges();
    }
  }, [state.params, applyChanges]);


  const handleRotate = (angle: 90 | 180 | 270) => {
    if (!state.originalImage || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });
    const rotated = wasm.rotate(state.originalImage.data, angle);
    const url = URL.createObjectURL(new Blob([rotated]));
    dispatch({type: 'SET_IMAGE', payload: {data: rotated, url}});
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
          <button 
            className="header-button" 
            onClick={() => handleRotate(90)} 
            title="90°回転"
            disabled={!state.originalImage}
          >
            🔄 回転
          </button>
          <button 
            className="header-button" 
            onClick={handleCrop} 
            disabled={!crop?.width}
            title="トリミング実行"
          >
            ✂️ トリミング
          </button>
          <button 
            className="header-button" 
            onClick={() => dispatch({type: 'RESET_PARAMS'})}
            title="調整をリセット"
            disabled={!state.originalImage}
          >
            🔄 リセット
          </button>
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
    </div>
  );
}

export default App;