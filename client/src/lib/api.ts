/**
 * API Services for DentaMind Platform
 * Connects to the backend microservices for auth, patient, and imaging functionality
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '../config/api';

// API Endpoints can be configured based on environment
const API_BASE = {
  AUTH: process.env.AUTH_API || 'http://localhost:8085',
  PATIENT: process.env.PATIENT_API || 'http://localhost:8086',
  IMAGING: process.env.IMAGING_API || 'http://localhost:8087',
  DEBUG: process.env.DEBUG_API || 'http://localhost:8092',
};

// Create axios instances for each service
const authAPI = axios.create({
  baseURL: API_BASE.AUTH,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const patientAPI = axios.create({
  baseURL: API_BASE.PATIENT,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const imagingAPI = axios.create({
  baseURL: API_BASE.IMAGING,
  timeout: 30000, // Longer timeout for image uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

const debugAPI = axios.create({
  baseURL: API_BASE.DEBUG,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add auth token to requests when available
const updateAuthToken = (token: string | null) => {
  const authHeader = token ? `Bearer ${token}` : '';
  authAPI.defaults.headers.common['Authorization'] = authHeader;
  patientAPI.defaults.headers.common['Authorization'] = authHeader;
  imagingAPI.defaults.headers.common['Authorization'] = authHeader;
  debugAPI.defaults.headers.common['Authorization'] = authHeader;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_ENDPOINTS.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add authorization header to requests when token is available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle common response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API Service
export const AuthAPI = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await apiClient.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    return apiClient.get('/users/me');
  },
  
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await authAPI.post('/refresh', { refresh_token: refreshToken });
      
      // Update stored token
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      updateAuthToken(access_token);
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
};

// Patient API Service
export const PatientAPI = {
  getPatients: async (page = 1, limit = 10) => {
    try {
      const response = await patientAPI.get('/patients', {
        params: { offset: (page - 1) * limit, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get patients error:', error);
      // If real API fails, try debug API as fallback in development
      if (process.env.NODE_ENV === 'development') {
        const fallbackResponse = await debugAPI.get('/api/patients/sample');
        return fallbackResponse.data;
      }
      throw error;
    }
  },
  
  getPatient: async (patientId: string) => {
    try {
      const response = await patientAPI.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Get patient ${patientId} error:`, error);
      // Use debug API as fallback
      if (process.env.NODE_ENV === 'development') {
        // Return a mock patient from sample data
        const patientsResponse = await debugAPI.get('/api/patients/sample');
        const patients = patientsResponse.data;
        return { 
          id: patientId, 
          first_name: "Test", 
          last_name: "Patient",
          date_of_birth: "1980-01-15T00:00:00",
          email: "patient@example.com",
          phone: "555-123-4567",
          medical_history: {
            conditions: ["Hypertension"],
            allergies: ["Penicillin"]
          }
        };
      }
      throw error;
    }
  },
  
  getPatientAppointments: async (patientId: string) => {
    try {
      const response = await patientAPI.get(`/patients/${patientId}/appointments`);
      return response.data;
    } catch (error) {
      console.error(`Get patient appointments error:`, error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return [
          {
            id: "appt-1",
            date: "2023-06-15",
            time: "10:00 AM",
            type: "Regular Checkup",
            status: "confirmed"
          },
          {
            id: "appt-2",
            date: "2023-07-20",
            time: "2:30 PM",
            type: "Cleaning",
            status: "pending"
          }
        ];
      }
      throw error;
    }
  },
  
  searchPatients: async (query: string) => {
    try {
      const response = await patientAPI.get('/search/patients', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Search patients error:', error);
      throw error;
    }
  },
  
  getSamplePatients: async () => {
    return apiClient.get('/api/patients/sample');
  }
};

// Imaging API Service
export const ImagingAPI = {
  uploadImage: async (file: File, patientId: string, imageType: string, notes?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('image_type', imageType);
    if (notes) formData.append('notes', notes);
    
    return apiClient.post('/api/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  uploadFMX: async (file: File, patientId: string, notes?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      if (notes) formData.append('notes', notes);
      
      const response = await imagingAPI.post('/api/image/fmx/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload FMX error:', error);
      throw error;
    }
  },
  
  uploadPanoramic: async (file: File, patientId: string, notes?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      if (notes) formData.append('notes', notes);
      
      const response = await imagingAPI.post('/api/image/panoramic/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload panoramic error:', error);
      throw error;
    }
  },
  
  uploadCBCT: async (file: File, patientId: string, region: string, notes?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      formData.append('region', region);
      if (notes) formData.append('notes', notes);
      
      const response = await imagingAPI.post('/api/image/cbct/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload CBCT error:', error);
      throw error;
    }
  },
  
  getPatientImages: async (patientId: string) => {
    try {
      const response = await imagingAPI.get(`/api/image/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Get patient images error:`, error);
      
      // Fallback to debug API in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const fallbackResponse = await debugAPI.get(`/api/image/history/${patientId}`);
          return fallbackResponse.data;
        } catch (fallbackError) {
          console.error('Debug API fallback error:', fallbackError);
          // Return empty array if even the fallback fails
          return [];
        }
      }
      
      return [];
    }
  },
  
  getImageDiagnosis: async (imageId: string) => {
    try {
      const response = await imagingAPI.get(`/api/image/analysis/${imageId}`);
      return response.data;
    } catch (error) {
      console.error(`Get image diagnosis error:`, error);
      
      // Fallback to debug API
      if (process.env.NODE_ENV === 'development') {
        const sampleResponse = await debugAPI.get('/api/diagnose/sample');
        return {
          id: imageId,
          timestamp: new Date().toISOString(),
          findings: sampleResponse.data.findings,
          summary: "Sample diagnosis generated by debug API."
        };
      }
      
      throw error;
    }
  },
  
  getImageHistory: async (patientId: string) => {
    return apiClient.get(`/api/image/history/${patientId}`);
  }
};

// Initialize auth from local storage
const storedToken = localStorage.getItem('token');
if (storedToken) {
  updateAuthToken(storedToken);
}

// Diagnosis API
export const DiagnosisAPI = {
  analyzeXray: async (file: File, patientId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    
    return apiClient.post('/api/diagnose/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  getDiagnosisHistory: async (patientId: string) => {
    return apiClient.get(`/api/diagnose/history/${patientId}`);
  }
};

// Treatment API
export const TreatmentAPI = {
  getTreatmentPlans: async (patientId: string) => {
    return apiClient.get(`/api/treatment/treatment-plans/patient/${patientId}`);
  }
};

// Prescriptions API
export const PrescriptionsAPI = {
  getPrescriptions: async (patientId: string) => {
    return apiClient.get(`/api/prescriptions/patient/${patientId}`);
  }
};

// Perio API
export const PerioAPI = {
  getPerioCharts: async (patientId: string) => {
    return apiClient.get(`/api/perio/patients/${patientId}/charts`);
  }
};

// Risk API
export const RiskAPI = {
  getRiskHistory: async (patientId: string) => {
    return apiClient.get(`/api/risk/history/${patientId}`);
  }
};

// Knowledge API
export const KnowledgeAPI = {
  getCategories: async () => {
    return apiClient.get('/api/knowledge/categories');
  }
};

export default {
  AuthAPI,
  PatientAPI,
  ImagingAPI,
  DiagnosisAPI,
  TreatmentAPI,
  PrescriptionsAPI,
  PerioAPI,
  RiskAPI,
  KnowledgeAPI
};
