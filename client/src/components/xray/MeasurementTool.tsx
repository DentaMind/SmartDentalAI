import React, { useCallback } from 'react';
import { Layer, Line, Text, Group } from 'react-konva';
import { useXrayMeasurements } from '../../hooks/use-xray-measurements';
import { Xray } from '@shared/schema';

interface MeasurementToolProps {
  xray: Xray;
  scale: number;
  onMeasurementComplete?: (measurement: any) => void;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  xray,
  scale,
  onMeasurementComplete
}) => {
  const {
    measurements,
    isMeasuring,
    currentMeasurement,
    startMeasurement,
    updateMeasurement,
    completeMeasurement,
    deleteMeasurement
  } = useXrayMeasurements({ xray, scale });

  const handleMouseDown = useCallback((e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    startMeasurement(point.x, point.y);
  }, [startMeasurement]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isMeasuring) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    updateMeasurement(point.x, point.y);
  }, [isMeasuring, updateMeasurement]);

  const handleMouseUp = useCallback(() => {
    if (!isMeasuring) return;
    
    const notes = prompt('Add notes for this measurement (optional):');
    completeMeasurement(notes);
    
    if (onMeasurementComplete && currentMeasurement) {
      onMeasurementComplete(currentMeasurement);
    }
  }, [isMeasuring, currentMeasurement, completeMeasurement, onMeasurementComplete]);

  const renderMeasurement = (measurement: any) => {
    const { start, end, length, notes } = measurement;
    
    // Calculate midpoint for text placement
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Calculate angle for text rotation
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    
    return (
      <Group key={measurement.id}>
        <Line
          points={[start.x, start.y, end.x, end.y]}
          stroke="#00ff00"
          strokeWidth={2}
          dash={[5, 5]}
        />
        <Text
          x={midX}
          y={midY}
          text={`${length.toFixed(1)}mm${notes ? ` - ${notes}` : ''}`}
          fill="#00ff00"
          fontSize={14}
          rotation={angle}
          offsetX={-20}
          offsetY={-10}
        />
      </Group>
    );
  };

  return (
    <Layer
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {measurements.map(renderMeasurement)}
      {isMeasuring && currentMeasurement && renderMeasurement(currentMeasurement)}
    </Layer>
  );
}; 