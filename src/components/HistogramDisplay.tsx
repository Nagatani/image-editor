import React, { useEffect, useRef } from 'react';

interface HistogramDisplayProps {
  histogramData: Uint32Array | null;
  width?: number;
  height?: number;
}

export const HistogramDisplay: React.FC<HistogramDisplayProps> = ({
  histogramData,
  width = 256,
  height = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!histogramData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value for normalization
    let maxValue = 0;
    for (let i = 0; i < 256; i++) {
      const r = histogramData[i];
      const g = histogramData[i + 256];
      const b = histogramData[i + 512];
      maxValue = Math.max(maxValue, r, g, b);
    }

    if (maxValue === 0) return;

    // Draw histogram
    const barWidth = width / 256;
    
    for (let i = 0; i < 256; i++) {
      const x = i * barWidth;
      
      // Red channel
      const r = histogramData[i];
      const rHeight = (r / maxValue) * height;
      ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
      ctx.fillRect(x, height - rHeight, barWidth, rHeight);
      
      // Green channel
      const g = histogramData[i + 256];
      const gHeight = (g / maxValue) * height;
      ctx.fillStyle = `rgba(0, 255, 0, 0.5)`;
      ctx.fillRect(x, height - gHeight, barWidth, gHeight);
      
      // Blue channel
      const b = histogramData[i + 512];
      const bHeight = (b / maxValue) * height;
      ctx.fillStyle = `rgba(0, 0, 255, 0.5)`;
      ctx.fillRect(x, height - bHeight, barWidth, bHeight);
    }
  }, [histogramData, width, height]);

  return (
    <div className="panel-group">
      <div className="panel-header">
        <h3>ヒストグラム</h3>
      </div>
      <div className="panel-content">
        <div className="histogram-container">
          <canvas 
            ref={canvasRef}
            width={width}
            height={height}
            className="histogram-canvas"
          />
          <div className="histogram-labels">
            <span>0</span>
            <span>128</span>
            <span>255</span>
          </div>
        </div>
      </div>
    </div>
  );
};