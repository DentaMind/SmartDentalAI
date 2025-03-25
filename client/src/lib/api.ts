
import axios from 'axios';

// Create an axios instance with default configurations
export const api = axios.create({
  baseURL: '/',
  timeout: 10000, // Reduced timeout to avoid long-running requests
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Include cookies with cross-origin requests
});

/**
 * Generic API request helper function for data mutations
 * @param url The API endpoint URL
 * @param method The HTTP method (POST, PUT, PATCH, DELETE)
 * @param data Optional data payload
 * @returns The API response data
 */
export const apiRequest = async (url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', data?: any) => {
  try {
    const response = await api({
      url,
      method,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`API ${method} request failed:`, error);
    throw error;
  }
};

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
    // Check if it's a valid axios error
    if (axios.isAxiosError(error)) {
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
      
      // Handle timeout errors appropriately
      if (error.code === 'ECONNABORTED') {
        console.warn('API request timed out:', error.config?.url);
      }
      
      // Create a standardized error message
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'An unknown error occurred';
      
      // Add the error message to the error object for more readable access
      error.displayMessage = errorMessage;
      
      console.error('API Error:', errorMessage);
    } else {
      // Handle non-Axios errors
      console.error('Non-Axios error occurred:', error);
      if (error instanceof Error) {
        error.displayMessage = error.message;
      } else {
        error.displayMessage = 'Unknown error occurred';
      }
    }
    
    return Promise.reject(error);
  }
);
