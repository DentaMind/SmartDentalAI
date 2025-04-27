import { useEventCollector } from './useEventCollector';

interface DiagnosticEventMetadata {
  diagnosisId?: number;
  patientId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'ai' | 'system';
  confidence?: number;
  modelVersion?: string;
}

export function useDiagnosticEvents() {
  const { collectEvent } = useEventCollector();

  const collectDiagnosisCreated = (
    diagnosisId: number,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('diagnosis_created', {
      diagnosis_id: diagnosisId,
      ...metadata
    });
  };

  const collectDiagnosisModified = (
    diagnosisId: number,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('diagnosis_modified', {
      diagnosis_id: diagnosisId,
      ...metadata
    });
  };

  const collectDiagnosisConfirmed = (
    diagnosisId: number,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('diagnosis_confirmed', {
      diagnosis_id: diagnosisId,
      ...metadata
    });
  };

  const collectDiagnosisRejected = (
    diagnosisId: number,
    reason: string,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('diagnosis_rejected', {
      diagnosis_id: diagnosisId,
      rejection_reason: reason,
      ...metadata
    });
  };

  const collectAIAnalysisStarted = (
    patientId: number,
    analysisType: string,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('ai_analysis_started', {
      patient_id: patientId,
      analysis_type: analysisType,
      ...metadata
    });
  };

  const collectAIAnalysisCompleted = (
    patientId: number,
    analysisType: string,
    results: any,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('ai_analysis_completed', {
      patient_id: patientId,
      analysis_type: analysisType,
      analysis_results: results,
      ...metadata
    });
  };

  const collectAIAnalysisError = (
    patientId: number,
    analysisType: string,
    error: string,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('ai_analysis_error', {
      patient_id: patientId,
      analysis_type: analysisType,
      error_message: error,
      ...metadata
    });
  };

  const collectDiagnosticImageUploaded = (
    patientId: number,
    imageType: string,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('diagnostic_image_uploaded', {
      patient_id: patientId,
      image_type: imageType,
      ...metadata
    });
  };

  const collectDiagnosticImageAnalyzed = (
    patientId: number,
    imageType: string,
    findings: any,
    metadata: DiagnosticEventMetadata = {}
  ) => {
    return collectEvent('diagnostic_image_analyzed', {
      patient_id: patientId,
      image_type: imageType,
      findings,
      ...metadata
    });
  };

  return {
    collectDiagnosisCreated,
    collectDiagnosisModified,
    collectDiagnosisConfirmed,
    collectDiagnosisRejected,
    collectAIAnalysisStarted,
    collectAIAnalysisCompleted,
    collectAIAnalysisError,
    collectDiagnosticImageUploaded,
    collectDiagnosticImageAnalyzed
  };
} 