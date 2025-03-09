/**
 * AI Key Management System
 * 
 * This module manages the distribution of AI tasks across different API keys
 * to optimize performance, prevent rate limiting, and ensure system reliability.
 */

import { OpenAI } from 'openai';

// Define AI service types for different task categories
export enum AIServiceType {
  DIAGNOSIS = 'diagnosis',
  XRAY_ANALYSIS = 'xray_analysis',
  TREATMENT_PLANNING = 'treatment_planning',
  FINANCIAL = 'financial',
  SCHEDULING = 'scheduling',
  PATIENT_COMMUNICATION = 'patient_communication'
}

// Configuration type for AI keys
export interface AIKeyConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  backup?: AIKeyConfig;
  rateLimitPerMinute?: number;
}

// Usage tracking for AI keys
interface UsageStats {
  requestCount: number;
  lastRequestTime: number;
  tokensUsed: number;
}

// Default configuration if specialized keys aren't available
const DEFAULT_OPENAI_CONFIG: AIKeyConfig = {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  rateLimitPerMinute: 60
};

// Service-specific configurations
const AI_SERVICE_CONFIGS: Record<AIServiceType, AIKeyConfig> = {
  [AIServiceType.DIAGNOSIS]: {
    provider: 'openai',
    apiKey: process.env.DIAGNOSIS_AI_KEY || process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.3,
    rateLimitPerMinute: 50,
    backup: DEFAULT_OPENAI_CONFIG
  },
  [AIServiceType.XRAY_ANALYSIS]: {
    provider: 'openai',
    apiKey: process.env.XRAY_AI_KEY || process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-vision-preview',
    maxTokens: 1000,
    temperature: 0.2,
    rateLimitPerMinute: 30,
    backup: DEFAULT_OPENAI_CONFIG
  },
  [AIServiceType.TREATMENT_PLANNING]: {
    provider: 'openai',
    apiKey: process.env.TREATMENT_AI_KEY || process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 3000,
    temperature: 0.7,
    rateLimitPerMinute: 40,
    backup: DEFAULT_OPENAI_CONFIG
  },
  [AIServiceType.FINANCIAL]: {
    provider: 'openai',
    apiKey: process.env.FINANCIAL_AI_KEY || process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.2,
    rateLimitPerMinute: 30,
    backup: DEFAULT_OPENAI_CONFIG
  },
  [AIServiceType.SCHEDULING]: {
    provider: 'openai',
    apiKey: process.env.SCHEDULING_AI_KEY || process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.3,
    rateLimitPerMinute: 100,
    backup: DEFAULT_OPENAI_CONFIG
  },
  [AIServiceType.PATIENT_COMMUNICATION]: {
    provider: 'openai',
    apiKey: process.env.CHAT_AI_KEY || process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 1500,
    temperature: 0.7,
    rateLimitPerMinute: 80,
    backup: DEFAULT_OPENAI_CONFIG
  }
};

// Store API usage statistics
const apiUsage: Record<AIServiceType, UsageStats> = {
  [AIServiceType.DIAGNOSIS]: { requestCount: 0, lastRequestTime: 0, tokensUsed: 0 },
  [AIServiceType.XRAY_ANALYSIS]: { requestCount: 0, lastRequestTime: 0, tokensUsed: 0 },
  [AIServiceType.TREATMENT_PLANNING]: { requestCount: 0, lastRequestTime: 0, tokensUsed: 0 },
  [AIServiceType.FINANCIAL]: { requestCount: 0, lastRequestTime: 0, tokensUsed: 0 },
  [AIServiceType.SCHEDULING]: { requestCount: 0, lastRequestTime: 0, tokensUsed: 0 },
  [AIServiceType.PATIENT_COMMUNICATION]: { requestCount: 0, lastRequestTime: 0, tokensUsed: 0 }
};

/**
 * Get the configuration for a specific AI service type
 */
export function getAIConfig(serviceType: AIServiceType): AIKeyConfig {
  return AI_SERVICE_CONFIGS[serviceType] || DEFAULT_OPENAI_CONFIG;
}

/**
 * Track API usage for monitoring purposes
 */
export function trackAPIUsage(serviceType: AIServiceType, tokens: number): void {
  const now = Date.now();
  apiUsage[serviceType].requestCount++;
  apiUsage[serviceType].lastRequestTime = now;
  apiUsage[serviceType].tokensUsed += tokens;
}

/**
 * Get current API usage statistics
 */
export function getAPIUsageStats(): Record<AIServiceType, UsageStats> {
  return apiUsage;
}

