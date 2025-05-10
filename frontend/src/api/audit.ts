import axios from 'axios';
import { AuditLog } from '../types/audit';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const AUDIT_API = `${API_BASE_URL}/audit`;

export interface AuditLogFilter {
  eventType?: string;
  userId?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const fetchAuditLogs = async (filters: AuditLogFilter = {}): Promise<AuditLogsResponse> => {
  const params = new URLSearchParams();
  
  if (filters.eventType) params.append('event_type', filters.eventType);
  if (filters.userId) params.append('user_id', filters.userId);
  if (filters.resourceType) params.append('resource_type', filters.resourceType);
  if (filters.startDate) params.append('start_date', filters.startDate.toISOString());
  if (filters.endDate) params.append('end_date', filters.endDate.toISOString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const response = await axios.get(`${AUDIT_API}/logs?${params.toString()}`);
  return response.data;
};

export const fetchAuditLog = async (id: string): Promise<AuditLog> => {
  const response = await axios.get(`${AUDIT_API}/logs/${id}`);
  return response.data;
};

export const fetchEventTypes = async (): Promise<string[]> => {
  const response = await axios.get(`${AUDIT_API}/event-types`);
  return response.data;
};

export const getExportUrl = (format: 'csv' | 'json', filters: AuditLogFilter = {}): string => {
  const params = new URLSearchParams();
  
  if (filters.eventType) params.append('event_type', filters.eventType);
  if (filters.userId) params.append('user_id', filters.userId);
  if (filters.resourceType) params.append('resource_type', filters.resourceType);
  if (filters.startDate) params.append('start_date', filters.startDate.toISOString());
  if (filters.endDate) params.append('end_date', filters.endDate.toISOString());
  
  return `${AUDIT_API}/export/${format}?${params.toString()}`;
}; 