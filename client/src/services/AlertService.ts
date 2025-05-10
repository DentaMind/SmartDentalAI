import axios from 'axios';
import { Subject } from 'rxjs';

export interface Alert {
  type: string;
  severity: string;
  user_id?: string;
  ip_address?: string;
  count: number;
  description: string;
  timestamp?: string;
  dimensions?: any[];
}

export interface AlertConfig {
  failed_logins_threshold: number;
  patient_access_threshold: number;
  std_dev_threshold: number;
  unusual_hours_start: number;
  unusual_hours_end: number;
  alert_webhook_url: string | null;
  email_alerts: boolean;
  alert_recipients: string[] | null;
}

// Default configuration
const DEFAULT_CONFIG: AlertConfig = {
  failed_logins_threshold: 5,
  patient_access_threshold: 20,
  std_dev_threshold: 3.0,
  unusual_hours_start: 22,
  unusual_hours_end: 6,
  alert_webhook_url: null,
  email_alerts: false,
  alert_recipients: null
};

class AlertService {
  private alertSubject = new Subject<Alert>();
  private configSubject = new Subject<AlertConfig>();
  private pollInterval: any = null;
  private lastAlertTimestamp: string | null = null;
  private currentConfig: AlertConfig = DEFAULT_CONFIG;
  
  // Observable for components to subscribe to
  public alerts$ = this.alertSubject.asObservable();
  public config$ = this.configSubject.asObservable();
  
  constructor() {
    // Load config on initialization
    this.loadConfig();
  }
  
  // Start polling for new alerts
  public startPolling(intervalMs: number = 60000): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    // Poll immediately
    this.checkForNewAlerts();
    
    // Then set up interval
    this.pollInterval = setInterval(() => {
      this.checkForNewAlerts();
    }, intervalMs);
  }
  
  // Stop polling
  public stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
  
  // Check for new high-severity alerts
  private async checkForNewAlerts(): Promise<void> {
    try {
      // Only look for alerts in the last hour (or since last check)
      const params: any = {
        days: 1,
        severity: 'high'
      };
      
      const response = await axios.get('/api/audit/alerts', { params });
      const alerts: Alert[] = response.data;
      
      if (alerts && alerts.length > 0) {
        // Sort by timestamp (most recent first)
        alerts.sort((a, b) => {
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        // If we have a last timestamp, only notify about newer alerts
        if (this.lastAlertTimestamp) {
          const newAlerts = alerts.filter(alert => 
            alert.timestamp && new Date(alert.timestamp) > new Date(this.lastAlertTimestamp!)
          );
          
          // Emit each new alert
          newAlerts.forEach(alert => {
            this.alertSubject.next(alert);
          });
          
          // Update last timestamp if there were new alerts
          if (newAlerts.length > 0 && newAlerts[0].timestamp) {
            this.lastAlertTimestamp = newAlerts[0].timestamp;
          }
        } else {
          // First time, just store the most recent timestamp
          if (alerts[0].timestamp) {
            this.lastAlertTimestamp = alerts[0].timestamp;
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new alerts:', error);
    }
  }
  
  // Get all anomalies for a specific time window
  public async getAnomalies(days: number = 1, filters: any = {}): Promise<Alert[]> {
    try {
      const params = {
        days,
        ...filters
      };
      
      const response = await axios.get('/api/audit/alerts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      return [];
    }
  }
  
  // Get alert types with descriptions
  public async getAlertTypes(): Promise<any[]> {
    try {
      const response = await axios.get('/api/audit/alerts/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching alert types:', error);
      return [];
    }
  }
  
  // Subscribe to real-time alerts via webhook
  public async subscribeToAlerts(callbackUrl: string): Promise<any> {
    try {
      const response = await axios.get('/api/audit/alerts/realtime', {
        params: { callback_url: callbackUrl }
      });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to alerts:', error);
      throw error;
    }
  }
  
  // Unsubscribe from real-time alerts
  public async unsubscribeFromAlerts(callbackUrl: string): Promise<any> {
    try {
      const response = await axios.delete('/api/audit/alerts/realtime', {
        params: { callback_url: callbackUrl }
      });
      return response.data;
    } catch (error) {
      console.error('Error unsubscribing from alerts:', error);
      throw error;
    }
  }
  
  // Load alert configuration
  public async loadConfig(): Promise<AlertConfig> {
    try {
      const response = await axios.get('/api/audit/config');
      this.currentConfig = response.data;
      this.configSubject.next(this.currentConfig);
      return this.currentConfig;
    } catch (error) {
      console.error('Error loading alert configuration:', error);
      this.configSubject.next(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  }
  
  // Save alert configuration
  public async saveConfig(config: AlertConfig): Promise<AlertConfig> {
    try {
      const response = await axios.post('/api/audit/config', config);
      this.currentConfig = response.data;
      this.configSubject.next(this.currentConfig);
      return this.currentConfig;
    } catch (error) {
      console.error('Error saving alert configuration:', error);
      throw error;
    }
  }
  
  // Test alert webhook
  public async testAlertWebhook(): Promise<any> {
    try {
      const response = await axios.post('/api/audit/alerts/test');
      return response.data;
    } catch (error) {
      console.error('Error testing alert webhook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertService = new AlertService(); 