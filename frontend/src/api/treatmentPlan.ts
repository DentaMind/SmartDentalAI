import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export interface TreatmentProcedure {
  id?: string;
  treatment_plan_id: string;
  tooth_number?: string;
  cdt_code?: string;
  procedure_name: string;
  description?: string;
  status: string;
  priority: string;
  phase: string;
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
  created_at: Date;
}

export interface TreatmentPlanSummary {
  total_procedures: number;
  procedures_by_phase: Record<string, number>;
  procedures_by_status: Record<string, number>;
  total_treatment_fee: number;
  total_insurance_coverage: number;
  total_patient_responsibility: number;
  procedures_requiring_preauth: number;
  completed_procedures: number;
  progress_percentage: number;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  diagnosis_id?: string;
  title?: string;
  description?: string;
  notes?: string;
  status: string;
  priority: string;
  current_version: number;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  completed_at?: Date;
  medical_alerts?: string[];
  total_fee: number;
  insurance_verified: boolean;
  insurance_portion: number;
  patient_portion: number;
  insurance_notes?: string;
  consent_signed: boolean;
  consent_signed_by?: string;
  consent_signed_at?: Date;
  ai_assisted: boolean;
  ai_model_version?: string;
  ai_confidence_score?: number;
  created_at: Date;
  procedures: TreatmentProcedure[];
  financial_options?: Record<string, any>;
  summary?: TreatmentPlanSummary;
}

export interface TreatmentPlanCreate {
  patient_id: string;
  diagnosis_id?: string;
  title?: string;
  description?: string;
  notes?: string;
  status?: string;
  priority?: string;
  medical_alerts?: string[];
  created_by: string;
  ai_assisted?: boolean;
  ai_model_version?: string;
  ai_confidence_score?: number;
}

export interface TreatmentProcedureCreate {
  treatment_plan_id: string;
  tooth_number?: string;
  cdt_code?: string;
  procedure_name: string;
  description?: string;
  status?: string;
  priority?: string;
  phase?: string;
  fee?: number;
  notes?: string;
  reasoning?: string;
  ai_suggested?: boolean;
  surfaces?: string[];
  quadrant?: string;
  arch?: string;
  preauth_required?: boolean;
}

export interface TreatmentPlanUpdate {
  title?: string;
  description?: string;
  notes?: string;
  status?: string;
  priority?: string;
  medical_alerts?: string[];
  insurance_verified?: boolean;
  insurance_notes?: string;
  financial_options?: Record<string, any>;
}

export interface TreatmentProcedureUpdate {
  status?: string;
  priority?: string;
  phase?: string;
  fee?: number;
  notes?: string;
  doctor_reasoning?: string;
  scheduled_date?: Date;
  preauth_required?: boolean;
  preauth_status?: string;
  surfaces?: string[];
  insurance_coverage?: number;
  insurance_coverage_note?: string;
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/treatment-plans`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const treatmentPlanApi = {
  // Get all treatment plans for a patient
  getPatientTreatmentPlans: async (patientId: string, params?: { status?: string[] }) => {
    const response = await api.get(`/patient/${patientId}`, { params });
    return response.data;
  },

  // Get a treatment plan by ID
  getTreatmentPlan: async (planId: string) => {
    const response = await api.get(`/${planId}`);
    return response.data;
  },

  // Create a new treatment plan
  createTreatmentPlan: async (planData: TreatmentPlanCreate) => {
    const response = await api.post('/', planData);
    return response.data;
  },

  // Update a treatment plan
  updateTreatmentPlan: async (planId: string, updateData: TreatmentPlanUpdate) => {
    const response = await api.put(`/${planId}`, updateData);
    return response.data;
  },

  // Approve a treatment plan
  approveTreatmentPlan: async (planId: string, notes?: string) => {
    const response = await api.post(`/${planId}/approve`, { notes });
    return response.data;
  },

  // Sign consent for a treatment plan
  signConsent: async (planId: string, signedBy: string) => {
    const response = await api.post(`/${planId}/consent`, { signed_by: signedBy });
    return response.data;
  },

  // Complete a treatment plan
  completeTreatmentPlan: async (planId: string, notes?: string) => {
    const response = await api.post(`/${planId}/complete`, { notes });
    return response.data;
  },

  // Get treatment plan summary
  getTreatmentPlanSummary: async (planId: string) => {
    const response = await api.get(`/${planId}/summary`);
    return response.data;
  },

  // Generate PDF
  generatePDF: async (planId: string) => {
    return `${API_BASE_URL}/treatment-plans/${planId}/pdf`;
  },

  // Add a procedure to a treatment plan
  addProcedure: async (procedureData: TreatmentProcedureCreate) => {
    const response = await api.post('/procedures', procedureData);
    return response.data;
  },

  // Update a procedure
  updateProcedure: async (procedureId: string, updateData: TreatmentProcedureUpdate) => {
    const response = await api.put(`/procedures/${procedureId}`, updateData);
    return response.data;
  },

  // Delete a procedure
  deleteProcedure: async (procedureId: string) => {
    await api.delete(`/procedures/${procedureId}`);
  },

  // Get AI suggested treatment plan
  suggestTreatmentPlan: async (patientId: string, diagnosisId?: string) => {
    const response = await api.post('/ai-suggest', { patient_id: patientId, diagnosis_id: diagnosisId });
    return response.data;
  }
}; 