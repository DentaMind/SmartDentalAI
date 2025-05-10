// Treatment Plan Types
export type PlanStatus = 
  | 'draft'
  | 'proposed'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PriorityLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type PlanPhase = 
  | 'urgent'
  | 'phase_1'
  | 'phase_2'
  | 'maintenance';

export type ProcedureStatus = 
  | 'recommended'
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Procedure
export interface TreatmentProcedure {
  id: string;
  treatment_plan_id: string;
  tooth_number?: string;
  cdt_code?: string;
  procedure_name: string;
  description?: string;
  status: ProcedureStatus;
  priority: PriorityLevel;
  phase: PlanPhase;
  fee: number;
  notes?: string;
  reasoning?: string;
  ai_suggested: boolean;
  doctor_approved: boolean;
  doctor_reasoning?: string;
  modified_by_doctor: boolean;
  insurance_coverage?: number;
  insurance_coverage_note?: string;
  surfaces?: string[];
  quadrant?: string;
  arch?: string;
  preauth_required: boolean;
  preauth_status?: string;
  created_at: string;
  completed_at?: string;
  scheduled_date?: string;
}

// Treatment Plan
export interface TreatmentPlan {
  id: string;
  patient_id: string;
  diagnosis_id?: string;
  title?: string;
  description?: string;
  notes?: string;
  status: PlanStatus;
  priority: PriorityLevel;
  current_version: number;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
  medical_alerts?: string[];
  total_fee: number;
  insurance_verified: boolean;
  insurance_portion: number;
  patient_portion: number;
  insurance_notes?: string;
  consent_signed: boolean;
  consent_signed_by?: string;
  consent_signed_at?: string;
  ai_assisted: boolean;
  ai_model_version?: string;
  ai_confidence_score?: number;
  created_at: string;
  procedures: TreatmentProcedure[];
  financial_options?: Record<string, any>;
  summary?: TreatmentPlanSummary;
}

// Treatment Plan Summary
export interface TreatmentPlanSummary {
  total_procedures: number;
  procedures_by_phase: Record<PlanPhase, number>;
  procedures_by_status: Record<ProcedureStatus, number>;
  total_treatment_fee: number;
  total_insurance_coverage: number;
  total_patient_responsibility: number;
  procedures_requiring_preauth: number;
  completed_procedures: number;
  progress_percentage: number;
}

// Version Information
export interface PlanVersionInfo {
  treatment_plan_id: string;
  version: number;
  created_by: string;
  created_at: string;
  notes?: string;
}

// History Entry
export interface TreatmentPlanHistoryEntry {
  id: number;
  treatment_plan_id: string;
  action: string;
  action_by: string;
  action_at: string;
  details?: Record<string, any>;
}

// Create Params
export interface TreatmentPlanCreateParams {
  patient_id: string;
  diagnosis_id?: string;
  title?: string;
  description?: string;
  notes?: string;
  status?: PlanStatus;
  priority?: PriorityLevel;
  medical_alerts?: string[];
  created_by?: string;
  ai_assisted?: boolean;
}

// Update Params
export interface TreatmentPlanUpdateParams {
  title?: string;
  description?: string;
  notes?: string;
  status?: PlanStatus;
  priority?: PriorityLevel;
  medical_alerts?: string[];
  insurance_verified?: boolean;
  insurance_notes?: string;
  financial_options?: Record<string, any>;
}

// Procedure Create Params
export interface TreatmentProcedureCreateParams {
  treatment_plan_id: string;
  tooth_number?: string;
  cdt_code?: string;
  procedure_name: string;
  description?: string;
  status?: ProcedureStatus;
  priority?: PriorityLevel;
  phase?: PlanPhase;
  fee?: number;
  notes?: string;
  reasoning?: string;
  ai_suggested?: boolean;
  surfaces?: string[];
  quadrant?: string;
  arch?: string;
  preauth_required?: boolean;
}

// Procedure Update Params
export interface TreatmentProcedureUpdateParams {
  status?: ProcedureStatus;
  priority?: PriorityLevel;
  phase?: PlanPhase;
  fee?: number;
  notes?: string;
  doctor_reasoning?: string;
  scheduled_date?: string;
  preauth_required?: boolean;
  preauth_status?: string;
  surfaces?: string[];
  insurance_coverage?: number;
  insurance_coverage_note?: string;
} 