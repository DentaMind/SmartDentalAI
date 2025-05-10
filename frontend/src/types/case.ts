export enum CaseStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface AIAnalysis {
  diagnosis: string;
  confidence: number;
  suggestions: string[];
  timestamp: string;
}

export interface DoctorAnalysis {
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  timestamp: string;
}

export interface Case {
  id: string;
  patient_id: string;
  title: string;
  description: string;
  assigned_doctor: string;
  status: CaseStatus;
  ai_analysis?: AIAnalysis;
  doctor_analysis?: DoctorAnalysis;
  created_at: string;
  updated_at: string;
} 