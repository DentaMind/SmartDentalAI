import { useState, useCallback } from 'react';
import { Xray } from '@shared/schema';

export interface Point {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  start: Point;
  end: Point;
  length: number; // in millimeters
  notes?: string;
  timestamp: string;
}

interface UseXrayMeasurementsProps {
  xray: Xray;
  pixelsPerMm?: number; // Calibration: pixels per millimeter
}

export const useXrayMeasurements = ({ xray, pixelsPerMm = 10 }: UseXrayMeasurementsProps) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);

  const calculateLength = useCallback((start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    return pixelLength / pixelsPerMm;
  }, [pixelsPerMm]);

  const startMeasurement = useCallback((point: Point) => {
    setIsMeasuring(true);
    setCurrentMeasurement({
      id: Date.now().toString(),
      start: point,
      end: point,
      length: 0,
      timestamp: new Date().toISOString()
    });
  }, []);

  const updateMeasurement = useCallback((point: Point) => {
    if (!currentMeasurement?.start) return;
    
    const length = calculateLength(currentMeasurement.start, point);
    
    setCurrentMeasurement(prev => ({
      ...prev,
      end: point,
      length
    }));
  }, [currentMeasurement, calculateLength]);

  const completeMeasurement = useCallback((point: Point, notes?: string) => {
    if (!currentMeasurement?.start) return;

    const length = calculateLength(currentMeasurement.start, point);
    
    const measurement: Measurement = {
      ...currentMeasurement as Measurement,
      end: point,
      length,
      notes,
      timestamp: new Date().toISOString()
    };

    setMeasurements(prev => [...prev, measurement]);
    setCurrentMeasurement(null);
    setIsMeasuring(false);
  }, [currentMeasurement, calculateLength]);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMeasurementNotes = useCallback((id: string, notes: string) => {
    setMeasurements(prev => prev.map(m => 
      m.id === id ? { ...m, notes } : m
    ));
  }, []);

  const clearMeasurements = useCallback(() => {
    setMeasurements([]);
    setCurrentMeasurement(null);
    setIsMeasuring(false);
  }, []);

  const toggleCalibrationMode = useCallback(() => {
    setCalibrationMode(prev => !prev);
  }, []);

  const setCalibration = useCallback((knownLengthMm: number) => {
    if (!currentMeasurement?.start || !currentMeasurement?.end) return;
    
    const dx = currentMeasurement.end.x - currentMeasurement.start.x;
    const dy = currentMeasurement.end.y - currentMeasurement.start.y;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    const newPixelsPerMm = pixelLength / knownLengthMm;
    
    // TODO: Save calibration to persistent storage
    return newPixelsPerMm;
  }, [currentMeasurement]);

  const exportMeasurements = useCallback(() => {
    return {
      xrayId: xray.id,
      measurements: measurements.map(m => ({
        ...m,
        xrayId: xray.id
      })),
      calibration: {
        pixelsPerMm
      }
    };
  }, [measurements, xray.id, pixelsPerMm]);

  return {
    measurements,
    isMeasuring,
    currentMeasurement,
    calibrationMode,
    startMeasurement,
    updateMeasurement,
    completeMeasurement,
    deleteMeasurement,
    updateMeasurementNotes,
    clearMeasurements,
    toggleCalibrationMode,
    setCalibration,
    exportMeasurements
  };
}; 