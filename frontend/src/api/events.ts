import { EventStats, HealthResponse } from '@/types/events';
import { api } from './api';

export const fetchEventStats = async (): Promise<EventStats> => {
  const response = await api.get('/api/v1/events/stats');
  return response.data;
};

export const fetchEventHealth = async (): Promise<HealthResponse> => {
  const response = await api.get('/api/v1/events/health');
  return response.data;
}; 