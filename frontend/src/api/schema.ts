import { apiClient } from './client';

export const fetchSchemaStats = async () => {
  const response = await apiClient.get('/api/v1/schemas/stats');
  return response.data;
};

export const fetchRecentChanges = async () => {
  const response = await apiClient.get('/api/v1/schemas/changes');
  return response.data;
};

export const fetchValidationStats = async () => {
  const response = await apiClient.get('/api/v1/schemas/validation/stats');
  return response.data;
};

export const fetchValidationErrors = async (limit: number = 50) => {
  const response = await apiClient.get(`/api/v1/schemas/validation/errors?limit=${limit}`);
  return response.data;
};

export const activateSchema = async (eventType: string, version: number) => {
  const response = await apiClient.post(
    `/api/v1/schemas/versions/${eventType}/${version}/activate`
  );
  return response.data;
};

export const deactivateSchema = async (eventType: string, version: number) => {
  const response = await apiClient.post(
    `/api/v1/schemas/versions/${eventType}/${version}/deactivate`
  );
  return response.data;
}; 