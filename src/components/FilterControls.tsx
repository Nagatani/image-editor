import React from 'react';
import { AdjustmentSlider } from './AdjustmentSlider';

interface FilterControlsProps {
  blurParams: { sigma: number };
  sharpenParams: { amount: number };
  vignetteParams: { strength: number; radius: number };
  noiseReductionParams: { strength: number };
  onBlurParamChange: (key: string, value: string) => void;
  onSharpenParamChange: (key: string, value: string) => void;
  onVignetteParamChange: (key: string, value: string) => void;
  onNoiseReductionParamChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  blurParams,
  sharpenParams,
  vignetteParams,
  noiseReductionParams,
  onBlurParamChange,
  onSharpenParamChange,
  onVignetteParamChange,
  onNoiseReductionParamChange,
  disabled = false
}) => {
  return (
    <>
      {/* ブラー */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>ブラー (Gaussian Blur)</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="強度 (sigma)"
            value={blurParams.sigma}
            min={0}
            max={10}
            step={0.1}
            onChange={(value) => onBlurParamChange('sigma', value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* シャープン */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>シャープン</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="強度 (amount)"
            value={sharpenParams.amount}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => onSharpenParamChange('amount', value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* ビネット効果 */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>ビネット効果</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="強度 (Strength)"
            value={vignetteParams.strength}
            min={0}
            max={100}
            step={1}
            onChange={(value) => onVignetteParamChange('strength', value)}
            disabled={disabled}
          />
          
          <AdjustmentSlider
            label="半径 (Radius)"
            value={vignetteParams.radius}
            min={0}
            max={100}
            step={1}
            onChange={(value) => onVignetteParamChange('radius', value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* ノイズリダクション */}
      <div className="panel-group">
        <div className="panel-header">
          <h3>ノイズリダクション</h3>
        </div>
        <div className="panel-content">
          <AdjustmentSlider
            label="強度 (Strength)"
            value={noiseReductionParams.strength}
            min={0}
            max={100}
            step={1}
            onChange={(value) => onNoiseReductionParamChange('strength', value)}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};