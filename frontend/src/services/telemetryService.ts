import axios from 'axios';

interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage_percent: number;
    core_count: number;
    frequency_mhz: number | null;
  };
  memory: {
    usage_percent: number;
    used_gb: number;
    total_gb: number;
  };
  disk: {
    usage_percent: number;
    used_gb: number;
    total_gb: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  system: {
    os: string;
    os_version: string;
    python_version: string;
    hostname: string;
    uptime: string;
  };
}

interface EventStats {
  total_events: number;
  events_last_hour: number;
  error_rate: number;
  avg_processing_time: number;
  event_types: Record<string, number>;
  recent_errors: any[];
}

interface StorageStats {
  total_space_gb: number;
  used_space_gb: number;
  free_space_gb: number;
  used_percent: number;
  total_files: number;
  backup_status: {
    last_backup: string | null;
    backup_count: number;
  };
}

interface LearningMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
  last_training_time: string | null;
  ingestion_rate: number;
  error_rate: number;
  retraining_cycles: any[];
  timestamp: string;
}

interface LearningTrends {
  timestamp: string;
  trends: {
    accuracy: number[];
    precision: number[];
    recall: number[];
    f1_score: number[];
  };
  dataset_growth: Array<{
    timestamp: string;
    total_samples: number;
    new_samples: number;
    data_quality: number;
  }>;
  retraining_history: Array<{
    timestamp: string;
    status: string;
    accuracy: number;
    duration: number;
    trigger: string;
  }>;
  ingestion_health: {
    total_ingested: number;
    success_rate: number;
    avg_processing_time: number;
    anomalies: any[];
  };
}

interface DatasetMetrics {
  timestamp: string;
  metrics: Array<{
    timestamp: string;
    total_samples: number;
    new_samples: number;
    data_quality: number;
  }>;
}

interface RetrainingHistory {
  timestamp: string;
  history: Array<{
    timestamp: string;
    status: string;
    accuracy: number;
    duration: number;
    trigger: string;
  }>;
}

interface TelemetryData {
  system: SystemMetrics;
  events: EventStats;
  storage: StorageStats;
  learning: LearningMetrics;
  timestamp: string;
}

interface Anomaly {
  timestamp: string;
  metric: string;
  value: number;
  z_score: number;
  severity: 'high' | 'medium';
}

