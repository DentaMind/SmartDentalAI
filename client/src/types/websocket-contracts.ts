/**
 * WebSocket Message Contracts
 * 
 * This file defines type-safe contracts for WebSocket messages with Zod validation schemas.
 * Each message type has a corresponding schema for runtime validation.
 */

import { z } from 'zod';

// ==========================================================
// Common Schema Components
// ==========================================================

/**
 * Base message schema that all WebSocket messages extend
 */
export const BaseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
  id: z.string().uuid().optional(),
});

// ==========================================================
// Server Message Schemas (messages received from server)
// ==========================================================

/**
 * Error message schema
 */
export const ErrorMessageSchema = BaseMessageSchema.extend({
  type: z.literal('error'),
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

/**
 * Connection status message schema
 */
export const ConnectionStatusMessageSchema = BaseMessageSchema.extend({
  type: z.literal('connection_status'),
  status: z.enum(['connected', 'authenticated', 'error']),
  user_id: z.string().uuid().optional(),
  message: z.string().optional(),
});

/**
 * Notification message schema
 */
export const NotificationMessageSchema = BaseMessageSchema.extend({
  type: z.literal('notification'),
  title: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error', 'success']).optional().default('info'),
  action_url: z.string().optional(),
  is_read: z.boolean().optional().default(false),
  category: z.enum(['system', 'appointment', 'patient', 'treatment', 'billing', 'other']).optional(),
});

/**
 * Patient update message schema
 */
export const PatientUpdateMessageSchema = BaseMessageSchema.extend({
  type: z.literal('patient_update'),
  patient_id: z.string().uuid(),
  update_type: z.enum(['arrived', 'waiting', 'in_treatment', 'completed', 'no_show', 'cancelled']),
  wait_time: z.number().int().optional(),
  room: z.string().optional(),
  provider_id: z.string().uuid().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

/**
 * AI analysis status update message schema
 */
export const AiAnalysisStatusMessageSchema = BaseMessageSchema.extend({
  type: z.literal('ai_analysis_status'),
  analysis_id: z.string().uuid(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  result_url: z.string().optional(),
  error: z.string().optional(),
  patient_id: z.string().uuid().optional(),
  image_type: z.enum(['xray', 'intraoral', 'extraoral', 'other']).optional(),
});

/**
 * Chat message schema
 */
export const ChatMessageSchema = BaseMessageSchema.extend({
  type: z.literal('chat_message'),
  room_id: z.string(),
  user_id: z.string().uuid(),
  user_name: z.string(),
  content: z.string(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    mime_type: z.string(),
  })).optional(),
});

/**
 * System status update message schema
 */
export const SystemStatusMessageSchema = BaseMessageSchema.extend({
  type: z.literal('system_status'),
  service: z.string(),
  status: z.enum(['healthy', 'degraded', 'down']),
  details: z.string().optional(),
  affected_features: z.array(z.string()).optional(),
});

/**
 * Pong message schema (response to ping)
 */
export const PongMessageSchema = BaseMessageSchema.extend({
  type: z.literal('pong'),
  client_timestamp: z.string().optional(),
  server_timestamp: z.string().datetime(),
  latency_ms: z.number().optional(),
});

// ==========================================================
// Client Message Schemas (messages sent to server)
// ==========================================================

/**
 * Authentication message schema
 */
export const AuthMessageSchema = BaseMessageSchema.extend({
  type: z.literal('auth'),
  token: z.string(),
});

/**
 * Ping message schema
 */
export const PingMessageSchema = BaseMessageSchema.extend({
  type: z.literal('ping'),
  client_timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
});

/**
 * Join room message schema
 */
export const JoinRoomMessageSchema = BaseMessageSchema.extend({
  type: z.literal('join_room'),
  room_id: z.string(),
});

/**
 * Leave room message schema
 */
export const LeaveRoomMessageSchema = BaseMessageSchema.extend({
  type: z.literal('leave_room'),
  room_id: z.string(),
});

/**
 * Send chat message schema
 */
export const SendChatMessageSchema = BaseMessageSchema.extend({
  type: z.literal('send_chat'),
  room_id: z.string(),
  content: z.string(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  })).optional(),
});

/**
 * Subscribe to patient updates schema
 */
export const SubscribePatientUpdatesSchema = BaseMessageSchema.extend({
  type: z.literal('subscribe_patient_updates'),
  patient_ids: z.array(z.string().uuid()),
});

/**
 * Subscribe to AI analysis status schema
 */
export const SubscribeAiAnalysisStatusSchema = BaseMessageSchema.extend({
  type: z.literal('subscribe_ai_analysis'),
  analysis_ids: z.array(z.string().uuid()),
});

// ==========================================================
// Union schemas
// ==========================================================

/**
 * All server message schemas (messages received from server)
 */
export const ServerMessageSchema = z.discriminatedUnion('type', [
  ErrorMessageSchema,
  ConnectionStatusMessageSchema,
  NotificationMessageSchema,
  PatientUpdateMessageSchema,
  AiAnalysisStatusMessageSchema,
  ChatMessageSchema,
  SystemStatusMessageSchema,
  PongMessageSchema,
]);

/**
 * All client message schemas (messages sent to server)
 */
export const ClientMessageSchema = z.discriminatedUnion('type', [
  AuthMessageSchema,
  PingMessageSchema,
  JoinRoomMessageSchema,
  LeaveRoomMessageSchema,
  SendChatMessageSchema,
  SubscribePatientUpdatesSchema,
  SubscribeAiAnalysisStatusSchema,
]);

// ==========================================================
// Type definitions based on the schemas
// ==========================================================

/**
 * Base message type
 */
export type BaseMessage = z.infer<typeof BaseMessageSchema>;

/**
 * Server message types (messages received from server)
 */
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type ConnectionStatusMessage = z.infer<typeof ConnectionStatusMessageSchema>;
export type NotificationMessage = z.infer<typeof NotificationMessageSchema>;
export type PatientUpdateMessage = z.infer<typeof PatientUpdateMessageSchema>;
export type AiAnalysisStatusMessage = z.infer<typeof AiAnalysisStatusMessageSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type SystemStatusMessage = z.infer<typeof SystemStatusMessageSchema>;
export type PongMessage = z.infer<typeof PongMessageSchema>;

/**
 * Union type for all server messages
 */
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/**
 * Client message types (messages sent to server)
 */
export type AuthMessage = z.infer<typeof AuthMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type JoinRoomMessage = z.infer<typeof JoinRoomMessageSchema>;
export type LeaveRoomMessage = z.infer<typeof LeaveRoomMessageSchema>;
export type SendChatMessage = z.infer<typeof SendChatMessageSchema>;
export type SubscribePatientUpdatesMessage = z.infer<typeof SubscribePatientUpdatesSchema>;
export type SubscribeAiAnalysisStatusMessage = z.infer<typeof SubscribeAiAnalysisStatusSchema>;

/**
 * Union type for all client messages
 */
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

/**
 * Message handler function type
 */
export type MessageHandler<T extends ServerMessage> = (message: T) => void;

/**
 * Type guard for checking if a message is of a specific type
 */
export function isMessageType<T extends ServerMessage['type']>(
  message: ServerMessage,
  type: T
): message is Extract<ServerMessage, { type: T }> {
  return message.type === type;
} 