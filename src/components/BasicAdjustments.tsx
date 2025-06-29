import React from 'react';
import { AdjustmentSlider } from './AdjustmentSlider';

interface BasicAdjustmentsProps {
  params: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    hue: number;
    exposure: number;
    vibrance: number;
  };
  onParamChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export const BasicAdjustments: React.FC<BasicAdjustmentsProps> = ({
  params,
  onParamChange,
  disabled = false
}) => {
  return (
    <div className="panel-group">
      <div className="panel-header">
        <h3>基本調整</h3>
      </div>
      <div className="panel-content">
        <AdjustmentSlider
          label="明度 (Brightness)"
          value={params.brightness}
          min={-100}
          max={100}
          step={1}
          onChange={(value) => onParamChange('brightness', value)}
          disabled={disabled}
        />
        
        <AdjustmentSlider
          label="コントラスト (Contrast)"
          value={params.contrast}
          min={-2}
          max={2}
          step={0.01}
          onChange={(value) => onParamChange('contrast', value)}
          disabled={disabled}
        />
        
        <AdjustmentSlider
          label="彩度 (Saturation)"
          value={params.saturation}
          min={-180}
          max={180}
          step={1}
          onChange={(value) => onParamChange('saturation', value)}
          disabled={disabled}
        />
        
        <AdjustmentSlider
          label="色温度 (Temperature)"
          value={params.temperature}
          min={-100}
          max={100}
          step={1}
          onChange={(value) => onParamChange('temperature', value)}
          disabled={disabled}
        />
        
        <AdjustmentSlider
          label="色相 (Hue)"
          value={params.hue}
          min={-180}
          max={180}
          step={1}
          onChange={(value) => onParamChange('hue', value)}
          disabled={disabled}
          unit="°"
        />
        
        <AdjustmentSlider
          label="露出 (Exposure)"
          value={params.exposure}
          min={-3}
          max={3}
          step={0.1}
          onChange={(value) => onParamChange('exposure', value)}
          disabled={disabled}
          unit="stops"
        />
        
        <AdjustmentSlider
          label="自然な彩度 (Vibrance)"
          value={params.vibrance}
          min={-100}
          max={100}
          step={1}
          onChange={(value) => onParamChange('vibrance', value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};