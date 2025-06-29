import React from 'react';

/**
 * Props interface for the AdjustmentSlider component
 */
interface AdjustmentSliderProps {
  /** Display label for the adjustment control */
  label: string;
  /** Current value of the slider */
  value: number;
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value */
  max: number;
  /** Step increment for value changes */
  step: number;
  /** Callback function called when value changes */
  onChange: (value: string) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Optional unit label displayed after the value */
  unit?: string;
}

/**
 * AdjustmentSlider Component
 * 
 * A reusable slider component that provides both range slider and number input controls
 * for adjusting image parameters. Features synchronized dual inputs for precise value entry.
 * 
 * @param props - Component props
 * @returns React functional component
 * 
 * @example
 * ```tsx
 * <AdjustmentSlider
 *   label="Brightness"
 *   value={brightness}
 *   min={-100}
 *   max={100}
 *   step={1}
 *   onChange={(value) => setBrightness(parseInt(value))}
 *   unit="%"
 * />
 * ```
 */
export const AdjustmentSlider: React.FC<AdjustmentSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  unit = ''
}) => {
  return (
    <div className="adjustment-item">
      <label className="adjustment-label">{label}</label>
      <div className="adjustment-control">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="adjustment-slider"
          disabled={disabled}
        />
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="adjustment-input"
          disabled={disabled}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="adjustment-unit">{unit}</span>}
      </div>
    </div>
  );
};