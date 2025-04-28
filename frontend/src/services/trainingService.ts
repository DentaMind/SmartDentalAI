import axios from 'axios';

export interface TrainingSchedule {
  name: string;
  priority: string;
  next_run: string;
  last_run: string;
  interval_days: number;
  is_active: boolean;
  metrics_threshold: Record<string, number>;
  resource_allocation: Record<string, any>;
  performance_history: Array<{
    timestamp: string;
    metrics: Record<string, number>;
    resource_usage: Record<string, number>;
  }>;
  advanced_conditions?: Record<string, any>;
  notification_channels?: string[];
}

export interface TrainingScheduleRequest {
  name: string;
  priority: string;
  interval_days: number;
  metrics_threshold: Record<string, number>;
  resource_allocation?: Record<string, any>;
  advanced_conditions?: Record<string, any>;
  notification_channels?: string[];
}

export interface TrainingJob {
  schedule_name: string;
  priority: string;
  start_time: string;
  end_time?: string;
  status: string;
  metrics: Record<string, number>;
  resource_usage: Record<string, number>;
  error_message?: string;
  version?: string;
}

export interface ModelVersion {
  version: string;
  training_job_id: string;
  metrics: Record<string, number>;
  created_at: string;
  deployed_at?: string;
  deployment_status: string;
  canary_performance?: Record<string, number>;
}

export interface VersionRollbackRequest {
  version: string;
  reason: string;
}

export const trainingService = {
  async getSchedules(): Promise<TrainingSchedule[]> {
    try {
      const response = await axios.get('/api/training/schedules');
      return response.data;
    } catch (error) {
      console.error('Error fetching training schedules:', error);
      throw error;
    }
  },

  async addSchedule(schedule: TrainingScheduleRequest): Promise<void> {
    try {
      await axios.post('/api/training/schedules', schedule);
    } catch (error) {
      console.error('Error adding training schedule:', error);
      throw error;
    }
  },

  async toggleSchedule(name: string): Promise<void> {
    try {
      await axios.put(`/api/training/schedules/${name}/toggle`);
    } catch (error) {
      console.error('Error toggling training schedule:', error);
      throw error;
    }
  },

  async deleteSchedule(name: string): Promise<void> {
    try {
      await axios.delete(`/api/training/schedules/${name}`);
    } catch (error) {
      console.error('Error deleting training schedule:', error);
      throw error;
    }
  },

  async triggerSchedule(name: string): Promise<void> {
    try {
      await axios.post(`/api/training/schedules/${name}/trigger`);
    } catch (error) {
      console.error('Error triggering training schedule:', error);
      throw error;
    }
  },

  async getJobHistory(limit: number = 100): Promise<TrainingJob[]> {
    try {
      const response = await axios.get(`/api/training/jobs/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job history:', error);
      throw error;
    }
  },

  async getActiveJobs(): Promise<TrainingJob[]> {
    try {
      const response = await axios.get('/api/training/jobs/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      throw error;
    }
  },

  async cancelJob(jobId: string): Promise<void> {
    try {
      await axios.post(`/api/training/jobs/${jobId}/cancel`);
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  },

  async getVersions(): Promise<ModelVersion[]> {
    try {
      const response = await axios.get('/api/training/versions');
      return response.data;
    } catch (error) {
      console.error('Error fetching model versions:', error);
      throw error;
    }
  },

  async rollbackVersion(version: string, reason: string): Promise<void> {
    try {
      await axios.post(`/api/training/versions/${version}/rollback`, { reason });
    } catch (error) {
      console.error('Error rolling back version:', error);
      throw error;
    }
  },

  async getVersionMetrics(version: string): Promise<ModelVersion> {
    try {
      const response = await axios.get(`/api/training/versions/${version}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching version metrics:', error);
      throw error;
    }
  }
}; 