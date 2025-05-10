/**
 * WebSocket Message Type Definitions
 * 
 * This file contains TypeScript types for all WebSocket messages used in DentaMind.
 * These ensure type safety for all real-time communications.
 */

import { z } from 'zod';

/**
 * Message Types Enum
 * 
 * List of all valid WebSocket message types
 */
export enum WebSocketMessageType {
  // Connection & Authentication
  CONNECT = 'connect',
  AUTHENTICATE = 'authenticate',
  CONNECTION_ACK = 'connection_ack',
  DISCONNECT = 'disconnect',
  
  // Notifications
  NOTIFICATION = 'notification',
  NOTIFICATION_ACK = 'notification_ack',
  
  // Real-time updates
  PATIENT_UPDATE = 'patient_update',
  DIAGNOSIS_UPDATE = 'diagnosis_update',
  XRAY_ANALYSIS_PROGRESS = 'xray_analysis_progress',
  XRAY_ANALYSIS_COMPLETE = 'xray_analysis_complete',
  
  // AI processing
  AI_INFERENCE_REQUEST = 'ai_inference_request',
  AI_INFERENCE_RESPONSE = 'ai_inference_response',
  AI_INFERENCE_ERROR = 'ai_inference_error',
  AI_TRAINING_PROGRESS = 'ai_training_progress',
  
  // Collaboration
  DENTIST_PRESENCE = 'dentist_presence',
  CHART_ANNOTATION = 'chart_annotation',
  TREATMENT_PLAN_EDIT = 'treatment_plan_edit',
  
  // System
  SYSTEM_ALERT = 'system_alert',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
}

/**
 * Base WebSocket Message
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
  id: string;
}

/**
 * Authentication Message
 */
export interface AuthenticateMessage extends WebSocketMessage {
  type: WebSocketMessageType.AUTHENTICATE;
  payload: {
    token: string;
  };
}

/**
 * Connection Acknowledgment
 */
export interface ConnectionAckMessage extends WebSocketMessage {
  type: WebSocketMessageType.CONNECTION_ACK;
  payload: {
    status: 'success' | 'error';
    message?: string;
    user_id?: string;
  };
}

/**
 * Notification Message
 */
export interface NotificationMessage extends WebSocketMessage {
  type: WebSocketMessageType.NOTIFICATION;
  payload: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    action_url?: string;
    expires_at?: string;
  };
}

/**
 * Patient Update Message
 */
export interface PatientUpdateMessage extends WebSocketMessage {
  type: WebSocketMessageType.PATIENT_UPDATE;
  payload: {
    patient_id: string;
    update_type: 'demographics' | 'insurance' | 'medical_history' | 'appointments' | 'billing';
    updated_by: string;
    summary: string;
  };
}

/**
 * X-ray Analysis Progress Message
 */
export interface XrayAnalysisProgressMessage extends WebSocketMessage {
  type: WebSocketMessageType.XRAY_ANALYSIS_PROGRESS;
  payload: {
    analysis_id: string;
    patient_id: string;
    progress_percentage: number;
    stage: 'preprocessing' | 'segmentation' | 'classification' | 'report_generation';
    estimated_completion_time?: string;
  };
}

/**
 * X-ray Analysis Complete Message
 */
export interface XrayAnalysisCompleteMessage extends WebSocketMessage {
  type: WebSocketMessageType.XRAY_ANALYSIS_COMPLETE;
  payload: {
    analysis_id: string;
    patient_id: string;
    result_url: string;
    findings_count: number;
    urgency_level?: 'routine' | 'soon' | 'immediate';
  };
}

/**
 * AI Inference Request Message
 */
export interface AIInferenceRequestMessage extends WebSocketMessage {
  type: WebSocketMessageType.AI_INFERENCE_REQUEST;
  payload: {
    model_type: string;
    data: unknown;
    priority: 'low' | 'normal' | 'high';
    callback_id?: string;
  };
}

/**
 * AI Inference Response Message
 */
export interface AIInferenceResponseMessage extends WebSocketMessage {
  type: WebSocketMessageType.AI_INFERENCE_RESPONSE;
  payload: {
    result: unknown;
    execution_time_ms: number;
    model_version: string;
    confidence_score?: number;
    callback_id?: string;
  };
}

/**
 * Error Message
 */
export interface ErrorMessage extends WebSocketMessage {
  type: WebSocketMessageType.ERROR;
  payload: {
    code: string;
    message: string;
    original_message_id?: string;
    retry_possible: boolean;
  };
}

/**
 * System Alert Message
 */
export interface SystemAlertMessage extends WebSocketMessage {
  type: WebSocketMessageType.SYSTEM_ALERT;
  payload: {
    title: string;
    message: string;
    alert_level: 'info' | 'warning' | 'critical';
    affected_services?: string[];
    resolution_time?: string;
  };
}

/**
 * Union type of all WebSocket message interfaces
 */
export type WebSocketMessageUnion = 
  | AuthenticateMessage
  | ConnectionAckMessage
  | NotificationMessage
  | PatientUpdateMessage
  | XrayAnalysisProgressMessage
  | XrayAnalysisCompleteMessage
  | AIInferenceRequestMessage
  | AIInferenceResponseMessage
  | ErrorMessage
  | SystemAlertMessage;

// ==========================================================
// Zod Validation Schemas
// ==========================================================

/**
 * Base WebSocket Message Schema
 */
