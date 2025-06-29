import React from 'react';
import { AdjustmentSlider } from './AdjustmentSlider';

/**
 * Parameters object for basic image adjustments
 */
interface BasicAdjustmentParams {
  /** Brightness adjustment (-100 to 100) */
  brightness: number;
  /** Contrast adjustment (-2 to 2) */
  contrast: number;
  /** Saturation adjustment (-180 to 180 degrees) */
  saturation: number;
  /** Color temperature adjustment (-100 to 100) */
  temperature: number;
  /** Hue shift (-180 to 180 degrees) */
  hue: number;
  /** Exposure adjustment (-3 to 3 stops) */
  exposure: number;
  /** Vibrance adjustment (-100 to 100) */
  vibrance: number;
}

/**
 * Props interface for the BasicAdjustments component
 */
interface BasicAdjustmentsProps {
  /** Current parameter values for basic adjustments */
  params: BasicAdjustmentParams;
  /** Callback function for parameter changes */
  onParamChange: (key: string, value: string) => void;
  /** Whether controls are disabled */
  disabled?: boolean;
}

/**
 * BasicAdjustments Component
 * 
 * Provides fundamental image adjustment controls including brightness, contrast,
 * saturation, temperature, hue, exposure, and vibrance. These are the most commonly
 * used adjustments for basic image enhancement and color correction.
 * 
 * Features:
 * - Brightness: Linear pixel value adjustment
 * - Contrast: Multiplicative scaling around midpoint
 * - Saturation: HSV color space manipulation
 * - Temperature: RGB channel color temperature adjustment
 * - Hue: Color wheel rotation
 * - Exposure: Exponential brightness scaling in stops
 * - Vibrance: Selective saturation enhancement
 * 
 * @param props - Component props
 * @returns React functional component
 * 
 * @example
 * ```tsx
 * const [basicParams, setBasicParams] = useState({
 *   brightness: 0, contrast: 0, saturation: 0,
 *   temperature: 0, hue: 0, exposure: 0, vibrance: 0
 * });
 * 
 * <BasicAdjustments
 *   params={basicParams}
 *   onParamChange={(key, value) => 
 *     setBasicParams(prev => ({ ...prev, [key]: parseFloat(value) }))
 *   }
 * />
 * ```
 */
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