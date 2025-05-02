import axios from 'axios';
import { API_URL } from '../config/constants';

export interface ClientMetricsSummary {
  client_count: number;
  avg_latency: number;
  connection_stability: number;
  error_rate: number;
  start_time: string;
  end_time: string;
}

export interface GeographicMetric {
  region: string;
  country: string;
  client_count: number;
  avg_latency: number;
  connection_success_rate: number;
}

export interface AnomalySummary {
  total_anomalies: number;
  severity_counts: {
    low: number;
    medium: number;
    high: number;
  };
  metrics: {
    [metric: string]: {
      count: number;
      avg_deviation: number;
    }
  };
  start_time: string;
  end_time: string;
}

export interface Correlation {
  correlations: {
    latency_vs_page_load: number;
    error_rate_vs_ux_errors: number;
    drops_vs_interactions: number;
  };
  time_series: Array<{
    timestamp: string;
    websocket: {
      avg_latency: number;
      error_rate: number;
      connection_drops: number;
    };
    ux: {
      page_load_time: number;
      user_interactions: number;
      error_count: number;
    }
  }>;
  insights: string[];
  start_time: string;
  end_time: string;
}

class WebSocketClientMetricsService {
  /**
   * Get a summary of client-side WebSocket metrics
   * 
   * @param startTime Optional start time ISO string
   * @param endTime Optional end time ISO string
   * @returns Client metrics summary
   */
  async getClientMetricsSummary(startTime?: string, endTime?: string): Promise<ClientMetricsSummary> {
    let url = `${API_URL}/ws/client-metrics/summary`;
    
    // Add query parameters if specified
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  }
  
  /**
   * Get geographic distribution of WebSocket metrics
   * 
   * @returns Geographic metrics
   */
  async getGeographicDistribution(): Promise<GeographicMetric[]> {
    const response = await axios.get(`${API_URL}/ws/client-metrics/geographic`);
    return response.data;
  }
  
  /**
   * Get anomalies summary
   * 
   * @returns Anomalies summary
   */
  async getAnomaliesSummary(): Promise<AnomalySummary> {
    const response = await axios.get(`${API_URL}/ws/client-metrics/anomalies`);
    return response.data;
  }
  
  /**
   * Get correlation between WebSocket metrics and user experience
   * 
   * @param startTime Optional start time ISO string
   * @param endTime Optional end time ISO string
   * @returns Correlation data
   */
  async getUXCorrelation(startTime?: string, endTime?: string): Promise<Correlation> {
    let url = `${API_URL}/ws/client-metrics/ux-correlation`;
    
    // Add query parameters if specified
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  }
}

export const websocketClientMetricsService = new WebSocketClientMetricsService(); 