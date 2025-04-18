import { useState, useCallback } from 'react';
import { 
  analyzeDenture, 
  generateDenture, 
  validateDenture,
  exportDenturePDF 
} from '../api/denture';
import { 
  DentureAnalysis, 
  DentureValidation, 
  DentureSettings,
  Tooth,
  ArchType
} from '../../server/types/denture';
import * as THREE from 'three';

interface UseDentureAIProps {
  token: string;
}

export const useDentureAI = ({ token }: UseDentureAIProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DentureAnalysis | null>(null);
  const [validation, setValidation] = useState<DentureValidation | null>(null);

  const analyzeCase = useCallback(async (
    archType: ArchType,
    remainingTeeth: Tooth[],
    occlusionMap: number[][],
    archScan: THREE.BufferGeometry
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeDenture(
        archType,
        remainingTeeth,
        occlusionMap,
        archScan,
        token
      );
      setAnalysis(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generateDenture = useCallback(async (
    settings: DentureSettings
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      return await generateDenture(settings, token);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const validateDesign = useCallback(async (
    dentureGeometry: THREE.BufferGeometry,
    settings: DentureSettings
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await validateDenture(dentureGeometry, settings, token);
      setValidation(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const exportPDF = useCallback(async (
    dentureGeometry: THREE.BufferGeometry,
    settings: DentureSettings
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      return await exportDenturePDF(dentureGeometry, settings, token);
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
    generateDenture,
    validateDesign,
    exportPDF,
    clearError
  };
}; 