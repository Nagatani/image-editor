import React from 'react';

interface PresetData {
  name: string;
  params: any; // 型を適切に定義
}

interface PresetManagerProps {
  presets: PresetData[];
  onSavePreset: () => void;
  onLoadPreset: (preset: PresetData) => void;
  onDeletePreset: (index: number) => void;
  disabled?: boolean;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  disabled = false
}) => {
  return (
    <div className="panel-group">
      <div className="panel-header">
        <h3>プリセット管理</h3>
      </div>
      <div className="panel-content">
        <div className="preset-actions">
          <button 
            className="preset-button save-preset"
            onClick={onSavePreset}
            disabled={disabled}
            title="現在の設定をプリセットとして保存"
          >
            💾 プリセット保存
          </button>
        </div>
        
        {presets.length > 0 && (
          <div className="preset-list">
            <h4>保存済みプリセット</h4>
            {presets.map((preset, index) => (
              <div key={index} className="preset-item">
                <span className="preset-name">{preset.name}</span>
                <div className="preset-controls">
                  <button 
                    className="preset-load-button"
                    onClick={() => onLoadPreset(preset)}
                    disabled={disabled}
                    title="このプリセットを適用"
                  >
                    適用
                  </button>
                  <button 
                    className="preset-delete-button"
                    onClick={() => onDeletePreset(index)}
                    disabled={disabled}
                    title="このプリセットを削除"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};