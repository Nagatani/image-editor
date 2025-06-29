import React from 'react';

interface AppHeaderProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasImage: boolean;
  isProcessing: boolean;
  fileName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onFileSelect,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasImage,
  isProcessing,
  fileName
}) => {
  return (
    <div className="app-header">
      <div className="app-title">
        {fileName ? fileName : 'PhotoFlow Studio'}
      </div>
      <div className="header-controls">
        <input 
          type="file" 
          id="fileInput" 
          className="file-input"
          accept="image/*"
          onChange={onFileSelect}
        />
        <label htmlFor="fileInput" className="header-button">
          📁 画像を開く
        </label>
        
        <button 
          className="header-button"
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          title="元に戻す (Ctrl+Z)"
        >
          ↶ 元に戻す
        </button>
        
        <button 
          className="header-button"
          onClick={onRedo}
          disabled={!canRedo || isProcessing}
          title="やり直し (Ctrl+Y)"
        >
          ↷ やり直し
        </button>
        
        <button 
          className="header-button"
          onClick={onSave}
          disabled={!hasImage || isProcessing}
          title="画像を保存"
        >
          💾 保存
        </button>
      </div>
    </div>
  );
};