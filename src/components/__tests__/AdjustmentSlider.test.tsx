import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdjustmentSlider } from '../AdjustmentSlider';

describe('AdjustmentSlider', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with correct label and value', () => {
    render(
      <AdjustmentSlider
        label="Test Slider"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Test Slider')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('50')).toHaveLength(2); // slider and number input
  });

  it('calls onChange when slider value changes', () => {
    render(
      <AdjustmentSlider
        label="Test Slider"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={mockOnChange}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });

    expect(mockOnChange).toHaveBeenCalledWith('75');
  });

  it('calls onChange when number input value changes', () => {
    render(
      <AdjustmentSlider
        label="Test Slider"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={mockOnChange}
      />
    );

    const numberInput = screen.getByRole('spinbutton');
    fireEvent.change(numberInput, { target: { value: '25' } });

    expect(mockOnChange).toHaveBeenCalledWith('25');
  });

  it('renders with unit when provided', () => {
    render(
      <AdjustmentSlider
        label="Test Slider"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={mockOnChange}
        unit="px"
      />
    );

    expect(screen.getByText('px')).toBeInTheDocument();
  });

  it('disables controls when disabled prop is true', () => {
    render(
      <AdjustmentSlider
        label="Test Slider"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const slider = screen.getByRole('slider');
    const numberInput = screen.getByRole('spinbutton');

    expect(slider).toBeDisabled();
    expect(numberInput).toBeDisabled();
  });
});