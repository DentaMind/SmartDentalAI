import React, { useEffect, useRef, useState } from 'react';
import { 
  init, 
  RenderingEngine, 
  Enums, 
  cache,
  getRenderingEngine,
  getEnabledElement
} from '@cornerstonejs/core';
import { 
  ToolGroupManager, 
  WindowLevelTool, 
  ZoomTool, 
  PanTool,
  SplineROITool
} from '@cornerstonejs/tools';
import { Button, Space, Slider, Switch, message } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import './NerveTracer.css';

interface NerveTracerProps {
  viewportId: string;
  onTraceComplete?: (points: number[][]) => void;
  onError?: (error: Error) => void;
}

export const NerveTracer: React.FC<NerveTracerProps> = ({
  viewportId,
  onTraceComplete,
  onError
}) => {
  const [isTracing, setIsTracing] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [smoothness, setSmoothness] = useState(0.5);
  const [currentPoints, setCurrentPoints] = useState<number[][]>([]);
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const initializeTracer = async () => {
      try {
        await init();

        const toolGroup = ToolGroupManager.createToolGroup('NerveTracerToolGroup');
        if (!toolGroup) {
          throw new Error('Failed to create tool group');
        }

        // Add tools
        toolGroup.addTool(SplineROITool.toolName);
        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addTool(PanTool.toolName);

        // Set tool modes
        toolGroup.setToolActive(SplineROITool.toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        });

        // Add event listeners
        toolGroup.addEventListener('annotationCompleted', handleAnnotationComplete);
        toolGroup.addEventListener('annotationModified', handleAnnotationModified);

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize nerve tracer');
        onError?.(error);
      }
    };

    initializeTracer();

    return () => {
      ToolGroupManager.destroyToolGroup('NerveTracerToolGroup');
    };
  }, [viewportId, onError]);

  const handleAnnotationComplete = (evt: any) => {
    const points = evt.detail.annotation.data.contour.polyline;
    setCurrentPoints(points);
    addToHistory(points);
    setIsTracing(false);
    onTraceComplete?.(points);
  };

  const handleAnnotationModified = (evt: any) => {
    const points = evt.detail.annotation.data.contour.polyline;
    setCurrentPoints(points);
    addToHistory(points);
  };

  const addToHistory = (points: number[][]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(points);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPoints(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPoints(history[newIndex]);
    }
  };

  const handleClear = () => {
    setCurrentPoints([]);
    setHistory([]);
    setHistoryIndex(-1);
    message.success('Tracing cleared');
  };

  const handleSave = () => {
    if (currentPoints.length === 0) {
      message.warning('No tracing to save');
      return;
    }
    // TODO: Implement save functionality
    message.success('Tracing saved');
  };

  const handleAIEnable = (checked: boolean) => {
    setIsAIEnabled(checked);
    if (checked) {
      message.info('AI assistance enabled');
    } else {
      message.info('AI assistance disabled');
    }
  };

  const handleSmoothnessChange = (value: number) => {
    setSmoothness(value);
    // TODO: Implement smoothing algorithm
  };

  return (
    <div className="nerve-tracer">
      <div className="nerve-tracer-toolbar">
        <Space>
          <Button
            type={isTracing ? 'primary' : 'default'}
            icon={<EditOutlined />}
            onClick={() => setIsTracing(!isTracing)}
          >
            {isTracing ? 'Stop Tracing' : 'Start Tracing'}
          </Button>
          <Button.Group>
            <Button
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            />
            <Button
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            />
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClear}
              disabled={currentPoints.length === 0}
            />
            <Button
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={currentPoints.length === 0}
            />
          </Button.Group>
          <Switch
            checked={isAIEnabled}
            onChange={handleAIEnable}
            checkedChildren="AI On"
            unCheckedChildren="AI Off"
          />
        </Space>
      </div>
      <div className="nerve-tracer-controls">
        <div className="smoothness-control">
          <span>Smoothness</span>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={smoothness}
            onChange={handleSmoothnessChange}
          />
        </div>
      </div>
    </div>
  );
}; 