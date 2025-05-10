import { useEventCollector } from './useEventCollector';

interface AIEventMetadata {
  patientId?: number;
  userId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  modelId?: string;
  modelVersion?: string;
  confidence?: number;
  diagnosisId?: number;
  treatmentPlanId?: number;
  recommendationType?: string;
  analysisType?: string;
  duration?: number;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
}

export function useAIEvents() {
  const { collectEvent } = useEventCollector();

  const collectAIOverride = (
    userId: number,
    patientId: number,
    modelId: string,
    reason: string,
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_override', {
      user_id: userId,
      patient_id: patientId,
      model_id: modelId,
      override_reason: reason,
      ...metadata
    });
  };

  const collectAIDiagnosisGenerated = (
    patientId: number,
    diagnosisId: number,
    modelId: string,
    confidence: number,
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_diagnosis_generated', {
      patient_id: patientId,
      diagnosis_id: diagnosisId,
      model_id: modelId,
      confidence,
      ...metadata
    });
  };

  const collectAITreatmentPlanGenerated = (
    patientId: number,
    treatmentPlanId: number,
    modelId: string,
    confidence: number,
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_treatment_plan_generated', {
      patient_id: patientId,
      treatment_plan_id: treatmentPlanId,
      model_id: modelId,
      confidence,
      ...metadata
    });
  };

  const collectAIAnalysisStarted = (
    patientId: number,
    analysisType: string,
    modelId: string,
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_analysis_started', {
      patient_id: patientId,
      analysis_type: analysisType,
      model_id: modelId,
      ...metadata
    });
  };

  const collectAIAnalysisCompleted = (
    patientId: number,
    analysisType: string,
    modelId: string,
    duration: number,
    metrics: AIEventMetadata['metrics'],
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_analysis_completed', {
      patient_id: patientId,
      analysis_type: analysisType,
      model_id: modelId,
      duration,
      metrics,
      ...metadata
    });
  };

  const collectAIAnalysisError = (
    patientId: number,
    analysisType: string,
    modelId: string,
    error: string,
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_analysis_error', {
      patient_id: patientId,
      analysis_type: analysisType,
      model_id: modelId,
      error_message: error,
      ...metadata
    });
  };

  const collectAIModelRetrained = (
    modelId: string,
    modelVersion: string,
    metrics: AIEventMetadata['metrics'],
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_model_retrained', {
      model_id: modelId,
      model_version: modelVersion,
      metrics,
      ...metadata
    });
  };

  const collectAIFeedbackReceived = (
    userId: number,
    patientId: number,
    modelId: string,
    feedback: string,
    metadata: AIEventMetadata = {}
  ) => {
    return collectEvent('ai_feedback_received', {
      user_id: userId,
      patient_id: patientId,
      model_id: modelId,
      feedback,
      ...metadata
    });
  };

  return {
    collectAIOverride,
    collectAIDiagnosisGenerated,
    collectAITreatmentPlanGenerated,
    collectAIAnalysisStarted,
    collectAIAnalysisCompleted,
    collectAIAnalysisError,
    collectAIModelRetrained,
    collectAIFeedbackReceived
  };
} 