import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface MedicalHistoryForm {
  patient_id: string;
  conditions: Array<{
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  medications: Array<{
    name: string;
    drug_class: string;
  }>;
  bloodwork: Array<{
    test_name: string;
    value: number;
    unit: string;
  }>;
  dental_history: {
    last_cleaning: string;
    last_xrays: string;
    previous_treatments: string[];
  };
}

export interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  asa_classification: string;
  risk_factors: string[];
  medication_interactions: string[];
  bloodwork_concerns: string[];
  epinephrine_risk: 'green' | 'yellow' | 'red';
  requires_medical_clearance: boolean;
  treatment_modifications: string[];
  recommendations: string[];
  concerns: string[];
}

export interface SavedRiskEvaluation {
  id: string;
  patient_id: string;
  evaluation_date: string;
  risk_assessment: RiskAssessment;
  medical_history: MedicalHistoryForm;
}

export const evaluateRisk = async (data: MedicalHistoryForm): Promise<RiskAssessment> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/risk/evaluate`, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        throw new Error('Invalid input data. Please check all fields and try again.');
      }
      throw new Error(error.response?.data?.detail || 'An error occurred while evaluating risk');
    }
    throw error;
  }
};

export const saveRiskEvaluation = async (
  patientId: string,
  medicalHistory: MedicalHistoryForm,
  riskAssessment: RiskAssessment
): Promise<SavedRiskEvaluation> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/risk/save`, {
      patient_id: patientId,
      medical_history: medicalHistory,
      risk_assessment: riskAssessment
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to save risk evaluation');
    }
    throw error;
  }
};

export const getPatientRiskHistory = async (patientId: string): Promise<SavedRiskEvaluation[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/risk/history/${patientId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch risk history');
    }
    throw error;
  }
}; 