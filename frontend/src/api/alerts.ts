import { apiClient } from './client';

export const fetchSystemAlerts = async () => {
  const response = await apiClient.get('/alerts');
  return response.data;
}; 