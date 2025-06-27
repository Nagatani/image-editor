import { useState, useReducer, useEffect, useCallback } from 'react';
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
    if (!state.originalImage || !crop || !crop.width || !crop.height || !isWasmReady) return;
    dispatch({ type: 'START_LOADING' });

    const img = document.querySelector<HTMLImageElement>('.ReactCrop__image');
    if(!img) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropped = wasm.crop(
      state.originalImage.data,
      Math.round(crop.x * scaleX),
      Math.round(crop.y * scaleY),
      Math.round(crop.width * scaleX),
      Math.round(crop.height * scaleY)
    );
    const url = URL.createObjectURL(new Blob([cropped]));
    dispatch({type: 'SET_IMAGE', payload: {data: cropped, url}});
    setCrop(undefined); // トリミング選択をリセット
  };

  if (!isWasmReady) {
    return <div className="loader">WASMモジュールをロード中...</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Rust/WASM Image Editor</h1>
        <input type="file" onChange={handleFileChange} accept="image/*" />
      </header>
      <main className={!state.originalImage ? 'disabled' : ''}>
        <div className="controls">
          <h3>調整</h3>
          {Object.keys(state.params).map((key) => {
            const paramKey = key as keyof State['params'];
            const min = -100;
            const max = 100;
            return (<div key={key} className="control-item">
              <label>{key}</label>
              <input type="range" min={min} max={max} value={state.params[paramKey]} onChange={(e) => handleParamChange(paramKey, e.target.value)} />
              <span>{state.params[paramKey]}</span>
            </div>)
          })}
          <button onClick={() => dispatch({type: 'RESET_PARAMS'})}>リセット</button>
          <h3 style={{marginTop: '20px'}}>操作</h3>
          <button onClick={() => handleRotate(90)}>90°回転</button>
          <button onClick={handleCrop} disabled={!crop?.width}>トリミング実行</button>
        </div>
        <div className="image-view">
          {state.originalImage ? (
            <div>
              <h3>画像プレビュー</h3>
              <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                <img src={state.processedImageUrl || state.originalImage.url} alt="Processed" />
              </ReactCrop>
            </div>
          ) : (
            <div className="placeholder">画像を選択してください</div>
          )}
        </div>
      </main>
      {state.isLoading && state.originalImage && <div className="loader">処理中...</div>}
    </div>
  );
}

export default App;