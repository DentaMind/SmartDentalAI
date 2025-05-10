import axios from 'axios';
import { API_BASE_URL } from '../../../config/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/patient-intake`,
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const intakeAIService = {
  // Get AI suggestions for intake form
  getAISuggestions: async (patientId: string, currentFormData: any) => {
    try {
      const response = await api.post(`/${patientId}/ai-suggest`, { current_form_data: currentFormData });
      return response.data;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  },
  
  // Save AI feedback (for training)
  submitAIFeedback: async (patientId: string, suggestionId: string, feedback: { isHelpful: boolean, comments?: string }) => {
    try {
      const response = await api.post(`/${patientId}/ai-feedback/${suggestionId}`, feedback);
      return response.data;
    } catch (error) {
      console.error('Error submitting AI feedback:', error);
      throw error;
    }
  }
};
