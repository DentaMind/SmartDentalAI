import axios from 'axios';

export interface MetricData {
  timestamp: string;
  value: number;
}

export interface MetricDetails {
  name: string;
  description: string;
  unit: string;
  data: MetricData[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  significantChanges: {
    timestamp: string;
    change: number;
    percentage: number;
  }[];
}

const metricsService = {
  async getAvailableMetrics(): Promise<string[]> {
    try {
      const response = await axios.get('/api/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching available metrics:', error);
      throw error;
    }
  },

  async getMetricDetails(metricName: string, startDate: string, endDate: string): Promise<MetricDetails> {
    try {
      const response = await axios.get(`/api/metrics/${metricName}`, {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for metric ${metricName}:`, error);
      throw error;
    }
  },

  async getMetricCorrelations(metricName: string): Promise<{ metric: string; correlation: number }[]> {
    try {
      const response = await axios.get(`/api/metrics/${metricName}/correlations`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching correlations for metric ${metricName}:`, error);
      throw error;
    }
  },
};

export default metricsService; 