import { apiClient } from './client';

interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  user_groups: string[];
  percentage_rollout?: number;
  enterprise_only: boolean;
  killswitch_enabled: boolean;
  alert_on_error: boolean;
  metadata: Record<string, any>;
}

interface CreateFeatureFlagData {
  key: string;
  description: string;
  enabled?: boolean;
  user_groups?: string[];
  percentage_rollout?: number;
  enterprise_only?: boolean;
  killswitch_enabled?: boolean;
  alert_on_error?: boolean;
  metadata?: Record<string, any>;
}

interface UpdateFeatureFlagData {
  description?: string;
  enabled?: boolean;
  user_groups?: string[];
  percentage_rollout?: number;
  enterprise_only?: boolean;
  killswitch_enabled?: boolean;
  alert_on_error?: boolean;
  metadata?: Record<string, any>;
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const response = await apiClient.get('/feature-flags');
  return response.data;
}

export async function getFeatureFlag(flagKey: string): Promise<FeatureFlag> {
  const response = await apiClient.get(`/feature-flags/${flagKey}`);
  return response.data;
}

export async function createFeatureFlag(data: CreateFeatureFlagData): Promise<FeatureFlag> {
  const response = await apiClient.post('/feature-flags', data);
  return response.data;
}

export async function updateFeatureFlag(
  flagKey: string,
  data: UpdateFeatureFlagData
): Promise<FeatureFlag> {
  const response = await apiClient.put(`/feature-flags/${flagKey}`, data);
  return response.data;
}

export async function deleteFeatureFlag(flagKey: string): Promise<void> {
  await apiClient.delete(`/feature-flags/${flagKey}`);
}

export async function activateKillswitch(
  flagKey: string,
  reason: string
): Promise<void> {
  await apiClient.post(`/feature-flags/${flagKey}/killswitch`, { reason });
}

export async function getFeatureFlagAuditLog(
  flagKey: string,
  limit: number = 100,
  skip: number = 0
): Promise<any[]> {
  const response = await apiClient.get(`/feature-flags/${flagKey}/audit-log`, {
    params: { limit, skip }
  });
  return response.data;
} 