import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Group } from 'react-konva';
import { Xray } from '@shared/schema';
import { useXrayMeasurements, Point } from '../../hooks/useXrayMeasurements';
import { MeasurementTools } from './MeasurementTools';
import { MeasurementLayer } from './MeasurementLayer';
import { IntraoralOverlay } from './IntraoralOverlay';
import { ViewModeSelector, ViewMode } from './ViewModeSelector';
import { message } from 'antd';
import './XrayViewer.css';
import './ViewModeSelector.css';

interface XrayViewerProps {
  xray: Xray;
  initialPixelsPerMm?: number;
  onMeasurementsChange?: (measurements: any) => void;
  onTransformChange?: (transform: any) => void;
}

export const XrayViewer: React.FC<XrayViewerProps> = ({
  xray,
  initialPixelsPerMm = 10,
  onMeasurementsChange,
  onTransformChange
}) => {
  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<ViewMode>('fmx');
  const [showIntraoral, setShowIntraoral] = useState(false);

  const {
    measurements,
    isMeasuring,
    currentMeasurement,
    calibrationMode,
    startMeasurement,
    updateMeasurement,
    completeMeasurement,
    deleteMeasurement,
    clearMeasurements,
    toggleCalibrationMode,
    setCalibration,
    exportMeasurements
  } = useXrayMeasurements({ xray, pixelsPerMm: initialPixelsPerMm });

  useEffect(() => {
    const img = new window.Image();
    img.src = xray.imageUrl;
    img.onload = () => {
      setImage(img);
      setStageSize({
        width: img.width,
        height: img.height
      });
    };
  }, [xray.imageUrl]);

  useEffect(() => {
    if (onMeasurementsChange) {
      onMeasurementsChange(exportMeasurements());
    }
  }, [measurements, onMeasurementsChange, exportMeasurements]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(Math.max(0.1, Math.min(newScale, 5)));

    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleMouseDown = (e: any) => {
    if (!isMeasuring) return;
    const point = stageRef.current?.getPointerPosition();
    if (!point) return;
    
    const scaledPoint: Point = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale
    };
    startMeasurement(scaledPoint);
  };

  const handleMouseMove = (e: any) => {
    if (!isMeasuring) return;
    const point = stageRef.current?.getPointerPosition();
    if (!point) return;

    const scaledPoint: Point = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale
    };
    updateMeasurement(scaledPoint);
  };

  const handleMouseUp = (e: any) => {
    if (!isMeasuring) return;
    const point = stageRef.current?.getPointerPosition();
    if (!point) return;

    const scaledPoint: Point = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale
    };

    if (calibrationMode) {
      const knownLength = parseFloat(prompt('Enter known length in mm:') || '0');
      if (knownLength > 0) {
        setCalibration(knownLength);
      }
      toggleCalibrationMode();
    } else {
      const notes = prompt('Add notes for this measurement (optional):');
      completeMeasurement(scaledPoint, notes);
    }
  };

  const handleExport = () => {
    const measurements = exportMeasurements();
    const dataStr = JSON.stringify(measurements, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.download = `xray-measurements-${xray.id}.json`;
    link.href = dataUri;
    link.click();
    message.success('Measurements exported successfully');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleIntraoralToggle = () => {
    setShowIntraoral(prev => !prev);
  };

  const handleTransformChange = (transform: any) => {
    if (onTransformChange) {
      onTransformChange(transform);
    }
  };

  const renderViewer = () => {
    switch (viewMode) {
      case 'fmx':
        return (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  width={stageSize.width}
                  height={stageSize.height}
                />
              )}
            </Layer>
            <MeasurementLayer
              measurements={measurements}
              currentMeasurement={currentMeasurement}
              scale={scale}
            />
          </Stage>
        );
      case 'scan':
        return xray.intraoralScan ? (
          <IntraoralOverlay
            scan={xray.intraoralScan}
            onTransformChange={(transform) => {
              // TODO: Save transform to backend
              console.log('Transform updated:', transform);
            }}
          />
        ) : null;
      case 'overlay':
        return (
          <>
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              scaleX={scale}
              scaleY={scale}
              x={position.x}
              y={position.y}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Layer>
                {image && (
                  <KonvaImage
                    image={image}
                    width={stageSize.width}
                    height={stageSize.height}
                  />
                )}
              </Layer>
              <MeasurementLayer
                measurements={measurements}
                currentMeasurement={currentMeasurement}
                scale={scale}
              />
            </Stage>
            {xray.intraoralScan && (
              <IntraoralOverlay
                scan={xray.intraoralScan}
                onTransformChange={(transform) => {
                  // TODO: Save transform to backend
                  console.log('Transform updated:', transform);
                }}
              />
            )}
          </>
        );
      case 'cbct':
        return xray.cbctUrl ? (
          <div className="cbct-viewer">
            {/* TODO: Implement CBCT viewer */}
            <p>CBCT viewer coming soon</p>
          </div>
        ) : null;
      case 'cerec':
        return xray.cerecScan ? (
          <div className="cerec-viewer">
            {/* TODO: Implement CEREC viewer */}
            <p>CEREC viewer coming soon</p>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="xray-viewer">
      <ViewModeSelector
        xray={xray}
        value={viewMode}
        onChange={handleViewModeChange}
      />
      <MeasurementTools
        xray={xray}
        onScaleChange={setScale}
        onExport={handleExport}
        onCalibrate={toggleCalibrationMode}
        onClear={clearMeasurements}
        onIntraoralToggle={handleIntraoralToggle}
        calibrationMode={calibrationMode}
        showIntraoral={showIntraoral}
      />
      <div className="xray-container">
        {renderViewer()}
      </div>
    </div>
  );
}; 