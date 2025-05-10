import React, { useEffect, useRef, useState } from 'react';
import { init, RenderingEngine, Enums, volumeLoader, cache } from '@cornerstonejs/core';
import { ViewportType } from '@cornerstonejs/core/dist/esm/enums';
import { ToolGroupManager, WindowLevelTool, ZoomTool, PanTool } from '@cornerstonejs/tools';
import { Button, Segmented, Space, Slider } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  ReloadOutlined,
  SwapOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import './CBCTViewer.css';

interface CBCTViewerProps {
  dicomUrl: string;
  onViewportReady?: () => void;
  onError?: (error: Error) => void;
}

export const CBCTViewer: React.FC<CBCTViewerProps> = ({
  dicomUrl,
  onViewportReady,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportType, setViewportType] = useState<ViewportType>(ViewportType.STACK);
  const [windowLevel, setWindowLevel] = useState(400);
  const [windowWidth, setWindowWidth] = useState(1500);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeViewer = async () => {
      try {
        // Initialize Cornerstone
        await init();

        // Create a rendering engine
        const renderingEngine = new RenderingEngine('CBCTEngine');

        // Create tool group
        const toolGroup = ToolGroupManager.createToolGroup('CBCTToolGroup');
        if (!toolGroup) {
          throw new Error('Failed to create tool group');
        }

        // Add tools
        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addTool(PanTool.toolName);

        // Set tool modes
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        });
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
        });
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
        });

        // Create viewport
        const viewportInput = {
          viewportId: 'CBCTViewport',
          type: viewportType,
          element: containerRef.current!,
          defaultOptions: {
            background: [0, 0, 0] as [number, number, number],
          },
        };

        renderingEngine.enableElement(viewportInput);

        // Load volume
        const volume = await volumeLoader.createAndCacheVolume('CBCTVolume', {
          imageIds: [dicomUrl],
        });

        // Set the volume to load
        volume.load();

        // Get the viewport
        const viewport = renderingEngine.getViewport('CBCTViewport');

        // Set the volume on the viewport
        await viewport.setVolumes([
          {
            volumeId: 'CBCTVolume',
          },
        ]);

        // Render the image
        viewport.render();

        // Set initial window level
        viewport.setProperties({ 
          windowLevel,
          windowWidth 
        });

        setIsLoading(false);
        onViewportReady?.();

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize CBCT viewer');
        setError(error);
        onError?.(error);
        setIsLoading(false);
      }
    };

    initializeViewer();

    return () => {
      // Cleanup
      cache.purgeCache();
      ToolGroupManager.destroyToolGroup('CBCTToolGroup');
    };
  }, [dicomUrl, viewportType, windowLevel, windowWidth, onViewportReady, onError]);

  const handleViewportTypeChange = (value: string) => {
    setViewportType(value as ViewportType);
  };

  const handleWindowLevelChange = (value: number) => {
    setWindowLevel(value);
  };

  const handleWindowWidthChange = (value: number) => {
    setWindowWidth(value);
  };

  const handleReset = () => {
    setWindowLevel(400);
    setWindowWidth(1500);
  };

  if (error) {
    return (
      <div className="cbct-viewer-error">
        <h3>Error Loading CBCT</h3>
        <p>{error.message}</p>
        <Button type="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="cbct-viewer">
      <div className="cbct-viewer-toolbar">
        <Space>
          <Segmented
            value={viewportType}
            onChange={handleViewportTypeChange}
            options={[
              { label: 'Axial', value: ViewportType.STACK },
              { label: 'Coronal', value: ViewportType.STACK },
              { label: 'Sagittal', value: ViewportType.STACK },
              { label: '3D', value: ViewportType.VOLUME_3D },
            ]}
          />
          <Button.Group>
            <Button icon={<ZoomInOutlined />} />
            <Button icon={<ZoomOutOutlined />} />
            <Button icon={<ReloadOutlined />} onClick={handleReset} />
            <Button icon={<SwapOutlined />} />
            <Button icon={<SettingOutlined />} />
          </Button.Group>
        </Space>
      </div>
      <div className="cbct-viewer-controls">
        <div className="window-level-control">
          <span>Window Level</span>
          <Slider
            min={-1000}
            max={1000}
            value={windowLevel}
            onChange={handleWindowLevelChange}
          />
        </div>
        <div className="window-width-control">
          <span>Window Width</span>
          <Slider
            min={100}
            max={3000}
            value={windowWidth}
            onChange={handleWindowWidthChange}
          />
        </div>
      </div>
      <div 
        ref={containerRef} 
        className="cbct-viewer-container"
        style={{ opacity: isLoading ? 0.5 : 1 }}
      />
    </div>
  );
}; 