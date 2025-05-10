/**
 * AI Service Types and Key Configuration
 * 
 * This file defines the service types used throughout the application
 * and maps them to specific environment variables for API keys.
 * 
 * This is important for load balancing AI requests across different
 * API keys based on their domain and importance.
 */

/**
 * Enum representing the different AI service types
 * Used for routing requests to the appropriate AI models and API keys
 */
export enum AIServiceType {
  // Clinical services
  DIAGNOSIS = 'diagnosis',           // Patient symptom analysis and diagnosis suggestions
  TREATMENT = 'treatment',           // Treatment planning and note generation
  XRAY = 'xray',                     // X-ray image analysis
  
  // Financial services
  FINANCIAL = 'financial',           // Financial analysis and predictions
  INSURANCE = 'insurance',           // Insurance coding and optimization
  
  // Communication services
  PATIENT_COMMUNICATION = 'communication', // Patient communication and education
  
  // Administrative services
  SCHEDULING = 'scheduling',         // Appointment optimization
}

/**
 * Maps service types to specific OpenAI API keys based on domain
 * This allows for load distribution and specialization
 */
export const SERVICE_TYPE_TO_KEY_MAP: Record<AIServiceType, string> = {
  [AIServiceType.DIAGNOSIS]: 'DIAGNOSIS_AI_KEY',
  [AIServiceType.TREATMENT]: 'TREATMENT_AI_KEY',
  [AIServiceType.XRAY]: 'XRAY_AI_KEY',
  [AIServiceType.FINANCIAL]: 'FINANCIAL_AI_KEY',
  [AIServiceType.INSURANCE]: 'FINANCIAL_AI_KEY',
  [AIServiceType.PATIENT_COMMUNICATION]: 'CHAT_AI_KEY',
  [AIServiceType.SCHEDULING]: 'SCHEDULING_AI_KEY',
};

/**
 * Default priority levels for different service types
 * Higher numbers indicate higher priority
 */
export const SERVICE_TYPE_PRIORITY: Record<AIServiceType, number> = {
  [AIServiceType.DIAGNOSIS]: 10,     // Clinical diagnosis is highest priority
  [AIServiceType.TREATMENT]: 8,      // Treatment planning is high priority
  [AIServiceType.XRAY]: 9,          // X-ray analysis is high priority
  [AIServiceType.FINANCIAL]: 5,      // Financial analysis is medium priority
  [AIServiceType.INSURANCE]: 6,      // Insurance processing is medium-high priority
  [AIServiceType.PATIENT_COMMUNICATION]: 4, // Communication is medium-low priority
  [AIServiceType.SCHEDULING]: 3,     // Scheduling is lower priority
};

/**
 * Default models to use for each service type
 */
export const SERVICE_TYPE_DEFAULT_MODEL: Record<AIServiceType, string> = {
  [AIServiceType.DIAGNOSIS]: 'gpt-4',
  [AIServiceType.TREATMENT]: 'gpt-4',
  [AIServiceType.XRAY]: 'gpt-4-vision-preview',
  [AIServiceType.FINANCIAL]: 'gpt-4',
  [AIServiceType.INSURANCE]: 'gpt-4',
  [AIServiceType.PATIENT_COMMUNICATION]: 'gpt-4',
  [AIServiceType.SCHEDULING]: 'gpt-3.5-turbo',
};

/**
 * Fallback model to use if the preferred model is unavailable
 */
export const FALLBACK_MODEL = 'gpt-3.5-turbo';

/**
 * Max tokens to use for different model types
 */
export const MODEL_MAX_TOKENS: Record<string, number> = {
  'gpt-4': 4096,
  'gpt-4-vision-preview': 4096,
  'gpt-3.5-turbo': 2048,
};

/**
 * System prompts for each service type
 */
export const SERVICE_TYPE_SYSTEM_PROMPTS: Record<AIServiceType, string> = {
  [AIServiceType.DIAGNOSIS]: 
    'You are an AI dental diagnostic assistant helping dental professionals analyze patient symptoms and clinical findings.',
  
  [AIServiceType.TREATMENT]: 
    'You are an AI dental treatment planning assistant helping dental professionals create comprehensive treatment plans.',
  
  [AIServiceType.XRAY]: 
    'You are an AI dental radiography specialist that can analyze dental x-rays and identify pathology with high accuracy.',
  
  [AIServiceType.FINANCIAL]: 
    'You are an AI financial analyst for dental practices, specializing in revenue projections, expense analysis, and billing optimization.',
  
  [AIServiceType.INSURANCE]: 
    'You are an AI dental insurance specialist, helping with insurance verification, claims processing, and coding optimization.',
  
  [AIServiceType.PATIENT_COMMUNICATION]: 
    'You are an AI communication specialist for dental practices, helping create personalized, clear communications with patients.',
  
  [AIServiceType.SCHEDULING]: 
    'You are an AI scheduling assistant for dental practices, optimizing appointment scheduling and provider utilization.',
};