import axios from 'axios';
import { Prescription, PrescriptionFormData, PrescriptionHistory, PrescriptionStats } from '../types/prescriptions';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const prescriptionService = {
  // Get all prescriptions for a patient
  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    const response = await axios.get(`${API_BASE_URL}/prescriptions`, {
      params: { patientId },
    });
    return response.data;
  },

  // Get a single prescription by ID
  async getPrescription(id: string): Promise<Prescription> {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/${id}`);
    return response.data;
  },

  // Create a new prescription
  async createPrescription(prescription: Omit<Prescription, 'id'>): Promise<Prescription> {
    const response = await axios.post(`${API_BASE_URL}/prescriptions`, prescription);
    return response.data;
  },

  // Update an existing prescription
  async updatePrescription(id: string, prescription: Partial<Prescription>): Promise<Prescription> {
    const response = await axios.put(`${API_BASE_URL}/prescriptions/${id}`, prescription);
    return response.data;
  },

  // Delete a prescription
  async deletePrescription(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/prescriptions/${id}`);
  },

  // Get prescription history
  async getPrescriptionHistory(id: string): Promise<Prescription[]> {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/${id}/history`);
    return response.data;
  },

  // Get active prescriptions for a patient
  getActivePrescriptions: async (patientId: string): Promise<Prescription[]> => {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/patient/${patientId}/active`);
    return response.data;
  },

  // Get prescription statistics
  getPrescriptionStats: async (patientId: string): Promise<PrescriptionStats> => {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/patient/${patientId}/stats`);
    return response.data;
  },

  // Search prescriptions
  searchPrescriptions: async (patientId: string, query: string): Promise<Prescription[]> => {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/search`, {
      params: {
        patientId,
        query,
      },
    });
    return response.data;
  },
};

export default prescriptionService; 