import React from 'react';

interface TransformToolsProps {
  onRotate: (angle: 90 | 180 | 270) => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onGrayscale: () => void;
  onSepia: () => void;
  onEmboss: () => void;
  onHistogramEqualization: () => void;
  disabled?: boolean;
}

export const TransformTools: React.FC<TransformToolsProps> = ({
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onGrayscale,
  onSepia,
  onEmboss,
  onHistogramEqualization,
  disabled = false
}) => {
  return (
    <div className="panel-group">
      <div className="panel-header">
        <h3>変換・エフェクト</h3>
      </div>
      <div className="panel-content">
        <div className="transform-buttons">
          {/* 回転 */}
          <div className="button-group">
            <h4>回転</h4>
            <div className="button-row">
              <button 
                className="transform-button"
                onClick={() => onRotate(90)}
                disabled={disabled}
                title="90度回転"
              >
                🔄 90°
              </button>
              <button 
                className="transform-button"
                onClick={() => onRotate(180)}
                disabled={disabled}
                title="180度回転"
              >
                🔄 180°
              </button>
              <button 
                className="transform-button"
                onClick={() => onRotate(270)}
                disabled={disabled}
                title="270度回転"
              >
                🔄 270°
              </button>
            </div>
          </div>

          {/* 反転 */}
          <div className="button-group">
            <h4>反転</h4>
            <div className="button-row">
              <button 
                className="transform-button"
                onClick={onFlipHorizontal}
                disabled={disabled}
                title="水平反転"
              >
                ↔️ 水平
              </button>
              <button 
                className="transform-button"
                onClick={onFlipVertical}
                disabled={disabled}
                title="垂直反転"
              >
                ↕️ 垂直
              </button>
            </div>
          </div>

          {/* エフェクト */}
          <div className="button-group">
            <h4>エフェクト</h4>
            <div className="button-row">
              <button 
                className="transform-button"
                onClick={onGrayscale}
                disabled={disabled}
                title="グレースケール変換"
              >
                ⚫ グレー
              </button>
              <button 
                className="transform-button"
                onClick={onSepia}
                disabled={disabled}
                title="セピア効果"
              >
                🟤 セピア
              </button>
            </div>
            <div className="button-row">
              <button 
                className="transform-button"
                onClick={onEmboss}
                disabled={disabled}
                title="エンボス効果"
              >
                🔷 エンボス
              </button>
              <button 
                className="transform-button"
                onClick={onHistogramEqualization}
                disabled={disabled}
                title="ヒストグラム平坦化"
              >
                📊 Auto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};