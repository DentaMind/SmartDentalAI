import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  last_health_check: string;
}

export interface EventStats {
  total_events: number;
  events_last_hour: number;
  error_rate: number;
  avg_processing_time: number;
  event_types: {
    [key: string]: number;
  };
}

export interface StorageStats {
  total_storage: number;
  used_storage: number;
  storage_percentage: number;
  collections: {
    [key: string]: {
      count: number;
      size: number;
    };
  };
}

export interface LearningMetrics {
  total_processed: number;
  successful_ingestions: number;
  failed_ingestions: number;
  ingestion_rate: number;
  last_learning_cycle: string;
  model_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
}

export interface FounderAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  source: 'events' | 'storage' | 'learning' | 'system';
}

export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch system health');
    }
    throw error;
  }
};

export const getEventStats = async (): Promise<EventStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/events/stats`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch event stats');
    }
    throw error;
  }
};

export const getStorageStats = async (): Promise<StorageStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/storage/stats`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch storage stats');
    }
    throw error;
  }
};

export const getLearningMetrics = async (): Promise<LearningMetrics> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/learning/stats`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch learning metrics');
    }
    throw error;
  }
};

export const getFounderAlerts = async (): Promise<FounderAlert[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/alerts`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch alerts');
    }
    throw error;
  }
};

export const acknowledgeAlert = async (alertId: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to acknowledge alert');
    }
    throw error;
  }
};

export const resolveAlert = async (alertId: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/api/alerts/${alertId}/resolve`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to resolve alert');
    }
    throw error;
  }
}; 