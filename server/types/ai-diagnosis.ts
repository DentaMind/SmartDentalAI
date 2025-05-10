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

export interface DiagnosisInput {
  patientId: number;
  chartData: Array<{
    condition: string;
    toothNumber?: number;
  }>;
  xRayFindings: string;
  medicalHistory: string[];
  notes: string;
}

export interface DiagnosisAuditLog {
  id: number;
  patientId: number;
  diagnosis: string;
  providerId: number;
  timestamp: string;
  feedback?: DiagnosisFeedback;
  override?: boolean;
  suggestions?: DiagnosisSuggestion[];
}

export interface DiagnosisFeedback {
  suggestionId: number;
  correctness: 'correct' | 'incorrect';
  feedback: string;
  providerId: number;
  timestamp: string;
}

export interface DiagnosisResponse {
  suggestions: DiagnosisSuggestion[];
  auditLogs?: DiagnosisAuditLog[];
} 