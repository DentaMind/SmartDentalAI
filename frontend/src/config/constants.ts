// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Authentication
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';
export const AUTH_REFRESH_KEY = 'refresh_token';

// Feature flags
export const FEATURE_AI_DIAGNOSTICS = process.env.REACT_APP_FEATURE_AI_DIAGNOSTICS === 'true';
export const FEATURE_PERIO_CHART = process.env.REACT_APP_FEATURE_PERIO_CHART === 'true';
export const FEATURE_TREATMENT_SUGGESTIONS = process.env.REACT_APP_FEATURE_TREATMENT_SUGGESTIONS === 'true';

// File limits
export const MAX_UPLOAD_SIZE = 15 * 1024 * 1024; // 15 MB

// App routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAIL: (id: string) => `/patients/${id}`,
  TREATMENT_PLANS: '/treatment-plans',
  TREATMENT_PLAN_DETAIL: (id: string) => `/treatment-plans/${id}`,
  AI_DIAGNOSTICS: '/ai-diagnostics',
  PERIO_CHART: (patientId: string) => `/patients/${patientId}/perio-chart`,
  SETTINGS: '/settings',
};

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1; 