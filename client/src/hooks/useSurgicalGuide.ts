import { useState, useCallback } from 'react';
import { 
  analyzeGuide, 
  generateGuide, 
  validateGuide, 
  generateNerveHeatmap 
} from '../api/surgical-guide';
import { 
  Implant, 
  NerveTrace, 
  SurgicalGuideSettings, 
  GuideAnalysis, 
  GuideValidation, 
  NerveHeatmap 
} from '../../server/types/surgical-guide';
import * as THREE from 'three';

interface UseSurgicalGuideProps {
  token: string;
}

export const useSurgicalGuide = ({ token }: UseSurgicalGuideProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GuideAnalysis | null>(null);
  const [validation, setValidation] = useState<GuideValidation | null>(null);
  const [heatmap, setHeatmap] = useState<NerveHeatmap | null>(null);

  const analyze = useCallback(async (
    implants: Implant[],
    tissueSurface: THREE.BufferGeometry,
    nerveTraces: NerveTrace[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeGuide(implants, tissueSurface, nerveTraces, token);
      setAnalysis(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generate = useCallback(async (
    implants: Implant[],
    tissueSurface: THREE.BufferGeometry,
    settings: SurgicalGuideSettings
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      return await generateGuide(implants, tissueSurface, settings, token);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const validate = useCallback(async (
    guideGeometry: THREE.BufferGeometry,
    implants: Implant[],
    nerveTraces: NerveTrace[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await validateGuide(guideGeometry, implants, nerveTraces, token);
      setValidation(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generateHeatmap = useCallback(async (
    nerveTraces: NerveTrace[],
    dimensions: { width: number; height: number; depth: number }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateNerveHeatmap(nerveTraces, dimensions, token);
      setHeatmap(result);
    } catch (err) {
      setError((err as Error).message);
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
    heatmap,
    analyze,
    generate,
    validate,
    generateHeatmap,
    clearError
  };
}; 