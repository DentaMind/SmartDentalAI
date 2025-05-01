export enum CommunicationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  VOICE = 'voice',
}

export enum CommunicationIntent {
  BOOK_APPOINTMENT = 'book_appointment',
  CANCEL_APPOINTMENT = 'cancel_appointment',
  REQUEST_AVAILABILITY = 'request_availability',
  PAYMENT_REQUEST = 'payment_request',
  PAYMENT_QUESTION = 'payment_question',
  VERIFY_COVERAGE = 'verify_coverage',
  INSURANCE_QUESTION = 'insurance_question',
  LAB_RESULTS = 'lab_results',
  URGENT = 'urgent',
  GENERAL = 'general',
}

export enum MessageCategory {
  APPOINTMENT = 'appointment',
  PAYMENT = 'payment',
  INSURANCE = 'insurance',
  LAB_RESULTS = 'lab_results',
  GENERAL = 'general',
  URGENT = 'urgent',
}

export interface CommunicationMessage {
  patient_id: number;
  subject?: string;
  body: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface CommunicationLog {
  id: number;
  patient_id: number;
  channel: CommunicationChannel;
  message_type: MessageCategory;
  subject?: string;
  body: string;
  status: string;
  intent?: CommunicationIntent;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  response_received_at?: string;
  metadata?: Record<string, any>;
  error_message?: string;
}

export interface CommunicationPreference {
  id: number;
  patient_id: number;
  preferred_channel: CommunicationChannel;
  allow_sms: boolean;
  allow_voice: boolean;
  allow_email: boolean;
  allow_urgent_calls: boolean;
  allow_sensitive_emails: boolean;
  sms_consent_date?: string;
  voice_consent_date?: string;
  email_consent_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationAnalytics {
  total_messages: number;
  by_channel: Record<CommunicationChannel, number>;
  by_category: Record<MessageCategory, number>;
  by_intent: Record<CommunicationIntent, number>;
  average_response_time: number;
  success_rate: number;
  escalation_count: number;
  most_effective_channel: CommunicationChannel;
  busiest_hours: number[];
  busiest_days: string[];
} 