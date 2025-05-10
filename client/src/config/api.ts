/**
 * API Configuration for DentaMind Platform
 */

// Determine the environment
const isDevelopment = process.env.NODE_ENV === 'development';

// API URLs based on environment
export const API_ENDPOINTS = {
  // Main URLs
  API_URL: isDevelopment 
    ? 'http://localhost:8001' 
    : process.env.REACT_APP_API_URL || 'https://api.dentamind.com',
  
  // Debug URL (only used in development)
  DEBUG_API_URL: 'http://localhost:3000',
  
  // Auth endpoints
  AUTH: {
    LOGIN: '/token',
    LOGOUT: '/logout',
    CURRENT_USER: '/users/me',
    REFRESH_TOKEN: '/refresh',
  },
  
  // Patient endpoints
  PATIENT: {
    GET_ALL: '/api/patients',
    GET_BY_ID: (id: string) => `/api/patients/${id}`,
    SEARCH: '/api/patients/search',
    SAMPLE: '/api/patients/sample',
  },
  
  // Image endpoints
  IMAGE: {
    UPLOAD: '/api/image/upload',
    GET_BY_PATIENT: (patientId: string) => `/api/image/history/${patientId}`,
    ANALYSIS: (imageId: string) => `/api/image/analysis/${imageId}`,
  },
  
  // Diagnosis endpoints
  DIAGNOSIS: {
    ANALYZE: '/api/diagnose/analyze',
    HISTORY: (patientId: string) => `/api/diagnose/history/${patientId}`,
  },
  
  // Treatment endpoints
  TREATMENT: {
    PLANS: (patientId: string) => `/api/treatment/treatment-plans/patient/${patientId}`,
  },
  
  // Prescription endpoints
  PRESCRIPTION: {
    GET_BY_PATIENT: (patientId: string) => `/api/prescriptions/patient/${patientId}`,
  },
  
  // Perio endpoints
  PERIO: {
    CHARTS: (patientId: string) => `/api/perio/patients/${patientId}/charts`,
  },
  
  // Risk endpoints
  RISK: {
    HISTORY: (patientId: string) => `/api/risk/history/${patientId}`,
  },
  
  // Knowledge endpoints
  KNOWLEDGE: {
    CATEGORIES: '/api/knowledge/categories',
  },
};

export default API_ENDPOINTS;
