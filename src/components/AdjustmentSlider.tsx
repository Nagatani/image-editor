import React from 'react';

interface AdjustmentSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: string) => void;
  disabled?: boolean;
  unit?: string;
}

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