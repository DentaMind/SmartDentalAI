import { api } from './api';
import { axiosInstance } from './axios';

interface AlertThresholds {
  diagnosis_accuracy: number;
  treatment_stability: number;
  billing_accuracy: number;
  user_experience: number;
}

interface AlertControl {
  type: string;
  is_muted: boolean;
  mute_until?: string;
}

interface AlertResolution {
  alert_id: number;
  resolution_notes: string;
  trigger_retraining: boolean;
}

interface MetricTrendPoint {
  timestamp: string;
  value: number | null;
  rolling_avg: number | null;
  prediction: number | null;
  threshold: number;
}

interface MetricTrend {
  metric: string;
  points: MetricTrendPoint[];
  risk_level: 'low' | 'medium' | 'high';
  trend_direction: 'improving' | 'stable' | 'deteriorating';
}

interface RetrainingThresholds {
  diagnosis_accuracy?: number;
  treatment_stability?: number;
  billing_accuracy?: number;
  min_samples?: number;
}

interface ManualRetrainingRequest {
  model_type: string;
  reason: string;
  force?: boolean;
}

interface RetrainingMetrics {
  last_retrained: string;
  status: string;
  performance: {
    accuracy: number;
    validation_loss: number;
  };
  retraining_count_30d: number;
}

interface RetrainingStatus {
  metrics: {
    [key: string]: RetrainingMetrics;
  };
  history: RetrainingHistoryEvent[];
}

interface RetrainingHistoryEvent {
  model_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  performance_metrics?: {
    accuracy: number;
    validation_loss: number;
  };
}

export const fetchActiveAlerts = async () => {
  const response = await api.get('/founder/alerts/active');
  return response.data;
};

export const fetchAlertHistory = async (params?: {
  alert_type?: string;
  severity?: string;
  from_date?: string;
  to_date?: string;
}) => {
  const response = await api.get('/founder/alerts/history', { params });
  return response.data;
};

export const updateThresholds = async (thresholds: AlertThresholds) => {
  const response = await api.put('/founder/alerts/thresholds', thresholds);
  return response.data;
};

export const updateAlertControl = async (control: AlertControl) => {
  const response = await api.put(`/founder/alerts/control/${control.type}`, control);
  return response.data;
};

export const resolveAlert = async (resolution: AlertResolution) => {
  const response = await api.post(`/founder/alerts/${resolution.alert_id}/resolve`, resolution);
  return response.data;
};

export const fetchMetricTrends = async (metricType: string, days: number = 30): Promise<MetricTrend> => {
  const response = await api.get(`/founder/alerts/trends/${metricType}`, {
    params: { days }
  });
  return response.data;
};

export const getRetrainingStatus = async (): Promise<RetrainingStatus> => {
  const response = await axiosInstance.get('/founder/retraining/status');
  return response.data;
};

export const updateRetrainingThresholds = async (thresholds: RetrainingThresholds): Promise<void> => {
  await axiosInstance.put('/founder/retraining/thresholds', thresholds);
};

export const triggerRetraining = async (request: ManualRetrainingRequest): Promise<void> => {
  await axiosInstance.post('/founder/retraining/manual', request);
};

export const getRetrainingHistory = async (days: number = 30, modelType?: string): Promise<RetrainingHistoryEvent[]> => {
  const params = new URLSearchParams();
  if (days) params.append('days', days.toString());
  if (modelType) params.append('model_type', modelType);
  
  const response = await axiosInstance.get('/founder/retraining/history', { params });
  return response.data;
}; 