interface TrendAnalysis {
  slope: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface AnomalyAnalysis {
  anomalies: Anomaly[];
  trend_analysis: {
    accuracy: TrendAnalysis;
    precision: TrendAnalysis;
    recall: TrendAnalysis;
    f1_score: TrendAnalysis;
  };
}

interface DailyAverage {
  date: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  sample_count: number;
}

interface HistoricalAnalysis {
  period: string;
  daily_averages: DailyAverage[];
  anomalies: Anomaly[];
  trend_analysis: {
    accuracy: TrendAnalysis;
    precision: TrendAnalysis;
    recall: TrendAnalysis;
    f1_score: TrendAnalysis;
  };
}

export interface AuditReport {
  timestamp: string;
  time_range: number;
  report: string;
}

export interface AuditReportHistory {
  count: number;
  reports: Array<{
    timestamp: string;
    report: string;
  }>;
}

export interface MetricDetails {
  metric: string;
  time_range: {
    start: string;
    end: string;
  };
  granularity: string;
  statistics: {
    mean: number;
    std: number;
    min: number;
    max: number;
    percentiles: {
      '25': number;
      '50': number;
      '75': number;
    };
  };
  significant_changes: Array<{
    timestamp: string;
    value: number;
    change: number;
    percent_change: number;
  }>;
  correlations: Record<string, number>;
  data_points: Array<{
    timestamp: string;
    value: number;
    training_samples: number;
  }>;
}

export interface CorrelationDetails {
  metrics: string[];
  correlation: number;
  rolling_correlation: Array<{
    timestamp: string;
    value: number;
  }>;
}

export const telemetryService = {
  async getAllTelemetry(): Promise<TelemetryData> {
    try {
      const response = await axios.get('/api/telemetry/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
      throw error;
    }
  },

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await axios.get('/api/telemetry/system');
      return response.data;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  },

  async getEventStats(): Promise<EventStats> {
    try {
      const response = await axios.get('/api/telemetry/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  },

  async getStorageStats(): Promise<StorageStats> {
    try {
      const response = await axios.get('/api/telemetry/storage');
      return response.data;
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      throw error;
    }
  },

  async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const response = await axios.get('/api/telemetry/learning');
      return response.data;
    } catch (error) {
      console.error('Error fetching learning metrics:', error);
      throw error;
    }
  },

  async getLearningTrends(): Promise<LearningTrends> {
    try {
      const response = await axios.get('/api/learning/trends');
      return response.data;
    } catch (error) {
      console.error('Error fetching learning trends:', error);
      throw error;
    }
  },

  async getDatasetMetrics(): Promise<DatasetMetrics> {
    try {
      const response = await axios.get('/api/learning/dataset');
      return response.data;
    } catch (error) {
      console.error('Error fetching dataset metrics:', error);
      throw error;
    }
  },

  async getRetrainingHistory(): Promise<RetrainingHistory> {
    try {
      const response = await axios.get('/api/learning/retraining');
      return response.data;
    } catch (error) {
      console.error('Error fetching retraining history:', error);
      throw error;
    }
  },

  checkCriticalThresholds(metrics: SystemMetrics): string[] {
    const alerts: string[] = [];
    const thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90
    };

    if (metrics.cpu.usage_percent > thresholds.cpu) {
      alerts.push(`CPU usage is critical: ${metrics.cpu.usage_percent}%`);
    }
    if (metrics.memory.usage_percent > thresholds.memory) {
      alerts.push(`Memory usage is critical: ${metrics.memory.usage_percent}%`);
    }
    if (metrics.disk.usage_percent > thresholds.disk) {
      alerts.push(`Disk usage is critical: ${metrics.disk.usage_percent}%`);
    }

    return alerts;
  },

  getMetricStatus(value: number, threshold: number): 'success' | 'warning' | 'error' {
    if (value > threshold) return 'error';
    if (value > threshold * 0.8) return 'warning';
    return 'success';
  },

  async getAnomalies(): Promise<AnomalyAnalysis> {
    try {
      const response = await axios.get('/api/learning/anomalies');
      return response.data;
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      throw error;
    }
  },

  async getHistoricalAnalysis(days: number = 30): Promise<HistoricalAnalysis> {
    try {
      const response = await axios.get(`/api/learning/historical/${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching historical analysis:', error);
      throw error;
    }
  },

  async exportMetrics(): Promise<any> {
    try {
      const response = await axios.get('/api/learning/export');
      return response.data;
    } catch (error) {
      console.error('Error exporting metrics:', error);
      throw error;
    }
  },

  async getAuditReport(timeRange: number = 1): Promise<AuditReport> {
    const response = await axios.get(`/api/audit/report?time_range=${timeRange}`);
    return response.data;
  },

  async getAuditReportHistory(days: number = 7): Promise<AuditReportHistory> {
    const response = await axios.get(`/api/audit/report/history?days=${days}`);
    return response.data;
  },

  async getMetricDetails(
    metric: string,
    startDate?: Date,
    endDate?: Date,
    granularity: string = 'hour'
  ): Promise<MetricDetails> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    params.append('granularity', granularity);

    const response = await axios.get<MetricDetails>(
      `/api/metrics/metric/${metric}?${params.toString()}`
    );
    return response.data;
  },

  async getMetricCorrelation(
    metric1: string,
    metric2: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CorrelationDetails> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());

    const response = await axios.get<CorrelationDetails>(
      `/api/metrics/correlation/${metric1}/${metric2}?${params.toString()}`
    );
    return response.data;
  }
}; 