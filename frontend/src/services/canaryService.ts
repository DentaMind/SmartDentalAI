import axios from 'axios';

export interface CanaryConfig {
  traffic_percentage: number;
  duration_minutes: number;
  success_threshold: number;
  metrics_to_monitor: string[];
  max_error_rate: number;
  min_requests: number;
}

export interface CanaryMetrics {
  request_count: number;
  error_count: number;
  error_rate: number;
  latency_ms: number;
  model_metrics: Record<string, number>;
}

export interface CanaryStatus {
  version: string;
  status: string;
  start_time: string;
  config: CanaryConfig;
  latest_metrics: CanaryMetrics | null;
}

export const canaryService = {
  async getCanaries(): Promise<CanaryStatus[]> {
    try {
      const response = await axios.get('/api/canaries');
      return response.data;
    } catch (error) {
      console.error('Error fetching canary deployments:', error);
      throw error;
    }
  },

  async getCanary(version: string): Promise<CanaryStatus> {
    try {
      const response = await axios.get(`/api/canaries/${version}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching canary deployment for version ${version}:`, error);
      throw error;
    }
  },

  async startCanary(version: string, config?: CanaryConfig): Promise<void> {
    try {
      await axios.post(`/api/canaries/${version}/start`, config);
    } catch (error) {
      console.error(`Error starting canary deployment for version ${version}:`, error);
      throw error;
    }
  },

  async promoteCanary(version: string): Promise<void> {
    try {
      await axios.post(`/api/canaries/${version}/promote`);
    } catch (error) {
      console.error(`Error promoting canary deployment for version ${version}:`, error);
      throw error;
    }
  },

  async rollbackCanary(version: string, reason: string): Promise<void> {
    try {
      await axios.post(`/api/canaries/${version}/rollback`, { reason });
    } catch (error) {
      console.error(`Error rolling back canary deployment for version ${version}:`, error);
      throw error;
    }
  }
}; 