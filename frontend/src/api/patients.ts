import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  email?: string;
  phone?: string;
  status: string;
  lastVisit?: string;
  treatmentStatus: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  name: string;
  dob: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface PatientUpdate {
  name?: string;
  dob?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface TreatmentStatusUpdate {
  status: string;
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/patients`,
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

export const patientApi = {
  // Get all patients with optional filtering
  getPatients: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/', { params });
    return response.data as Patient[];
  },

  // Get a single patient by ID
  getPatient: async (patientId: string) => {
    const response = await api.get(`/${patientId}`);
    return response.data as Patient;
  },

  // Create a new patient
  createPatient: async (patientData: PatientCreate) => {
    const response = await api.post('/', patientData);
    return response.data as Patient;
  },

  // Update a patient
  updatePatient: async (patientId: string, patientData: PatientUpdate) => {
    const response = await api.put(`/${patientId}`, patientData);
    return response.data as Patient;
  },

  // Update a patient's treatment status
  updateTreatmentStatus: async (patientId: string, statusData: TreatmentStatusUpdate) => {
    const response = await api.patch(`/${patientId}/treatment-status`, statusData);
    return response.data as Patient;
  },

  // Mark a patient as inactive (soft delete)
  deletePatient: async (patientId: string) => {
    const response = await api.delete(`/${patientId}`);
    return response.data;
  },
}; 