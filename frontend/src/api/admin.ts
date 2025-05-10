import { apiClient } from './client';

export const fetchDashboardMetrics = async () => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
}; 