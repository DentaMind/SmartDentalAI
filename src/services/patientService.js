import { useAuth } from '../contexts/AuthContext';
import config from '../config';

// Custom hook for patient API calls
export const usePatientService = () => {
  const { authAxios } = useAuth();
  
  // Get all patients (with pagination)
  const getAllPatients = async (page = 1, limit = config.DEFAULT_PAGINATION_LIMIT) => {
    try {
      const response = await authAxios.get('/patients', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  };
  
  // Get a specific patient by ID
  const getPatient = async (patientId) => {
    try {
      const response = await authAxios.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Search patients by name, email, phone, or patient ID
  const searchPatients = async (query) => {
    try {
      const response = await authAxios.get('/patients/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching patients with query "${query}":`, error);
      throw error;
    }
  };
  
  // Create a new patient
  const createPatient = async (patientData) => {
    try {
      const response = await authAxios.post('/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  };
  
  // Update an existing patient
  const updatePatient = async (patientId, patientData) => {
    try {
      const response = await authAxios.put(`/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Delete a patient (usually soft delete)
  const deletePatient = async (patientId) => {
    try {
      const response = await authAxios.delete(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Get patient medical history
  const getPatientMedicalHistory = async (patientId) => {
    try {
      const response = await authAxios.get(`/patients/${patientId}/medical-history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching medical history for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Update patient medical history
  const updatePatientMedicalHistory = async (patientId, historyData) => {
    try {
      const response = await authAxios.put(`/patients/${patientId}/medical-history`, historyData);
      return response.data;
    } catch (error) {
      console.error(`Error updating medical history for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Get patient insurance information
  const getPatientInsurance = async (patientId) => {
    try {
      const response = await authAxios.get(`/patients/${patientId}/insurance`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching insurance info for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Update patient insurance information
  const updatePatientInsurance = async (patientId, insuranceData) => {
    try {
      const response = await authAxios.put(`/patients/${patientId}/insurance`, insuranceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating insurance info for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Get patient dental chart
  const getPatientDentalChart = async (patientId) => {
    try {
      const response = await authAxios.get(`/patients/${patientId}/dental-chart`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching dental chart for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Get patient periodontal chart
  const getPatientPerioChart = async (patientId, date = null) => {
    try {
      const params = date ? { date } : {};
      const response = await authAxios.get(`/patients/${patientId}/perio-chart`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching periodontal chart for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Save patient periodontal chart
  const savePatientPerioChart = async (patientId, chartData) => {
    try {
      const response = await authAxios.post(`/patients/${patientId}/perio-chart`, chartData);
      return response.data;
    } catch (error) {
      console.error(`Error saving periodontal chart for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  return {
    getAllPatients,
    getPatient,
    searchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientMedicalHistory,
    updatePatientMedicalHistory,
    getPatientInsurance,
    updatePatientInsurance,
    getPatientDentalChart,
    getPatientPerioChart,
    savePatientPerioChart
  };
}; 