import React from 'react';
import { Layer, Line, Text, Group } from 'react-konva';
import { Measurement } from '../../hooks/useXrayMeasurements';

interface MeasurementLayerProps {
  measurements: Measurement[];
  currentMeasurement: Partial<Measurement> | null;
  onDelete?: (id: string) => void;
}

export const MeasurementLayer: React.FC<MeasurementLayerProps> = ({
  measurements,
  currentMeasurement,
  onDelete
}) => {
  const renderMeasurement = (measurement: Measurement | Partial<Measurement>, isTemp = false) => {
    if (!measurement.start || !measurement.end) return null;

    const { start, end } = measurement;
    
    // Calculate midpoint for text placement
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Calculate angle for text rotation
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    
    // Calculate length for display
    const length = measurement.length || 0;

    return (
      <Group
        key={measurement.id || 'temp'}
        onClick={() => {
          if (!isTemp && onDelete && measurement.id) {
            if (window.confirm('Delete this measurement?')) {
              onDelete(measurement.id);
            }
          }
        }}
        onTap={() => {
          if (!isTemp && onDelete && measurement.id) {
            if (window.confirm('Delete this measurement?')) {
              onDelete(measurement.id);
            }
          }
        }}
      >
        <Line
          points={[start.x, start.y, end.x, end.y]}
          stroke={isTemp ? '#00ff00' : '#ff0000'}
          strokeWidth={2}
          dash={isTemp ? [5, 5] : undefined}
        />
        <Text
          x={midX}
          y={midY}
          text={`${length.toFixed(1)}mm${measurement.notes ? ` - ${measurement.notes}` : ''}`}
          fill={isTemp ? '#00ff00' : '#ff0000'}
          fontSize={14}
          rotation={angle}
          offsetX={-20}
          offsetY={-10}
        />
      </Group>
    );
  };

  return (
    <Layer>
      {measurements.map(m => renderMeasurement(m))}
      {currentMeasurement && renderMeasurement(currentMeasurement, true)}
    </Layer>
  );
}; 