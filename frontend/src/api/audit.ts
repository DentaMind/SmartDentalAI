import { apiClient } from './client';

interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  patientId?: number;
  eventType?: string;
  userId?: number;
  resourceType?: string;
  limit?: number;
  offset?: number;
}

export const fetchAuditLogs = async (filters: AuditLogFilters) => {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.patientId) params.append('patient_id', filters.patientId.toString());
  if (filters.eventType) params.append('event_type', filters.eventType);
  if (filters.userId) params.append('user_id', filters.userId.toString());
  if (filters.resourceType) params.append('resource_type', filters.resourceType);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  
  const response = await apiClient.get(`/audit/logs?${params.toString()}`);
  return response.data;
};

export const fetchEventTypes = async () => {
  const response = await apiClient.get('/audit/event-types');
  return response.data;
}; 