import axios from 'axios';
import { Case, AIAnalysis, DoctorAnalysis } from '../types/case';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const caseService = {
  // Cases
  createCase: async (data: {
    patient_id: string;
    title: string;
    description: string;
  }): Promise<Case> => {
    const response = await axios.post(`${API_BASE_URL}/cases`, data);
    return response.data;
  },

  getCase: async (caseId: string): Promise<Case> => {
    const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`);
    return response.data;
  },

  getDoctorCases: async (): Promise<Case[]> => {
    const response = await axios.get(`${API_BASE_URL}/cases/doctor`);
    return response.data;
  },

  getAllCases: async (): Promise<Case[]> => {
    const response = await axios.get(`${API_BASE_URL}/cases`);
    return response.data;
  },

  // AI Analysis
  startAIAnalysis: async (caseId: string): Promise<Case> => {
    const response = await axios.post(`${API_BASE_URL}/cases/${caseId}/ai-analysis/start`);
    return response.data;
  },

  updateAIAnalysis: async (caseId: string, data: {
    diagnosis: string;
    confidence: number;
    suggestions: string[];
  }): Promise<Case> => {
    const response = await axios.post(`${API_BASE_URL}/cases/${caseId}/ai-analysis`, data);
    return response.data;
  },

  // Doctor Analysis
  submitDoctorAnalysis: async (caseId: string, data: {
    diagnosis: string;
    treatment_plan: string;
    notes?: string;
  }): Promise<Case> => {
    const response = await axios.post(`${API_BASE_URL}/cases/${caseId}/doctor-analysis`, data);
    return response.data;
  }
}; 