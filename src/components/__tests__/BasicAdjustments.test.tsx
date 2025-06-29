import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BasicAdjustments } from '../BasicAdjustments';

describe('BasicAdjustments', () => {
  const mockOnParamChange = vi.fn();
  const mockParams = {
    brightness: 0,
    contrast: 1,
    saturation: 0,
    temperature: 0,
    hue: 0,
    exposure: 0,
    vibrance: 0
  };

  beforeEach(() => {
    mockOnParamChange.mockClear();
  });

  it('renders all adjustment controls', () => {
    render(
      <BasicAdjustments
        params={mockParams}
        onParamChange={mockOnParamChange}
      />
    );

    expect(screen.getByText('基本調整')).toBeInTheDocument();
    expect(screen.getByText('明度 (Brightness)')).toBeInTheDocument();
    expect(screen.getByText('コントラスト (Contrast)')).toBeInTheDocument();
    expect(screen.getByText('彩度 (Saturation)')).toBeInTheDocument();
    expect(screen.getByText('色温度 (Temperature)')).toBeInTheDocument();
    expect(screen.getByText('色相 (Hue)')).toBeInTheDocument();
    expect(screen.getByText('露出 (Exposure)')).toBeInTheDocument();
    expect(screen.getByText('自然な彩度 (Vibrance)')).toBeInTheDocument();
  });

  it('displays current parameter values', () => {
    const params = {
      brightness: 25,
      contrast: 1.5,
      saturation: -10,
      temperature: 15,
      hue: 45,
      exposure: 0.5,
      vibrance: 30
    };

    render(
      <BasicAdjustments
        params={params}
        onParamChange={mockOnParamChange}
      />
    );

    // Each parameter has both slider and number input, so check for 2 elements each
    expect(screen.getAllByDisplayValue('25')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('1.5')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('-10')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('15')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('45')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('0.5')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('30')).toHaveLength(2);
  });

  it('disables all controls when disabled prop is true', () => {
    render(
      <BasicAdjustments
        params={mockParams}
        onParamChange={mockOnParamChange}
        disabled={true}
      />
    );

    const sliders = screen.getAllByRole('slider');
    const numberInputs = screen.getAllByRole('spinbutton');

    sliders.forEach(slider => {
      expect(slider).toBeDisabled();
    });

    numberInputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });
});