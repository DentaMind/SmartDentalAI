import axios from 'axios';

interface TuningRecommendation {
  metric: string;
  timestamp: string;
  current_value: number;
  mean_value: number;
  trend: number;
  volatility: number;
  seasonality?: number;
  parameter_adjustments: {
    learning_rate?: number;
    batch_size?: number;
    threshold?: number;
    class_weight?: number;
    window_size?: number;
  };
  confidence_score: number;
}

interface RootCauseAnalysis {
  timestamp: string;
  anomaly_cluster: {
    timestamp: string;
    primary_metric: string;
    primary_value: number;
    related_anomalies: Array<{
      metric: string;
      timestamp: string;
      value: number;
    }>;
  };
  analysis: {
    explanation: string;
    confidence: number;
  };
  system_state: {
    metrics: Record<string, any>;
    system: Record<string, any>;
    events: Record<string, any>;
  };
}

export const aiOpsService = {
  async getTuningHistory(days: number = 7): Promise<TuningRecommendation[]> {
    try {
      const response = await axios.get(`/api/ai-ops/tuning/history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tuning history:', error);
      throw error;
    }
  },

  async getRootCauseHistory(days: number = 7): Promise<RootCauseAnalysis[]> {
    try {
      const response = await axios.get(`/api/ai-ops/root-cause/history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching root cause history:', error);
      throw error;
    }
  },

  async triggerManualAnalysis(): Promise<RootCauseAnalysis> {
    try {
      const response = await axios.post('/api/ai-ops/root-cause/analyze');
      return response.data;
    } catch (error) {
      console.error('Error triggering manual analysis:', error);
      throw error;
    }
  },

  async applyTuningRecommendation(recommendation: TuningRecommendation): Promise<void> {
    try {
      await axios.post('/api/ai-ops/tuning/apply', recommendation);
    } catch (error) {
      console.error('Error applying tuning recommendation:', error);
      throw error;
    }
  },

  async getSystemHealth(): Promise<{
    metrics: Record<string, any>;
    system: Record<string, any>;
    events: Record<string, any>;
  }> {
    try {
      const response = await axios.get('/api/ai-ops/system-health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }
}; 