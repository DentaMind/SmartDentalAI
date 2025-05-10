import { useAuth } from '../contexts/AuthContext';
import config from '../config';

// Custom hook for treatment plan API calls
export const useTreatmentPlanService = () => {
  const { authAxios } = useAuth();
  
  // Get all treatment plans
  const getAllTreatmentPlans = async () => {
    try {
      const response = await authAxios.get('/treatment-plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
      throw error;
    }
  };
  
  // Get treatment plans for a specific patient
  const getPatientTreatmentPlans = async (patientId) => {
    try {
      const response = await authAxios.get(`/treatment-plans/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching treatment plans for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  // Get a specific treatment plan by ID
  const getTreatmentPlan = async (planId) => {
    try {
      const response = await authAxios.get(`/treatment-plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching treatment plan ${planId}:`, error);
      throw error;
    }
  };
  
  // Create a new treatment plan
  const createTreatmentPlan = async (planData) => {
    try {
      const response = await authAxios.post('/treatment-plans', planData);
      return response.data;
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      throw error;
    }
  };
  
  // Update an existing treatment plan
  const updateTreatmentPlan = async (planId, planData) => {
    try {
      const response = await authAxios.put(`/treatment-plans/${planId}`, planData);
      return response.data;
    } catch (error) {
      console.error(`Error updating treatment plan ${planId}:`, error);
      throw error;
    }
  };
  
  // Delete a treatment plan
  const deleteTreatmentPlan = async (planId) => {
    try {
      const response = await authAxios.delete(`/treatment-plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting treatment plan ${planId}:`, error);
      throw error;
    }
  };
  
  // Add an attachment to a visit
  const addVisitAttachment = async (planId, visitId, file, metadata = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await authAxios.post(
        `/treatment-plans/${planId}/visits/${visitId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error adding attachment to visit ${visitId}:`, error);
      throw error;
    }
  };
  
  // Get AI treatment suggestions
  const getAITreatmentSuggestions = async (patientId, diagnosisData = {}) => {
    try {
      const response = await authAxios.post('/ai/treatment-suggestions', {
        patient_id: patientId,
        diagnosis_data: diagnosisData
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting AI treatment suggestions for patient ${patientId}:`, error);
      throw error;
    }
  };
  
  return {
    getAllTreatmentPlans,
    getPatientTreatmentPlans,
    getTreatmentPlan,
    createTreatmentPlan,
    updateTreatmentPlan,
    deleteTreatmentPlan,
    addVisitAttachment,
    getAITreatmentSuggestions
  };
}; 