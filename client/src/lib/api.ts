
import axios from 'axios';

// Create an axios instance with default configurations
export const api = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Include cookies with cross-origin requests
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Any request modification can go here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Any successful response modification can go here
    return response;
  },
  (error) => {
    // Handle authentication errors globally
    if (error.response && error.response.status === 401) {
      // Only redirect if we're not already on the auth page and not in a redirect loop
      if (!window.location.pathname.includes('/auth') && sessionStorage.getItem("inAuthPage") !== "true") {
        console.log('Not authenticated, redirecting to auth page');
        sessionStorage.setItem("inAuthPage", "true");
        window.location.href = '/auth';
      } else {
        console.log('Already on auth page or redirecting prevented');
      }
    }
    
    // Create a standardized error message
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'An unknown error occurred';
    
    // Add the error message to the error object
    error.displayMessage = errorMessage;
    
    console.error('API Error:', errorMessage);
    
    return Promise.reject(error);
  }
);
