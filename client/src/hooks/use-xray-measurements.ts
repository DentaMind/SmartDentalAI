import { useState, useCallback } from 'react';
import { Xray } from '@shared/schema';

interface Measurement {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number; // in mm
  notes?: string;
}

interface UseXrayMeasurementsProps {
  xray: Xray;
  scale?: number; // pixels per mm
}

export const useXrayMeasurements = ({ xray, scale = 10 }: UseXrayMeasurementsProps) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);

  // Calculate length in mm based on pixel distance and scale
  const calculateLength = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    return pixelLength / scale;
  }, [scale]);

  const startMeasurement = useCallback((x: number, y: number) => {
    setIsMeasuring(true);
    setCurrentMeasurement({
      id: Date.now().toString(),
      start: { x, y },
      end: { x, y },
      length: 0
    });
  }, []);

  const updateMeasurement = useCallback((x: number, y: number) => {
    if (!currentMeasurement?.start) return;
    
    const end = { x, y };
    const length = calculateLength(currentMeasurement.start, end);
    
    setCurrentMeasurement(prev => ({
      ...prev,
      end,
      length
    }));
  }, [currentMeasurement, calculateLength]);

  const completeMeasurement = useCallback((notes?: string) => {
    if (!currentMeasurement?.start || !currentMeasurement?.end) return;

    const measurement: Measurement = {
      ...currentMeasurement,
      notes
    } as Measurement;

    setMeasurements(prev => [...prev, measurement]);
    setIsMeasuring(false);
    setCurrentMeasurement(null);
  }, [currentMeasurement]);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMeasurementNotes = useCallback((id: string, notes: string) => {
    setMeasurements(prev => prev.map(m => 
      m.id === id ? { ...m, notes } : m
    ));
  }, []);

  const exportMeasurements = useCallback(() => {
    return measurements.map(m => ({
      ...m,
      date: new Date().toISOString(),
      xrayId: xray.id
    }));
  }, [measurements, xray.id]);

  return {
    measurements,
    isMeasuring,
    currentMeasurement,
    startMeasurement,
    updateMeasurement,
    completeMeasurement,
    deleteMeasurement,
    updateMeasurementNotes,
    exportMeasurements
  };
}; 