import { WebSocketPoolStats, WebSocketMetrics, WebSocketHealthStatus, WebSocketHistoricalSnapshot, WebSocketAlert, WebSocketAlertThreshold, WebSocketAlertConfig } from '../types/websocket';
import { API_URL } from '../config/constants';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  latency_ms?: number;
  timestamp: string;
}

/**
 * Service for fetching WebSocket analytics data
 */
export class WebSocketAnalyticsService {
  private static instance: WebSocketAnalyticsService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): WebSocketAnalyticsService {
    if (!WebSocketAnalyticsService.instance) {
      WebSocketAnalyticsService.instance = new WebSocketAnalyticsService();
    }
    return WebSocketAnalyticsService.instance;
  }

  /**
   * Fetch pool statistics from the connection pool
   */
  public async getPoolStats(): Promise<WebSocketPoolStats> {
    try {
      const response = await fetch(`${API_URL}/api/ws/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching WebSocket pool stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.stats as WebSocketPoolStats;
    } catch (error) {
      console.error('Failed to fetch WebSocket pool stats:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed WebSocket metrics
   */
  public async getMetrics(): Promise<WebSocketMetrics> {
    try {
      const response = await fetch(`${API_URL}/api/ws/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching WebSocket metrics: ${response.statusText}`);
      }

      return await response.json() as WebSocketMetrics;
    } catch (error) {
      console.error('Failed to fetch WebSocket metrics:', error);
      throw error;
    }
  }

  /**
   * Fetch WebSocket health status
   */
  public async getHealthStatus(): Promise<WebSocketHealthStatus> {
    try {
      const response = await fetch(`${API_URL}/api/ws/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching WebSocket health: ${response.statusText}`);
      }

      return await response.json() as WebSocketHealthStatus;
    } catch (error) {
      console.error('Failed to fetch WebSocket health status:', error);
      throw error;
    }
  }

  /**
   * Get historical metrics for a specified time range
   */
  public async getHistoricalMetrics(days: number = 7): Promise<WebSocketHistoricalSnapshot[]> {
    try {
      const response = await fetch(`${API_URL}/api/ws/metrics/historical?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching historical WebSocket metrics: ${response.statusText}`);
      }

      return await response.json() as WebSocketHistoricalSnapshot[];
    } catch (error) {
      console.error('Failed to fetch historical WebSocket metrics:', error);
      throw error;
    }
  }

  /**
   * Get WebSocket alerts
   */
  public async getAlerts(includeAcknowledged: boolean = false): Promise<WebSocketAlert[]> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts?include_acknowledged=${includeAcknowledged}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching WebSocket alerts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.alerts as WebSocketAlert[];
    } catch (error) {
      console.error('Failed to fetch WebSocket alerts:', error);
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error acknowledging WebSocket alert: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to acknowledge WebSocket alert:', error);
      throw error;
    }
  }

  /**
   * Get alert thresholds
   */
  public async getAlertThresholds(): Promise<WebSocketAlertThreshold[]> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts/thresholds`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching WebSocket alert thresholds: ${response.statusText}`);
      }

      const data = await response.json();
      return data.thresholds as WebSocketAlertThreshold[];
    } catch (error) {
      console.error('Failed to fetch WebSocket alert thresholds:', error);
      throw error;
    }
  }

  /**
   * Update an alert threshold
   */
  public async updateAlertThreshold(index: number, threshold: WebSocketAlertThreshold): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts/thresholds/${index}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threshold),
      });

      if (!response.ok) {
        throw new Error(`Error updating WebSocket alert threshold: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to update WebSocket alert threshold:', error);
      throw error;
    }
  }

  /**
   * Add a new alert threshold
   */
  public async addAlertThreshold(threshold: WebSocketAlertThreshold): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts/thresholds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threshold),
      });

      if (!response.ok) {
        throw new Error(`Error adding WebSocket alert threshold: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to add WebSocket alert threshold:', error);
      throw error;
    }
  }

  /**
   * Delete an alert threshold
   */
  public async deleteAlertThreshold(index: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts/thresholds/${index}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error deleting WebSocket alert threshold: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to delete WebSocket alert threshold:', error);
      throw error;
    }
  }

  /**
   * Update email notification configuration
   */
  public async updateEmailConfig(enableEmails: boolean, recipients: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/ws/alerts/email-config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enable_emails: enableEmails,
          recipients,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error updating WebSocket email configuration: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to update WebSocket email configuration:', error);
      throw error;
    }
  }

  /**
   * Test WebSocket server connection
   */
  public async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${API_URL}/api/ws/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error testing WebSocket connection: ${response.statusText}`);
      }

      return await response.json() as ConnectionTestResult;
    } catch (error) {
      console.error('Failed to test WebSocket connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test WebSocket connection pool
   */
  public async testConnectionPool(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${API_URL}/api/ws/test-pool`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error testing WebSocket connection pool: ${response.statusText}`);
      }

      return await response.json() as ConnectionTestResult;
    } catch (error) {
      console.error('Failed to test WebSocket connection pool:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test echo message
   */
  public async testEchoMessage(message: string = 'Test message'): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${API_URL}/api/ws/test-echo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Error testing echo message: ${response.statusText}`);
      }

      return await response.json() as ConnectionTestResult;
    } catch (error) {
      console.error('Failed to test echo message:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const websocketAnalyticsService = WebSocketAnalyticsService.getInstance(); 