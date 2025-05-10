export interface DiagnosisEvidence {
  source: string;
  details: string;
  relevance: number;
}

export interface DiagnosisSuggestion {
  diagnosis: string;
  confidence: number;
  evidence?: DiagnosisEvidence[];
  timestamp: string;
}

export interface DiagnosisFeedback {
  suggestionId: number;
  correct: boolean;
  feedback: string;
  timestamp: string;
}

export interface DiagnosisAuditLog {
  id: number;
  patientId: number;
  diagnosis: string;
  providerId: number;
  timestamp: string;
  feedback?: string;
  override?: boolean;
}

export interface DiagnosisResponse {
  suggestions: DiagnosisSuggestion[];
  auditLogs?: DiagnosisAuditLog[];
} 