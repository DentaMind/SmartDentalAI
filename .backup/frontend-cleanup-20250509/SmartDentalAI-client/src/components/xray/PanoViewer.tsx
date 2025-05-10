import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Group } from 'react-konva';
import { useXrayMeasurements, Point } from '../../hooks/useXrayMeasurements';
import { MeasurementTools } from './MeasurementTools';
import { MeasurementLayer } from './MeasurementLayer';
import './PanoViewer.css';

interface PanoViewerProps {
  imageUrl: string;
  initialPixelsPerMm?: number;
  onMeasurementsChange?: (measurements: any) => void;
}

export const PanoViewer: React.FC<PanoViewerProps> = ({
  imageUrl,
  initialPixelsPerMm = 10,
  onMeasurementsChange
}) => {
  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

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
  } = useXrayMeasurements({ pixelsPerMm: initialPixelsPerMm });

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      setStageSize({
        width: img.width,
        height: img.height
      });
    };
  }, [imageUrl]);

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
    link.download = `pano-measurements-${Date.now()}.json`;
    link.href = dataUri;
    link.click();
  };

  return (
    <div className="pano-viewer">
      <MeasurementTools
        onScaleChange={setScale}
        onExport={handleExport}
        onCalibrate={toggleCalibrationMode}
        onClear={clearMeasurements}
        calibrationMode={calibrationMode}
      />
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
    </div>
  );
}; 