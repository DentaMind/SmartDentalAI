/**
 * WebSocket Messages Type Definitions
 * 
 * This module defines TypeScript types for WebSocket messages used in the DentaMind platform.
 * These types ensure consistency and type safety in WebSocket communication.
 */

// Base message interface
export interface WebSocketMessage {
  type: string;
  timestamp: string;
}

// Error Message
export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  error: string;
  code?: string;
}

// Authentication Messages
export interface AuthenticatedMessage extends WebSocketMessage {
  user_id: string;
}

// Room Messages
export interface RoomMessage extends AuthenticatedMessage {
  room_id: string;
}

export interface RoomJoinedMessage extends RoomMessage {
  type: 'room_joined';
}

export interface RoomLeftMessage extends RoomMessage {
  type: 'room_left';
}

// Chat Messages
export interface ChatMessage extends RoomMessage {
  type: 'chat_message';
  content: string;
  user_name?: string;
}

// Connection Messages
export interface ConnectionUpdateMessage extends AuthenticatedMessage {
  type: 'connection_update';
  event: 'connected' | 'disconnected';
  connection_id: string;
}

// Appointment Messages
export interface AppointmentData {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  type?: string;
  location?: string;
  [key: string]: any;
}

export interface AppointmentCreatedMessage extends WebSocketMessage {
  type: 'appointment_created';
  appointment: AppointmentData;
}

export interface AppointmentUpdatedMessage extends WebSocketMessage {
  type: 'appointment_updated';
  appointment: AppointmentData;
}

// Patient Messages
export interface PatientData {
  id: string;
  name: string;
  assignedProvider?: string;
  appointmentId?: string;
  checkInTime?: string;
  waitingTime?: number;
  [key: string]: any;
}

export interface PatientArrivedMessage extends WebSocketMessage {
  type: 'patient_arrived';
  patient: PatientData;
}

// Notification Messages
export interface NotificationAlertMessage extends WebSocketMessage {
  type: 'notification_alert';
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export interface NotificationMessageMessage extends WebSocketMessage {
  type: 'notification_message';
  title: string;
  message: string;
  sender?: {
    id: string;
    name: string;
    role?: string;
  };
}

// Client Message Types (messages sent from client to server)
export interface JoinRoomRequest extends WebSocketMessage {
  type: 'join_room';
  room_id: string;
}

export interface LeaveRoomRequest extends WebSocketMessage {
  type: 'leave_room';
  room_id: string;
}

export interface SendChatRequest extends WebSocketMessage {
  type: 'chat_message';
  room_id: string;
  content: string;
}

// Union types for receiving messages
export type ServerMessage = 
  | ErrorMessage
  | RoomJoinedMessage
  | RoomLeftMessage
  | ChatMessage
  | ConnectionUpdateMessage
  | AppointmentCreatedMessage
  | AppointmentUpdatedMessage
  | PatientArrivedMessage
  | NotificationAlertMessage
  | NotificationMessageMessage;

// Union types for sending messages
export type ClientMessage =
  | JoinRoomRequest
  | LeaveRoomRequest
  | SendChatRequest;

// WebSocket Status
export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

// WebSocket Analytics Types
export interface WebSocketWorkerStats {
  worker_id: string;
  active_connections: number;
  capacity: number;
  utilization: number;
  queue_size: number;
  messages_processed: number;
  broadcast_count: number;
  connection_count: number;
  max_connections_reached: number;
  start_time: string;
}

export interface WebSocketPoolStats {
  worker_count: number;
  auto_scaling: boolean;
  total_connections: number;
  max_capacity: number;
  utilization: number;
  workers: WebSocketWorkerStats[];
  timestamp: string;
}

export interface WebSocketMetrics {
  connections: {
    total: number;
    peak: number;
    by_hour: Record<string, number>;
  };
  messages: {
    sent: number;
    received: number;
    errors: number;
    by_type: Record<string, number>;
  };
  rooms: {
    count: number;
    peak: number;
    most_active: string;
    activity: Record<string, number>;
  };
  users: {
    count: number;
    peak: number;
    most_active: string;
    activity: Record<string, number>;
  };
  performance: {
    avg_message_latency_ms: number;
    max_message_latency_ms: number;
    avg_broadcast_time_ms: number;
  };
  errors: {
    count: number;
    by_type: Record<string, number>;
    recent: Array<{
      message: string;
      timestamp: string;
      type: string;
    }>;
  };
  started_at: string;
  last_updated: string;
}

export interface WebSocketHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  active_connections: number;
  error_rate: number;
  avg_latency_ms: number;
  timestamp: string;
}

// Historical metrics types
export interface WebSocketHistoricalSnapshot {
  timestamp: string;
  connections: {
    total: number;
    unique_users: number;
  };
  messages: {
    sent: number;
    received: number;
    errors: number;
  };
  performance: {
    avg_message_latency_ms: number;
    avg_broadcast_time_ms: number;
  };
  rooms: {
    count: number;
  };
  errors: {
    count: number;
  };
  pool: WebSocketPoolStats;
}

export interface WebSocketHistoricalData {
  metrics: WebSocketHistoricalSnapshot[];
  timeRange: {
    start: string;
    end: string;
  };
}

// Alert system types
export type WebSocketAlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface WebSocketAlertThreshold {
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: WebSocketAlertSeverity;
  enabled: boolean;
}

export interface WebSocketAlert {
  id: string;
  timestamp: string;
  metric: string;
  threshold: number;
  value: number;
  message: string;
  severity: WebSocketAlertSeverity;
  acknowledged: boolean;
}

export interface WebSocketAlertConfig {
  thresholds: WebSocketAlertThreshold[];
  alertHistoryDays: number;
  emailNotifications: boolean;
  emailRecipients?: string[];
} 