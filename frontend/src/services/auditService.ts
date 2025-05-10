import axios from 'axios';
import { API_BASE_URL } from '../config';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS = 'access',
  MODIFY = 'modify'
}

export enum AuditEntityType {
  USER = 'user',
  PATIENT = 'patient',
  APPOINTMENT = 'appointment',
  PROCEDURE = 'procedure',
  COMMUNICATION = 'communication',
  SYSTEM = 'system',
  SETTINGS = 'settings',
  AUDIT = 'audit'
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  ip_address: string;
  details: Record<string, any>;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  per_page: number;
}

export interface AuditLogExportResponse {
  filename: string;
  content: string;
}

export interface GetAuditLogsParams {
  page?: number;
  per_page?: number;
  action?: AuditAction;
  entity_type?: AuditEntityType;
  search?: string;
  start_date?: string;
  end_date?: string;
}

class AuditService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/audit`;
  }

  async getAuditLogs(params: GetAuditLogsParams): Promise<AuditLogListResponse> {
    try {
      const response = await axios.get<AuditLogListResponse>(`${this.baseUrl}/logs`, {
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  async getAuditLogById(id: string): Promise<AuditLog> {
    try {
      const response = await axios.get<AuditLog>(`${this.baseUrl}/logs/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }

  async exportAuditLogs(params: GetAuditLogsParams): Promise<AuditLogExportResponse> {
    try {
      const response = await axios.get<AuditLogExportResponse>(`${this.baseUrl}/logs/export`, {
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  async getUserAuditLogs(
    userId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<AuditLogListResponse> {
    try {
      const response = await axios.get<AuditLogListResponse>(
        `${this.baseUrl}/logs/user/${userId}`,
        {
          params: { page, per_page: perPage },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      throw error;
    }
  }

  async getEntityAuditLogs(
    entityType: AuditEntityType,
    entityId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<AuditLogListResponse> {
    try {
      const response = await axios.get<AuditLogListResponse>(
        `${this.baseUrl}/logs/entity/${entityType}/${entityId}`,
        {
          params: { page, per_page: perPage },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      throw error;
    }
  }

  // Helper method to download exported audit logs
  async downloadExportedLogs(params: GetAuditLogsParams): Promise<void> {
    try {
      const response = await this.exportAuditLogs(params);
      const blob = new Blob([response.content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading audit logs:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService(); 