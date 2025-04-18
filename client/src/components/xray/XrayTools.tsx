import React from 'react';
import { Xray } from '@shared/schema';

interface XrayToolsProps {
  xray: Xray;
  onToolChange: (tool: string) => void;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onZoomChange: (value: number) => void;
  onRotateChange: (value: number) => void;
  onAIToggle: (overlay: string, visible: boolean) => void;
}

export const XrayTools: React.FC<XrayToolsProps> = ({
  xray,
  onToolChange,
  onBrightnessChange,
  onContrastChange,
  onZoomChange,
  onRotateChange,
  onAIToggle
}) => {
  const [activeTool, setActiveTool] = React.useState<string>('pan');
  const [aiOverlays, setAiOverlays] = React.useState<Record<string, boolean>>({
    caries: false,
    boneLoss: false,
    restorations: false,
    implants: false,
    margins: false
  });

  const handleToolClick = (tool: string) => {
    setActiveTool(tool);
    onToolChange(tool);
  };

  const handleAIToggle = (overlay: string) => {
    const newValue = !aiOverlays[overlay];
    setAiOverlays(prev => ({ ...prev, [overlay]: newValue }));
    onAIToggle(overlay, newValue);
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-2 rounded ${
              activeTool === 'pan' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleToolClick('pan')}
          >
            Pan
          </button>
          <button
            className={`p-2 rounded ${
              activeTool === 'measure' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleToolClick('measure')}
          >
            Measure
          </button>
          <button
            className={`p-2 rounded ${
              activeTool === 'annotate' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleToolClick('annotate')}
          >
            Annotate
          </button>
          <button
            className={`p-2 rounded ${
              activeTool === 'compare' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleToolClick('compare')}
          >
            Compare
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Adjustments</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500">Brightness</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Contrast</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              onChange={(e) => onContrastChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Zoom</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Rotate</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              onChange={(e) => onRotateChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">AI Overlays</h3>
        <div className="space-y-2">
          {Object.entries(aiOverlays).map(([overlay, visible]) => (
            <label key={overlay} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visible}
                onChange={() => handleAIToggle(overlay)}
                className="rounded text-blue-600"
              />
              <span className="text-sm capitalize">{overlay}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}; 