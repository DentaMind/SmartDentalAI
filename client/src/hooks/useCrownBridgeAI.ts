import { useState, useCallback } from 'react';
import { 
  analyzeCrownBridge, 
  generateCrownBridge, 
  validateCrownBridge,
  exportCrownBridgePDF 
} from '../api/crown-bridge';
import { 
  CrownBridgeAnalysis, 
  CrownBridgeValidation, 
  CrownBridgeSettings,
  Tooth
} from '../../server/types/crown-bridge';
import * as THREE from 'three';

interface UseCrownBridgeAIProps {
  token: string;
}

export const useCrownBridgeAI = ({ token }: UseCrownBridgeAIProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CrownBridgeAnalysis | null>(null);
  const [validation, setValidation] = useState<CrownBridgeValidation | null>(null);

  const analyzeCase = useCallback(async (
    preparationScan: THREE.BufferGeometry,
    opposingScan: THREE.BufferGeometry,
    adjacentTeeth: Tooth[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCrownBridge(
        preparationScan,
        opposingScan,
        adjacentTeeth,
        token
      );
      setAnalysis(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generateDesign = useCallback(async (
    settings: CrownBridgeSettings
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      return await generateCrownBridge(settings, token);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const validateDesign = useCallback(async (
    preparationScan: THREE.BufferGeometry,
    settings: CrownBridgeSettings
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await validateCrownBridge(preparationScan, settings, token);
      setValidation(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const exportPDF = useCallback(async (
    preparationScan: THREE.BufferGeometry,
    settings: CrownBridgeSettings
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      return await exportCrownBridgePDF(preparationScan, settings, token);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    analysis,
    validation,
    analyzeCase,
    generateDesign,
    validateDesign,
    exportPDF,
    clearError
  };
}; 