export const WebSocketMessageBaseSchema = z.object({
  type: z.nativeEnum(WebSocketMessageType),
  timestamp: z.string().datetime(),
  id: z.string().uuid()
});

/**
 * Authentication Message Schema
 */
export const AuthenticateMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.AUTHENTICATE),
  payload: z.object({
    token: z.string().min(10)
  })
});

/**
 * Connection Acknowledgment Schema
 */
export const ConnectionAckMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.CONNECTION_ACK),
  payload: z.object({
    status: z.enum(['success', 'error']),
    message: z.string().optional(),
    user_id: z.string().optional()
  })
});

/**
 * Notification Message Schema
 */
export const NotificationMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.NOTIFICATION),
  payload: z.object({
    title: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'error', 'success']),
    action_url: z.string().url().optional(),
    expires_at: z.string().datetime().optional()
  })
});

/**
 * Patient Update Message Schema
 */
export const PatientUpdateMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.PATIENT_UPDATE),
  payload: z.object({
    patient_id: z.string().uuid(),
    update_type: z.enum(['demographics', 'insurance', 'medical_history', 'appointments', 'billing']),
    updated_by: z.string(),
    summary: z.string()
  })
});

/**
 * X-ray Analysis Progress Message Schema
 */
export const XrayAnalysisProgressMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.XRAY_ANALYSIS_PROGRESS),
  payload: z.object({
    analysis_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    progress_percentage: z.number().min(0).max(100),
    stage: z.enum(['preprocessing', 'segmentation', 'classification', 'report_generation']),
    estimated_completion_time: z.string().datetime().optional()
  })
});

/**
 * X-ray Analysis Complete Message Schema
 */
export const XrayAnalysisCompleteMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.XRAY_ANALYSIS_COMPLETE),
  payload: z.object({
    analysis_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    result_url: z.string(),
    findings_count: z.number().int().nonnegative(),
    urgency_level: z.enum(['routine', 'soon', 'immediate']).optional()
  })
});

/**
 * AI Inference Request Message Schema
 */
export const AIInferenceRequestMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.AI_INFERENCE_REQUEST),
  payload: z.object({
    model_type: z.string(),
    data: z.unknown(),
    priority: z.enum(['low', 'normal', 'high']),
    callback_id: z.string().optional()
  })
});

/**
 * AI Inference Response Message Schema
 */
export const AIInferenceResponseMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.AI_INFERENCE_RESPONSE),
  payload: z.object({
    result: z.unknown(),
    execution_time_ms: z.number().nonnegative(),
    model_version: z.string(),
    confidence_score: z.number().min(0).max(1).optional(),
    callback_id: z.string().optional()
  })
});

/**
 * Error Message Schema
 */
export const ErrorMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.ERROR),
  payload: z.object({
    code: z.string(),
    message: z.string(),
    original_message_id: z.string().optional(),
    retry_possible: z.boolean()
  })
});

/**
 * System Alert Message Schema
 */
export const SystemAlertMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal(WebSocketMessageType.SYSTEM_ALERT),
  payload: z.object({
    title: z.string(),
    message: z.string(),
    alert_level: z.enum(['info', 'warning', 'critical']),
    affected_services: z.array(z.string()).optional(),
    resolution_time: z.string().datetime().optional()
  })
});

/**
 * Validate an incoming WebSocket message
 * @param message The message to validate
 * @returns The validated message or throws an error
 */
export function validateWebSocketMessage(message: unknown): WebSocketMessageUnion {
  // First validate the base structure to extract the type
  const baseValidation = WebSocketMessageBaseSchema.safeParse(message);
  
  if (!baseValidation.success) {
    throw new Error(`Invalid WebSocket message: ${baseValidation.error.message}`);
  }
  
  // Based on the message type, validate with the appropriate schema
  const { type } = baseValidation.data;
  
  switch (type) {
    case WebSocketMessageType.AUTHENTICATE:
      return AuthenticateMessageSchema.parse(message) as AuthenticateMessage;
      
    case WebSocketMessageType.CONNECTION_ACK:
      return ConnectionAckMessageSchema.parse(message) as ConnectionAckMessage;
      
    case WebSocketMessageType.NOTIFICATION:
      return NotificationMessageSchema.parse(message) as NotificationMessage;
      
    case WebSocketMessageType.PATIENT_UPDATE:
      return PatientUpdateMessageSchema.parse(message) as PatientUpdateMessage;
      
    case WebSocketMessageType.XRAY_ANALYSIS_PROGRESS:
      return XrayAnalysisProgressMessageSchema.parse(message) as XrayAnalysisProgressMessage;
      
    case WebSocketMessageType.XRAY_ANALYSIS_COMPLETE:
      return XrayAnalysisCompleteMessageSchema.parse(message) as XrayAnalysisCompleteMessage;
      
    case WebSocketMessageType.AI_INFERENCE_REQUEST:
      return AIInferenceRequestMessageSchema.parse(message) as AIInferenceRequestMessage;
      
    case WebSocketMessageType.AI_INFERENCE_RESPONSE:
      return AIInferenceResponseMessageSchema.parse(message) as AIInferenceResponseMessage;
      
    case WebSocketMessageType.ERROR:
      return ErrorMessageSchema.parse(message) as ErrorMessage;
      
    case WebSocketMessageType.SYSTEM_ALERT:
      return SystemAlertMessageSchema.parse(message) as SystemAlertMessage;
      
    default:
      throw new Error(`Unsupported WebSocket message type: ${type}`);
  }
} 