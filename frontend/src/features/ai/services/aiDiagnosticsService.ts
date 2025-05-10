import { API_URL } from '../config/constants';

// Types for API responses
export interface ModelInfo {
  model_name: string;
  model_version: string;
  last_seen: string;
}

export interface ModelsResponse {
  models: ModelInfo[];
  count: number;
}

export interface PerformanceTrend {
  timestamp: string;
  value: number;
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  total_requests: number;
  avg_inference_time_ms: number;
  avg_confidence_score: number;
  error_rate: number;
  clinician_agreement_rate: number;
  data_points: number;
  performance_trend: PerformanceTrend[];
  confidence_trend: PerformanceTrend[];
  error_trend: PerformanceTrend[];
  anomalies: {
    total: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
    by_metric: Record<string, number>;
  };
}

export interface MetricsSummary {
  time_range: {
    start: string;
    end: string;
  };
  models: ModelMetrics[];
  total_models: number;
  total_requests: number;
  anomalies: {
    total: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

export interface RegionMetrics {
  region: string;
  country: string;
  request_count: number;
  avg_inference_time_ms: number;
  avg_confidence_score: number;
  avg_error_rate: number;
}

export interface AnomalyData {
  time_range: {
    start: string;
    end: string;
  };
  total_anomalies: number;
  by_severity: {
    low: number;
    medium: number;
    high: number;
  };
  by_metric: Record<string, {
    count: number;
    avg_deviation: number;
  }>;
  by_model: Array<{
    model_name: string;
    model_version: string;
    count: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
    by_metric: Record<string, number>;
  }>;
  time_series: Array<{
    timestamp: string;
    request_count: number;
    avg_inference_time_ms: number;
    avg_confidence_score: number;
    error_rate: number;
  }>;
}

export interface CorrelationData {
  correlation_type: string;
  correlation_value: number;
  sample_size: number;
  p_value: number | null;
  confidence_interval: string | null;
  timestamp: string;
  description: string | null;
}

export interface ClinicalCorrelation {
  models: Array<{
    model_name: string;
    model_version: string;
    by_diagnostic: Record<string, CorrelationData[]>;
    by_correlation: Record<string, CorrelationData[]>;
  }>;
  total_correlations: number;
  diagnostic_types: string[];
  correlation_types: string[];
}

class AIDiagnosticsService {
  private static instance: AIDiagnosticsService;
  private token: string | null = null;
  
  private constructor() {
    // Initialize from localStorage if available
    this.token = localStorage.getItem('token');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AIDiagnosticsService {
    if (!AIDiagnosticsService.instance) {
      AIDiagnosticsService.instance = new AIDiagnosticsService();
    }
    return AIDiagnosticsService.instance;
  }
  
  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }
  
  /**
   * Get available AI diagnostic models
   */
  public async getModels(): Promise<ModelsResponse> {
    try {
      const response = await fetch(`${API_URL}/api/ai/diagnostics/models`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch AI diagnostic models:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics summary
   */
  public async getMetricsSummary(startTime?: string, endTime?: string): Promise<MetricsSummary> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startTime) params.append('start_time', startTime);
      if (endTime) params.append('end_time', endTime);
      
      const response = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/summary?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching metrics summary: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch AI diagnostic metrics summary:', error);
      throw error;
    }
  }
  
  /**
   * Get geographic metrics
   */
  public async getGeographicMetrics(
    modelName?: string,
    startTime?: string,
    endTime?: string
  ): Promise<RegionMetrics[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (modelName) params.append('model_name', modelName);
      if (startTime) params.append('start_time', startTime);
      if (endTime) params.append('end_time', endTime);
      
      const response = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/geographic?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching geographic metrics: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch geographic metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get anomaly summary
   */
  public async getAnomaliesSummary(modelName?: string, days: number = 1): Promise<AnomalyData> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (modelName) params.append('model_name', modelName);
      params.append('days', days.toString());
      
      const response = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/anomalies?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching anomalies: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch anomalies summary:', error);
      throw error;
    }
  }
  
  /**
   * Get clinical correlations
   */
  public async getClinicalCorrelations(
    modelName?: string,
    diagnosticType?: string,
    correlationType?: string
  ): Promise<ClinicalCorrelation> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (modelName) params.append('model_name', modelName);
      if (diagnosticType) params.append('diagnostic_type', diagnosticType);
      if (correlationType) params.append('correlation_type', correlationType);
      
      const response = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/correlations?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching clinical correlations: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch clinical correlations:', error);
      throw error;
    }
  }
  
  /**
   * Submit clinical correlation
   */
  public async submitClinicalCorrelation(correlationData: {
    model_name: string;
    model_version: string;
    diagnostic_type: string;
    correlation_type: string;
    correlation_value: number;
    sample_size: number;
    p_value?: number;
    confidence_interval?: string;
    study_period_start?: string;
    study_period_end?: string;
    description?: string;
    correlation_data?: Record<string, any>;
  }): Promise<{ success: boolean; correlation_id: number; message: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_URL}/api/ai/diagnostics/correlations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correlationData),
      });
      
      if (!response.ok) {
        throw new Error(`Error submitting correlation: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to submit clinical correlation:', error);
      throw error;
    }
  }
}

export default AIDiagnosticsService; 