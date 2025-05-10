import axios from 'axios';

// Configure the base URL for API requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for Patient Intake endpoints

/**
 * Register a new patient with medical history
 */
export const registerPatient = async (patientData: any) => {
  try {
    const response = await apiClient.post('/api/patient-intake/register', patientData);
    return response.data;
  } catch (error) {
    console.error('Error registering patient:', error);
    throw error;
  }
};

/**
 * Get a patient's medical profile
 */
export const getPatientMedicalProfile = async (patientId: string) => {
  try {
    const response = await apiClient.get(`/api/patient-intake/patient/${patientId}/medical-profile`);
    return response.data;
  } catch (error) {
    console.error(`Error getting medical profile for patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Update a patient's medical history
 */
export const updateMedicalHistory = async (patientId: string, medicalData: any) => {
  try {
    const response = await apiClient.put(`/api/patient-intake/patient/${patientId}/medical-history`, medicalData);
    return response.data;
  } catch (error) {
    console.error(`Error updating medical history for patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Add allergies to a patient's record
 */
export const addPatientAllergies = async (patientId: string, allergies: any[]) => {
  try {
    const response = await apiClient.post(`/api/patient-intake/patient/${patientId}/allergies`, allergies);
    return response.data;
  } catch (error) {
    console.error(`Error adding allergies for patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Add medications to a patient's record
 */
export const addPatientMedications = async (patientId: string, medications: any[]) => {
  try {
    const response = await apiClient.post(`/api/patient-intake/patient/${patientId}/medications`, medications);
    return response.data;
  } catch (error) {
    console.error(`Error adding medications for patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Get medical alerts for a patient
 */
export const getPatientAlerts = async (patientId: string) => {
  try {
    const response = await apiClient.get(`/api/patient-intake/patient/${patientId}/alerts`);
    return response.data;
  } catch (error) {
    console.error(`Error getting alerts for patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Check if a patient is allergic to a specific medication
 */
export const checkMedicationAllergies = async (patientId: string, medicationName: string) => {
  try {
    const response = await apiClient.post('/api/patient-intake/check-medication-allergies', null, {
      params: { patient_id: patientId, medication_name: medicationName }
    });
    return response.data;
  } catch (error) {
    console.error(`Error checking medication allergies for patient ${patientId}:`, error);
    throw error;
  }
};

export default {
  registerPatient,
  getPatientMedicalProfile,
  updateMedicalHistory,
  addPatientAllergies,
  addPatientMedications,
  getPatientAlerts,
  checkMedicationAllergies,
}; 