/**
 * Calculate current request rate for an AI service
 * Returns requests per minute based on recent usage
 */
export function calculateCurrentRate(serviceType: AIServiceType): number {
  const stats = apiUsage[serviceType];
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // If no recent requests, rate is 0
  if (stats.lastRequestTime < oneMinuteAgo) {
    return 0;
  }
  
  // Calculate requests per minute based on the time window
  const timeSinceFirstRequest = now - (now - 60000);
  const requestsPerMinute = stats.requestCount * (60000 / timeSinceFirstRequest);
  
  return requestsPerMinute;
}

/**
 * Determine if we should use the backup API key based on rate limits and priority
 * This helps prevent rate limiting errors by switching to backup keys
 */
export function shouldUseBackup(serviceType: AIServiceType): boolean {
  const config = AI_SERVICE_CONFIGS[serviceType];
  if (!config.rateLimitPerMinute || !config.backup) return false;
  
  const stats = apiUsage[serviceType];
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // If last request was more than a minute ago, no need for backup
  if (stats.lastRequestTime < oneMinuteAgo) {
    return false;
  }
  
  // Get current rate
  const currentRate = calculateCurrentRate(serviceType);
  
  // If we've exceeded 80% of the rate limit, use backup to prevent hitting limits
  const rateThreshold = config.rateLimitPerMinute * 0.8;
  return currentRate >= rateThreshold;
}

/**
 * Get the optimal AI configuration based on current usage and service priority
 * Will return the main config, backup, or fallback to shared key based on load
 */
export function getOptimalAIConfig(serviceType: AIServiceType): AIKeyConfig {
  const config = getAIConfig(serviceType);
  
  // Check if we need to use backup
  if (shouldUseBackup(serviceType) && config.backup) {
    // If the backup key is also rate limited, fall back to shared default
    if (config.backup.apiKey !== DEFAULT_OPENAI_CONFIG.apiKey && 
        shouldUseSharedDefault(config.backup)) {
      console.log(`Both primary and backup keys for ${serviceType} are rate limited, using shared default`);
      return DEFAULT_OPENAI_CONFIG;
    }
    console.log(`Using backup key for ${serviceType} due to rate limiting`);
    return config.backup;
  }
  
  return config;
}

/**
 * Determine if a specific API key config should fall back to the shared default
 * Used to check if backup keys are also approaching rate limits
 */
function shouldUseSharedDefault(config: AIKeyConfig): boolean {
  // Find which service uses this API key
  let matchingService: AIServiceType | null = null;
  
  for (const [service, serviceConfig] of Object.entries(AI_SERVICE_CONFIGS)) {
    if (serviceConfig.apiKey === config.apiKey) {
      matchingService = service as AIServiceType;
      break;
    }
  }
  
  if (!matchingService) return false;
  
  // Check if this service is approaching rate limits
  const stats = apiUsage[matchingService];
  if (!stats || !config.rateLimitPerMinute) return false;
  
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // If no recent requests, no need to use default
  if (stats.lastRequestTime < oneMinuteAgo) {
    return false;
  }
  
  // Calculate rate and check if approaching limits
  const currentRate = calculateCurrentRate(matchingService);
  const rateThreshold = config.rateLimitPerMinute * 0.9;
  
  return currentRate >= rateThreshold;
}

/**
 * Get AI services status for monitoring dashboard
 */
export function getAIServicesStatus(): Record<string, {
  status: 'available' | 'limited' | 'unavailable',
  usage: number,
  rateLimitPerMinute?: number
}> {
  const status: Record<string, any> = {};
  
  Object.entries(AIServiceType).forEach(([key, serviceType]) => {
    // Skip numeric enum values
    if (!isNaN(Number(key))) return;
    
    const config = getAIConfig(serviceType as AIServiceType);
    const stats = apiUsage[serviceType as AIServiceType];
    const rateLimit = config.rateLimitPerMinute || 60;
    
    // Calculate usage percentage based on rate limit
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = stats.lastRequestTime > oneMinuteAgo ? stats.requestCount : 0;
    const usagePercentage = (recentRequests / rateLimit) * 100;
    
    let serviceStatus: 'available' | 'limited' | 'unavailable' = 'available';
    if (usagePercentage > 90) {
      serviceStatus = 'unavailable';
    } else if (usagePercentage > 70) {
      serviceStatus = 'limited';
    }
    
    status[serviceType] = {
      status: serviceStatus,
      usage: usagePercentage,
      rateLimitPerMinute: rateLimit
    };
  });
  
  return status;
}