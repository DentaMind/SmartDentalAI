/**
 * Enum representing the different AI service types
 * Used for routing requests to the appropriate AI models and API keys
 */
export enum AIServiceType {
  // Clinical services
  DIAGNOSIS = 'diagnosis',         // Patient symptom analysis and diagnosis suggestions
  TREATMENT = 'treatment',         // Treatment planning and note generation
  TREATMENT_PLANNING = 'treatment_planning', // Detailed treatment planning
  XRAY = 'xray',                   // X-ray image analysis
  XRAY_ANALYSIS = 'xray_analysis', // Detailed x-ray analysis
  
  // Financial services
  FINANCIAL = 'financial',         // Financial analysis and predictions
  INSURANCE = 'insurance',         // Insurance coding and optimization
  
  // Communication services
  COMMUNICATION = 'communication', // Patient communication and education
  PATIENT_COMMUNICATION = 'patient_communication', // Patient-specific communications
  
  // Administrative services
  SCHEDULING = 'scheduling',       // Appointment optimization
}

/**
 * Maps service types to specific OpenAI API keys based on domain
 * This allows for load distribution and specialization
 */
export const SERVICE_TYPE_TO_KEY_MAP: Record<AIServiceType, string> = {
  [AIServiceType.DIAGNOSIS]: 'DIAGNOSIS_AI_KEY',
  [AIServiceType.TREATMENT]: 'TREATMENT_AI_KEY', 
  [AIServiceType.TREATMENT_PLANNING]: 'TREATMENT_AI_KEY',
  [AIServiceType.XRAY]: 'XRAY_AI_KEY',
  [AIServiceType.XRAY_ANALYSIS]: 'XRAY_AI_KEY',
  [AIServiceType.FINANCIAL]: 'FINANCIAL_AI_KEY',
  [AIServiceType.INSURANCE]: 'FINANCIAL_AI_KEY',
  [AIServiceType.COMMUNICATION]: 'CHAT_AI_KEY',
  [AIServiceType.PATIENT_COMMUNICATION]: 'CHAT_AI_KEY',
  [AIServiceType.SCHEDULING]: 'SCHEDULING_AI_KEY',
};

/**
 * Default priority levels for different service types
 * Higher numbers indicate higher priority
 */
export const SERVICE_TYPE_PRIORITY: Record<AIServiceType, number> = {
  [AIServiceType.DIAGNOSIS]: 10,      // Highest priority - immediate patient care
  [AIServiceType.TREATMENT]: 8,       // High priority - active patient treatment
  [AIServiceType.TREATMENT_PLANNING]: 8, // High priority - treatment planning
  [AIServiceType.XRAY]: 7,            // High priority - diagnostic imaging
  [AIServiceType.XRAY_ANALYSIS]: 9,   // Higher priority - detailed diagnostic analysis
  [AIServiceType.SCHEDULING]: 5,      // Medium priority - operational need
  [AIServiceType.COMMUNICATION]: 4,   // Medium-low priority - patient communication
  [AIServiceType.PATIENT_COMMUNICATION]: 4, // Medium-low priority - patient-specific communications
  [AIServiceType.INSURANCE]: 3,       // Lower priority - administrative
  [AIServiceType.FINANCIAL]: 2,       // Lowest priority - reporting and analysis
};

/**
 * Default OpenAI models for each service type
 */
export const SERVICE_TYPE_DEFAULT_MODEL: Record<AIServiceType, string> = {
  [AIServiceType.DIAGNOSIS]: 'gpt-4',
  [AIServiceType.TREATMENT]: 'gpt-4', 
  [AIServiceType.TREATMENT_PLANNING]: 'gpt-4',
  [AIServiceType.XRAY]: 'gpt-4-vision-preview',
  [AIServiceType.XRAY_ANALYSIS]: 'gpt-4-vision-preview',
  [AIServiceType.FINANCIAL]: 'gpt-4',
  [AIServiceType.INSURANCE]: 'gpt-4',
  [AIServiceType.COMMUNICATION]: 'gpt-3.5-turbo',
  [AIServiceType.PATIENT_COMMUNICATION]: 'gpt-3.5-turbo',
  [AIServiceType.SCHEDULING]: 'gpt-3.5-turbo',
};