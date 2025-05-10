/**
 * WebSocket Client Monitoring Utility
 * 
 * Provides client-side monitoring and logging for WebSocket connections.
 * Collects metrics about connection stability, reconnections, and performance.
 */

import { API_URL } from '../config/constants';

// Types for client-side metrics
export interface WebSocketClientMetrics {
  connectionState: 'connecting' | 'open' | 'closed' | 'error';
  totalConnections: number;
  connectionDrops: number;
  reconnectionAttempts: number;
  successfulReconnections: number;
  messagesSent: number;
  messagesReceived: number;
  messagesQueued: number;
  messageErrors: number;
  lastMessageLatency: number;
  avgMessageLatency: number;
  connectionStartTime: number;
  totalConnectedTime: number;
  lastConnectedTime: number;
  connectionInfo: {
    userAgent: string;
    networkType?: string;
    effectiveType?: string;
    roundTripTime?: number;
    downlink?: number;
  };
  lastError?: {
    type: string;
    message: string;
    timestamp: number;
  };
}

// Single global instance for the application
let globalInstance: WebSocketClientMonitor | null = null;

export class WebSocketClientMonitor {
  private metrics: WebSocketClientMetrics;
  private latencySamples: number[];
  private syncInterval: number;
  private syncIntervalId: number | null;
  private logLocalStorageKey: string;
  private maxStoredLogs: number;

  constructor() {
    // Initialize metrics
    this.metrics = {
      connectionState: 'closed',
      totalConnections: 0,
      connectionDrops: 0,
      reconnectionAttempts: 0,
      successfulReconnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      messagesQueued: 0,
      messageErrors: 0,
      lastMessageLatency: 0,
      avgMessageLatency: 0,
      connectionStartTime: 0,
      totalConnectedTime: 0,
      lastConnectedTime: 0,
      connectionInfo: {
        userAgent: navigator.userAgent,
      }
    };

    // Latency tracking
    this.latencySamples = [];
    
    // Sync to server every 5 minutes by default
    this.syncInterval = 5 * 60 * 1000;
    this.syncIntervalId = null;
    
    // Local storage settings
    this.logLocalStorageKey = 'websocket_client_metrics';
    this.maxStoredLogs = 50;
    
    // Load any persisted metrics
    this.loadPersistedMetrics();
    
    // Add network information if available
    this.captureNetworkInfo();
  }

  /**
   * Get the global instance of the WebSocket client monitor
   */
  public static getInstance(): WebSocketClientMonitor {
    if (!globalInstance) {
      globalInstance = new WebSocketClientMonitor();
    }
    return globalInstance;
  }

