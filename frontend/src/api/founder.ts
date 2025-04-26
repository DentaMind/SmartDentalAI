import { apiClient } from './client';

export const fetchOpsBoardMetrics = async () => {
  const response = await apiClient.get('/founder/ops-board');
  return response.data;
}; 