import React from 'react';
import { AdjustmentSlider } from './AdjustmentSlider';

interface AdvancedAdjustmentsProps {
  highlightShadowParams: { highlights: number; shadows: number };
  curveParams: { redGamma: number; greenGamma: number; blueGamma: number };
  levelsParams: { blackPoint: number; whitePoint: number; gamma: number };
  onHighlightShadowParamChange: (key: string, value: string) => void;
  onCurveParamChange: (key: string, value: string) => void;
  onLevelsParamChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export const AdvancedAdjustments: React.FC<AdvancedAdjustmentsProps> = ({
  highlightShadowParams,
  curveParams,
  levelsParams,
  onHighlightShadowParamChange,
  onCurveParamChange,
  onLevelsParamChange,
  disabled = false
}) => {
  return (
    <>
      {/* ハイライト/シャドウ */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>ハイライト/シャドウ</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="ハイライト"
            value={highlightShadowParams.highlights}
            min={-100}
            max={100}
            step={1}
            onChange={(value) => onHighlightShadowParamChange('highlights', value)}
            disabled={disabled}
          />
          
          <AdjustmentSlider
            label="シャドウ"
            value={highlightShadowParams.shadows}
            min={-100}
            max={100}
            step={1}
            onChange={(value) => onHighlightShadowParamChange('shadows', value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* カラーカーブ */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>カラーカーブ (Gamma調整)</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="赤チャンネル"
            value={curveParams.redGamma}
            min={0.1}
            max={3.0}
            step={0.01}
            onChange={(value) => onCurveParamChange('redGamma', value)}
            disabled={disabled}
          />
          
          <AdjustmentSlider
            label="緑チャンネル"
            value={curveParams.greenGamma}
            min={0.1}
            max={3.0}
            step={0.01}
            onChange={(value) => onCurveParamChange('greenGamma', value)}
            disabled={disabled}
          />
          
          <AdjustmentSlider
            label="青チャンネル"
            value={curveParams.blueGamma}
            min={0.1}
            max={3.0}
            step={0.01}
            onChange={(value) => onCurveParamChange('blueGamma', value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* レベル補正 */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>レベル補正</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="黒点 (Black Point)"
            value={levelsParams.blackPoint}
            min={0}
            max={255}
            step={1}
            onChange={(value) => onLevelsParamChange('blackPoint', value)}
            disabled={disabled}
          />
          
          <AdjustmentSlider
            label="白点 (White Point)"
            value={levelsParams.whitePoint}
            min={0}
            max={255}
            step={1}
            onChange={(value) => onLevelsParamChange('whitePoint', value)}
            disabled={disabled}
          />
          
          <AdjustmentSlider
            label="ガンマ (Gamma)"
            value={levelsParams.gamma}
            min={0.1}
            max={3.0}
            step={0.01}
            onChange={(value) => onLevelsParamChange('gamma', value)}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};