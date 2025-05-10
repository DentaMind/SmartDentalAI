import axios from 'axios';
import { 
  TreatmentPlan, 
  TreatmentPlanCreateParams, 
  TreatmentPlanUpdateParams,
  TreatmentProcedureCreateParams,
  TreatmentProcedureUpdateParams,
  TreatmentPlanSummary,
  PlanVersionInfo,
  TreatmentProcedure
} from '../types/treatment-plan';

const API_URL = '/api/treatment-plans';

class TreatmentPlanService {
  // Treatment plan CRUD operations
  async createTreatmentPlan(planData: TreatmentPlanCreateParams): Promise<TreatmentPlan> {
    const response = await axios.post(API_URL, planData);
    return response.data;
  }

  async getTreatmentPlan(planId: string): Promise<TreatmentPlan> {
    const response = await axios.get(`${API_URL}/${planId}`);
    return response.data;
  }

  async getPatientTreatmentPlans(
    patientId: string, 
    status?: string[],
    includeProcedures = false
  ): Promise<TreatmentPlan[]> {
    const params = new URLSearchParams();
    if (status && status.length > 0) {
      status.forEach(s => params.append('status', s));
    }
    params.append('include_procedures', includeProcedures.toString());
    
    const response = await axios.get(`${API_URL}/patient/${patientId}`, { params });
    return response.data;
  }

  async updateTreatmentPlan(
    planId: string, 
    updateData: TreatmentPlanUpdateParams
  ): Promise<TreatmentPlan> {
    const response = await axios.put(`${API_URL}/${planId}`, updateData);
    return response.data;
  }

  // Treatment plan actions
  async approveTreatmentPlan(planId: string, notes?: string): Promise<TreatmentPlan> {
    const response = await axios.post(`${API_URL}/${planId}/approve`, { notes });
    return response.data;
  }

  async signConsent(planId: string, signedBy: string): Promise<TreatmentPlan> {
    const response = await axios.post(`${API_URL}/${planId}/consent`, { signed_by: signedBy });
    return response.data;
  }

  async completeTreatmentPlan(planId: string, notes?: string): Promise<TreatmentPlan> {
    const response = await axios.post(`${API_URL}/${planId}/complete`, { notes });
    return response.data;
  }

  // Procedures
  async addProcedure(procedureData: TreatmentProcedureCreateParams): Promise<TreatmentProcedure> {
    const response = await axios.post(`${API_URL}/procedures`, procedureData);
    return response.data;
  }

  async updateProcedure(
    procedureId: string,
    updateData: TreatmentProcedureUpdateParams
  ): Promise<TreatmentProcedure> {
    const response = await axios.put(`${API_URL}/procedures/${procedureId}`, updateData);
    return response.data;
  }

  async deleteProcedure(procedureId: string): Promise<void> {
    await axios.delete(`${API_URL}/procedures/${procedureId}`);
  }

  // Summary and analytics
  async getPlanSummary(planId: string): Promise<TreatmentPlanSummary> {
    const response = await axios.get(`${API_URL}/${planId}/summary`);
    return response.data;
  }

  // Versioning and history
  async getPlanVersions(planId: string): Promise<PlanVersionInfo[]> {
    const response = await axios.get(`${API_URL}/${planId}/versions`);
    return response.data;
  }

  async getPlanVersion(planId: string, version: number): Promise<any> {
    const response = await axios.get(`${API_URL}/${planId}/versions/${version}`);
    return response.data;
  }

  async getPlanHistory(planId: string, limit = 100): Promise<any[]> {
    const response = await axios.get(`${API_URL}/${planId}/history`, {
      params: { limit }
    });
    return response.data;
  }

  // PDF generation
  getPlanPdfUrl(planId: string): string {
    return `${API_URL}/${planId}/pdf`;
  }

  // AI suggestions
  async suggestTreatmentPlan(patientId: string, diagnosisId?: string): Promise<any> {
    const response = await axios.post(`${API_URL}/ai-suggest`, {
      patient_id: patientId,
      diagnosis_id: diagnosisId
    });
    return response.data;
  }
}

export const treatmentPlanService = new TreatmentPlanService(); 