/**
 * Enum representing the different AI service types
 * Used for routing requests to the appropriate AI models and API keys
 */
export enum AIServiceType {
  // Clinical services
  DIAGNOSIS = 'diagnosis',         // Patient symptom analysis and diagnosis suggestions
  TREATMENT = 'treatment',         // Treatment planning and note generation
  XRAY = 'xray',                   // X-ray image analysis
  
  // Financial services
  FINANCIAL = 'financial',         // Financial analysis and predictions
  INSURANCE = 'insurance',         // Insurance coding and optimization
  
  // Communication services
  COMMUNICATION = 'communication', // Patient communication and education
  
  // Administrative services
  SCHEDULING = 'scheduling',       // Appointment optimization
}

/**
 * Maps service types to specific OpenAI API keys based on domain
 * This allows for load distribution and specialization
 */
export const SERVICE_TYPE_TO_KEY_MAP: Record<AIServiceType, string> = {
  [AIServiceType.DIAGNOSIS]: 'OPENAI_API_KEY_DIAGNOSIS',
  [AIServiceType.TREATMENT]: 'OPENAI_API_KEY_TREATMENT', 
  [AIServiceType.XRAY]: 'OPENAI_API_KEY_XRAY',
  [AIServiceType.FINANCIAL]: 'OPENAI_API_KEY_FINANCIAL',
  [AIServiceType.INSURANCE]: 'OPENAI_API_KEY_FINANCIAL',
  [AIServiceType.COMMUNICATION]: 'OPENAI_API_KEY_COMMUNICATION',
  [AIServiceType.SCHEDULING]: 'OPENAI_API_KEY_SCHEDULING',
};

/**
 * Default priority levels for different service types
 * Higher numbers indicate higher priority
 */
export const SERVICE_TYPE_PRIORITY: Record<AIServiceType, number> = {
  [AIServiceType.DIAGNOSIS]: 10,      // Highest priority - immediate patient care
  [AIServiceType.TREATMENT]: 8,       // High priority - active patient treatment
  [AIServiceType.XRAY]: 7,            // High priority - diagnostic imaging
  [AIServiceType.SCHEDULING]: 5,      // Medium priority - operational need
  [AIServiceType.COMMUNICATION]: 4,   // Medium-low priority - patient communication
  [AIServiceType.INSURANCE]: 3,       // Lower priority - administrative
  [AIServiceType.FINANCIAL]: 2,       // Lowest priority - reporting and analysis
};