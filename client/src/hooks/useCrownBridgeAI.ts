import { useState } from 'react';
import * as THREE from 'three';
import { CrownBridgeSettings, CrownBridgeAnalysis, CrownBridgeValidation } from '../../server/types/crown-bridge';
import { analyzeCrownBridge, generateCrownBridge, validateCrownBridge, exportPDF } from '../api/crown-bridge';

export const useCrownBridgeAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: Error) => {
    setError(err);
    throw err;
  };

  const analyze = async (scan: THREE.BufferGeometry, settings: CrownBridgeSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await analyzeCrownBridge(scan, settings);
      return result;
    } catch (err) {
      return handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const generate = async (scan: THREE.BufferGeometry, settings: CrownBridgeSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await generateCrownBridge(scan, settings);
      return result;
    } catch (err) {
      return handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const validate = async (design: THREE.BufferGeometry, settings: CrownBridgeSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await validateCrownBridge(design, settings);
      return result;
    } catch (err) {
      return handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportDesign = async (design: THREE.BufferGeometry, settings: CrownBridgeSettings) => {
    try {
      setIsLoading(true);
      setError(null);
      await exportPDF(design, settings);
    } catch (err) {
      return handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    analyzeCrownBridge: analyze,
    generateCrownBridge: generate,
    validateCrownBridge: validate,
    exportPDF: exportDesign
  };
}; 