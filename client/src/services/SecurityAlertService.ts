import axios from 'axios';

export enum AlertCategory {
  ACCESS = "access",
  AUTH = "auth",
  API = "api",
  LOCATION = "location",
  BEHAVIOR = "behavior",
  SYSTEM = "system"
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum AlertStatus {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  FALSE_POSITIVE = "false_positive",
  RESOLVED = "resolved",
  ESCALATED = "escalated"
}

export interface SecurityAlert {
  id: number;
  alert_id: string;
  timestamp: string;
  alert_type: string;
  category: AlertCategory;
  severity: AlertSeverity;
  description: string;
  user_id?: string;
  ip_address?: string;
  patient_id?: string;
  resource_path?: string;
  source: string;
  count: number;
  details?: any;
  status: AlertStatus;
  assigned_to?: string;
  resolved_by?: string;
  resolution_time?: string;
  resolution_notes?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  escalated_at?: string;
  escalated_by?: string;
}

export interface AlertFilterParams {
  start_time?: string;
  end_time?: string;
  alert_type?: string;
  category?: AlertCategory;
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  user_id?: string;
  ip_address?: string;
  patient_id?: string;
  limit?: number;
  offset?: number;
}

export interface AlertUpdateParams {
  status: AlertStatus;
  assigned_to?: string;
  resolution_notes?: string;
}

export interface ResolutionStats {
  total_alerts: number;
  open_alerts: number;
  acknowledged_alerts: number;
  resolved_alerts: number;
  false_positives: number;
  escalated_alerts: number;
  avg_resolution_time_hours: number | null;
  alerts_by_severity: Record<string, number>;
  alerts_by_category: Record<string, number>;
}

export interface AlertCategories {
  categories: string[];
  severities: string[];
  statuses: string[];
  types: string[];
}

class SecurityAlertService {
  private apiBase = '/api/security/alerts';

  /**
   * Get security alerts with optional filtering
   */
  public async getAlerts(filters?: AlertFilterParams): Promise<SecurityAlert[]> {
    try {
      const response = await axios.get(this.apiBase, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      throw error;
    }
  }

  /**
   * Get a specific security alert by ID
   */
  public async getAlertById(alertId: string): Promise<SecurityAlert> {
    try {
      const response = await axios.get(`${this.apiBase}/${alertId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching security alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Update the status of a security alert
   */
  public async updateAlertStatus(
    alertId: string,
    updateData: AlertUpdateParams
  ): Promise<SecurityAlert> {
    try {
      const response = await axios.put(
        `${this.apiBase}/${alertId}/status`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating security alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Get statistics about security alerts
   */
  public async getAlertStats(
    startTime?: string,
    endTime?: string
  ): Promise<ResolutionStats> {
    try {
      const response = await axios.get(`${this.apiBase}/stats`, {
        params: {
          start_time: startTime,
          end_time: endTime
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching security alert stats:', error);
      throw error;
    }
  }

  /**
   * Run a security scan for a specified number of days
   */
  public async runSecurityScan(days: number = 1): Promise<SecurityAlert[]> {
    try {
      const response = await axios.post(`${this.apiBase}/scan`, null, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error running security scan:', error);
      throw error;
    }
  }

  /**
   * Send a security digest email
   */
  public async sendSecurityDigest(
    days: number = 7,
    recipients?: string[]
  ): Promise<any> {
    try {
      const response = await axios.post(`${this.apiBase}/digest`, null, {
        params: { days, recipients: recipients?.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending security digest:', error);
      throw error;
    }
  }

  /**
   * Get available alert categories and types
   */
  public async getAlertCategories(): Promise<AlertCategories> {
    try {
      const response = await axios.get(`${this.apiBase}/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alert categories:', error);
      throw error;
    }
  }

  /**
   * Export alerts as CSV
   */
  public async exportAlerts(filters?: AlertFilterParams): Promise<string> {
    try {
      const response = await axios.get(`${this.apiBase}/export`, {
        params: { ...filters, format: 'csv' },
        responseType: 'blob'
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security-alerts-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      return 'Export completed';
    } catch (error) {
      console.error('Error exporting security alerts:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const securityAlertService = new SecurityAlertService(); 