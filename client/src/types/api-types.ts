/**
 * API Client Types
 * 
 * This file contains TypeScript types for the API client to ensure proper usage
 * throughout the application.
 */

/**
 * API Client interface
 * Defines the methods available on the API client
 */
export interface APIClient {
  get: <T = any>(endpoint: string) => Promise<T>;
  post: <T = any>(endpoint: string, data: any) => Promise<T>;
  put: <T = any>(endpoint: string, data: any) => Promise<T>;
  delete: <T = any>(endpoint: string) => Promise<T>;
}

/**
 * Authentication API interface
 */
export interface AuthAPIClient {
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  register: (userData: any) => Promise<any>;
  getCurrentUser: () => Promise<any>;
  isAuthenticated: () => boolean;
  refreshToken: () => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  getProfile: () => Promise<any>;
}

/**
 * Health API interface
 */
export interface HealthAPIClient {
  getStatus: () => Promise<any>;
}

/**
 * Type guard to check if an object is a valid API client
 */
export function isAPIClient(obj: any): obj is APIClient {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.get === 'function' &&
    typeof obj.post === 'function' &&
    typeof obj.put === 'function' &&
    typeof obj.delete === 'function'
  );
}

/**
 * Common API response types
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  status?: number;
  details?: unknown;
}

/**
 * AI Metrics API response
 */
export interface AIMetricsResponse {
  totalInferences: number;
  averageLatency: number;
  successRate: number;
  averageConfidence: number;
  modelUsage: Record<string, number>;
  feedbackSummary: {
    accepted: number;
    modified: number;
    rejected: number;
  };
  inferencesByType: Record<string, number>;
  dailyInferences: Record<string, number>;
}

/**
 * Database Health API response
 */
export interface DbHealthResponse {
  status: string;
  tables: {
    status: string;
    expected_tables: string[];
    actual_tables: string[];
    missing_tables: string[];
    unexpected_tables: string[];
  };
  foreign_keys: {
    status: string;
    total_foreign_keys: number;
    broken_foreign_keys: Array<{
      table: string;
      column: string;
      ref_table: string;
      ref_column: string;
      issue?: string;
    }>;
  };
  indexes: {
    status: string;
    missing_indexes: Array<{
      table: string;
      column: string;
      description?: string;
      recommended?: boolean;
    }>;
  };
  issues: string[];
  check_duration_ms: number;
  last_check_time: string | null;
  is_stale: boolean;
  error?: string;
} 