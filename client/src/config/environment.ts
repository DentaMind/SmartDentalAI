/**
 * Environment Configuration
 * 
 * Contains environment-specific settings and utility functions.
 */

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || (
  isProduction
    ? 'https://api.dentamind.com/api'
    : isDevelopment
      ? '/api' // Use relative path in development for proxy
      : 'http://localhost:8000/api'
);

// WebSocket configuration
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || (
  isProduction
    ? 'wss://api.dentamind.com/ws'
    : isDevelopment
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
      : 'ws://localhost:8000/ws'
);

/**
 * Get the base URL for API requests
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Get the base URL for WebSocket connections
 */
export function getWebSocketUrl(): string {
  return WS_BASE_URL;
}

/**
 * Get a full API URL for a given path
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${base}/${cleanPath}`;
}

/**
 * Get a full WebSocket URL for a given path
 */
export function getWebSocketEndpointUrl(path: string): string {
  const base = getWebSocketUrl();
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${base}/${cleanPath}`;
}

// Feature flags (for development)
export const FEATURES = {
  enableWebSockets: true,
  enableNotifications: true,
  enableApiLogging: isDevelopment,
  enableWebSocketMonitoring: isDevelopment,
  useLocalStorage: true,
  useServiceWorker: isProduction,
  useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true' || false
};

// Timeouts and intervals
export const TIMEOUTS = {
  apiRequest: 30000, // 30 seconds
  webSocketReconnect: 5000, // 5 seconds
  webSocketPing: 30000, // 30 seconds
  tokenRefresh: 300000, // 5 minutes
  notificationDisplay: 5000 // 5 seconds
};

export default {
  isDevelopment,
  isProduction,
  isTest,
  API_BASE_URL,
  WS_BASE_URL,
  getApiBaseUrl,
  getWebSocketUrl,
  getApiUrl,
  getWebSocketEndpointUrl,
  FEATURES,
  TIMEOUTS
}; 