  /**
   * Start monitoring a WebSocket instance
   * @param websocket The WebSocket instance to monitor
   */
  public monitorWebSocket(websocket: WebSocket): void {
    // Track connection open
    websocket.addEventListener('open', () => {
      this.recordConnectionOpen();
    });

    // Track connection errors
    websocket.addEventListener('error', (event) => {
      this.recordError('websocket_error', 'WebSocket connection error');
    });

    // Track connection close
    websocket.addEventListener('close', (event) => {
      this.recordConnectionClose(event.code, event.reason);
    });

    // Track messages received
    websocket.addEventListener('message', () => {
      this.recordMessageReceived();
    });

    // Patch the send method to track messages sent
    const originalSend = websocket.send;
    websocket.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      this.recordMessageSent();
      return originalSend.call(websocket, data);
    };
  }

  /**
   * Start periodic sync of metrics to the server
   */
  public startPeriodicSync(): void {
    if (this.syncIntervalId !== null) {
      return;
    }

    // Immediately sync current metrics
    this.syncMetricsToServer();

    // Set up interval for future syncs
    this.syncIntervalId = window.setInterval(() => {
      this.syncMetricsToServer();
    }, this.syncInterval);
  }

  /**
   * Stop periodic sync of metrics to the server
   */
  public stopPeriodicSync(): void {
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Record a connection being opened
   */
  public recordConnectionOpen(): void {
    const now = Date.now();
    this.metrics.connectionState = 'open';
    this.metrics.totalConnections++;
    this.metrics.connectionStartTime = now;
    this.metrics.lastConnectedTime = now;
    
    // If this was a reconnection
    if (this.metrics.reconnectionAttempts > 0) {
      this.metrics.successfulReconnections++;
    }
    
    this.persistMetrics();
  }

  /**
   * Record a connection being closed
   * @param code Close code
   * @param reason Close reason
   */
  public recordConnectionClose(code: number, reason: string): void {
    const now = Date.now();
    this.metrics.connectionState = 'closed';
    
    // Update connected time
    if (this.metrics.lastConnectedTime > 0) {
      this.metrics.totalConnectedTime += now - this.metrics.lastConnectedTime;
    }
    
    // Abnormal closure
    if (code !== 1000 && code !== 1001) {
      this.metrics.connectionDrops++;
      this.recordError('connection_drop', `Connection dropped with code ${code}: ${reason}`);
    }
    
    this.persistMetrics();
  }

  /**
   * Record a reconnection attempt
   */
  public recordReconnectionAttempt(): void {
    this.metrics.connectionState = 'connecting';
    this.metrics.reconnectionAttempts++;
    this.persistMetrics();
  }

  /**
   * Record a message being sent
   */
  public recordMessageSent(): void {
    this.metrics.messagesSent++;
    this.persistMetrics();
  }

  /**
   * Record a message being received
   * @param latency Optional latency in milliseconds
   */
  public recordMessageReceived(latency?: number): void {
    this.metrics.messagesReceived++;
    
    // If latency is provided, update metrics
    if (latency !== undefined) {
      this.recordLatency(latency);
    }
    
    this.persistMetrics();
  }

  /**
   * Record a message being queued
   */
  public recordMessageQueued(): void {
    this.metrics.messagesQueued++;
    this.persistMetrics();
  }

  /**
   * Record a message error
   */
  public recordMessageError(): void {
    this.metrics.messageErrors++;
    this.persistMetrics();
  }

  /**
   * Record latency for a message
   * @param latency Latency in milliseconds
   */
  public recordLatency(latency: number): void {
    // Update last message latency
    this.metrics.lastMessageLatency = latency;
    
    // Add to samples for average calculation
    this.latencySamples.push(latency);
    
    // Keep only the last 100 samples
    if (this.latencySamples.length > 100) {
      this.latencySamples.shift();
    }
    
    // Calculate average
    this.metrics.avgMessageLatency = this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length;
    
    this.persistMetrics();
  }

  /**
   * Record an error
   * @param type Error type
   * @param message Error message
   */
  public recordError(type: string, message: string): void {
    const timestamp = Date.now();
    
    this.metrics.lastError = {
      type,
      message,
      timestamp
    };
    
    // Also log to console for debugging
    console.error(`[WebSocketClientMonitor] ${type}: ${message}`);
    
    // Store error in local storage for persistence
    this.persistError(type, message, timestamp);
    
    this.persistMetrics();
  }

  /**
   * Get current metrics
   */
  public getMetrics(): WebSocketClientMetrics {
    return { ...this.metrics };
  }

  /**
   * Manually sync metrics to the server
   */
  public async syncMetricsToServer(): Promise<void> {
    try {
      // Get auth token if available
      const token = localStorage.getItem('token');

      // Sync metrics with the server
      const response = await fetch(`${API_URL}/ws/client-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          metrics: this.metrics,
          clientId: this.getClientId(),
          timestamp: Date.now()
        })
      });
      
      if (!response.ok) {
        console.warn('[WebSocketClientMonitor] Failed to sync metrics with server', await response.text());
      }
    } catch (error) {
      console.error('[WebSocketClientMonitor] Error syncing metrics with server', error);
      
      // Store failed sync attempt in local storage for future retry
      this.storeFailedSync(this.metrics);
    }
  }

  /**
   * Reset all metrics
   */
  public resetMetrics(): void {
    this.latencySamples = [];
    this.metrics = {
      connectionState: 'closed',
      totalConnections: 0,
      connectionDrops: 0,
      reconnectionAttempts: 0,
      successfulReconnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      messagesQueued: 0,
      messageErrors: 0,
      lastMessageLatency: 0,
      avgMessageLatency: 0,
      connectionStartTime: 0,
      totalConnectedTime: 0,
      lastConnectedTime: 0,
      connectionInfo: {
        userAgent: navigator.userAgent,
      }
    };
    
    // Re-capture network info in case it changed
    this.captureNetworkInfo();
    
    this.persistMetrics();
  }

  /**
   * Persist metrics to local storage
   */
  private persistMetrics(): void {
    try {
      localStorage.setItem(this.logLocalStorageKey, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[WebSocketClientMonitor] Failed to persist metrics to localStorage', error);
    }
  }

  /**
   * Load persisted metrics from local storage
   */
  private loadPersistedMetrics(): void {
    try {
      const persistedMetrics = localStorage.getItem(this.logLocalStorageKey);
      if (persistedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(persistedMetrics) };
      }
    } catch (error) {
      console.error('[WebSocketClientMonitor] Failed to load persisted metrics from localStorage', error);
    }
  }

  /**
   * Persist an error to local storage
   * @param type Error type
   * @param message Error message
   * @param timestamp Error timestamp
   */
  private persistError(type: string, message: string, timestamp: number): void {
    try {
      // Get existing errors
      const errorsKey = `${this.logLocalStorageKey}_errors`;
      const persistedErrors = localStorage.getItem(errorsKey);
      let errors = persistedErrors ? JSON.parse(persistedErrors) : [];
      
      // Add new error
      errors.push({
        type,
        message,
        timestamp
      });
      
      // Limit number of stored errors
      if (errors.length > this.maxStoredLogs) {
        errors = errors.slice(-this.maxStoredLogs);
      }
      
      // Store updated errors
      localStorage.setItem(errorsKey, JSON.stringify(errors));
    } catch (error) {
      console.error('[WebSocketClientMonitor] Failed to persist error to localStorage', error);
    }
  }

  /**
   * Store a failed sync attempt in local storage
   * @param metrics Metrics that failed to sync
   */
  private storeFailedSync(metrics: WebSocketClientMetrics): void {
    try {
      // Get existing failed syncs
      const syncKey = `${this.logLocalStorageKey}_failed_syncs`;
      const persistedSyncs = localStorage.getItem(syncKey);
      let failedSyncs = persistedSyncs ? JSON.parse(persistedSyncs) : [];
      
      // Add new failed sync
      failedSyncs.push({
        metrics: { ...metrics },
        timestamp: Date.now(),
        clientId: this.getClientId()
      });
      
      // Limit number of stored failed syncs
      if (failedSyncs.length > this.maxStoredLogs) {
        failedSyncs = failedSyncs.slice(-this.maxStoredLogs);
      }
      
      // Store updated failed syncs
      localStorage.setItem(syncKey, JSON.stringify(failedSyncs));
    } catch (error) {
      console.error('[WebSocketClientMonitor] Failed to store failed sync to localStorage', error);
    }
  }

  /**
   * Get or generate a unique client ID
   */
  private getClientId(): string {
    const clientIdKey = `${this.logLocalStorageKey}_client_id`;
    let clientId = localStorage.getItem(clientIdKey);
    
    if (!clientId) {
      // Generate a unique ID
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(clientIdKey, clientId);
    }
    
    return clientId;
  }

  /**
   * Capture network information if available
   */
  private captureNetworkInfo(): void {
    // Access the Navigator Network Information API if available
    const connection = (navigator as any).connection;
    if (connection) {
      this.metrics.connectionInfo.networkType = connection.type;
      this.metrics.connectionInfo.effectiveType = connection.effectiveType;
      this.metrics.connectionInfo.roundTripTime = connection.rtt;
      this.metrics.connectionInfo.downlink = connection.downlink;
    }
  }
}

// Export singleton instance
export const websocketClientMonitor = WebSocketClientMonitor.getInstance(); 