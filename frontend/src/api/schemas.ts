import { apiClient } from './client';

export interface SchemaVersion {
  id: number;
  event_type: string;
  version: number;
  schema: any;
  schema_hash: string;
  is_active: boolean;
  created_at: string;
}

export interface SchemaStats {
  total_event_types: number;
  total_schema_versions: number;
  evolved_schemas: number;
  recent_changes_24h: number;
}

export const fetchSchemaStats = async (): Promise<SchemaStats> => {
  const response = await apiClient.get('/api/v1/schemas/stats');
  return response.data;
};

export const fetchSchemaVersions = async (
  eventType: string,
  includeInactive: boolean = false
): Promise<SchemaVersion[]> => {
  const response = await apiClient.get(
    `/api/v1/schemas/versions/${eventType}`,
    {
      params: { include_inactive: includeInactive }
    }
  );
  return response.data;
};

export const activateSchema = async (
  eventType: string,
  version: number
): Promise<void> => {
  await apiClient.post(
    `/api/v1/schemas/versions/${eventType}/${version}/activate`
  );
};

export const deactivateSchema = async (
  eventType: string,
  version: number
): Promise<void> => {
  await apiClient.post(
    `/api/v1/schemas/versions/${eventType}/${version}/deactivate`
  );
};

export const fetchEventTypes = async (): Promise<string[]> => {
  const response = await apiClient.get('/api/v1/schemas/event-types');
  return response.data;
}; 