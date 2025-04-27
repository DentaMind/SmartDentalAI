import { format } from 'date-fns';
import { apiClient } from './client';

export interface InsightSummary {
  status: string;
  period: string;
  trends: {
    diagnosis_correction: {
      direction: 'improving' | 'degrading';
      current_rate: number;
      change: number;
    };
    treatment_edits: {
      direction: 'improving' | 'degrading';
      current_rate: number;
      change: number;
    };
    billing_overrides: {
      direction: 'improving' | 'degrading';
      current_rate: number;
      change: number;
    };
  };
  alerts: {
    total: number;
    high_severity: number;
  };
  patterns: {
    total: number;
  };
}

export interface InsightData {
  id: number;
  date: string;
  metrics: {
    diagnosis?: {
      total_corrections: number;
      correction_rate: number;
      common_corrections: Record<string, number>;
      avg_confidence_before: number;
      avg_confidence_after: number;
    };
    treatment?: {
      total_edits: number;
      edit_rate: number;
      common_changes: Record<string, number>;
      avg_time_to_edit: number;
    };
    billing?: {
      total_overrides: number;
      override_rate: number;
      common_reasons: Record<string, number>;
      avg_adjustment: number;
      total_adjustment: number;
    };
    user_experience?: {
      avg_page_time: number;
      common_paths: Record<string, number>;
      performance: Record<string, {
        p50: number;
        p95: number;
        p99: number;
      }>;
    };
  };
  patterns: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    metric: number;
    description: string;
  }>;
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    metric: number;
  }>;
}

export const fetchInsightsSummary = async (): Promise<InsightSummary> => {
  const response = await apiClient.get('/api/v1/insights/summary');
  return response.data;
};

export const fetchInsightsRange = async (
  start: Date,
  end: Date
): Promise<InsightData[]> => {
  const response = await apiClient.get('/api/v1/insights/range', {
    params: {
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd')
    }
  });
  return response.data;
};

export const fetchRecentAlerts = async (
  days: number = 7,
  minSeverity: 'low' | 'medium' | 'high' = 'medium'
): Promise<Array<{
  date: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  metric: number;
}>> => {
  const response = await apiClient.get('/api/v1/insights/alerts', {
    params: {
      days,
      min_severity: minSeverity
    }
  });
  return response.data;
}; 