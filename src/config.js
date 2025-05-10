// Application configuration
const config = {
  // API URLs
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'ws://localhost:8000/ws',
  
  // Application information
  APP_TITLE: 'DentaMind',
  APP_DESCRIPTION: 'AI-Powered Dental Practice Management System',
  APP_VERSION: '1.0.0',
  
  // Feature flags
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
  ENABLE_AI_FEATURES: true,
  
  // Authentication
  AUTH_TOKEN_KEY: 'dentamind_token',
  AUTH_REFRESH_KEY: 'dentamind_refresh_token',
  
  // Other settings
  DEFAULT_PAGINATION_LIMIT: 25,
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',
  
  // Notification settings
  NOTIFICATION_TIMEOUT: 5000, // in milliseconds
};

export default config; 