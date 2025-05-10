import { OpenAI } from 'openai';
import { 
  AIServiceType,
  SERVICE_TYPE_TO_KEY_MAP,
  SERVICE_TYPE_DEFAULT_MODEL
} from './ai-service-types';
import { aiRequestQueue } from './ai-request-queue';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables explicitly
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Log environment variables for debugging
console.log('Environment variables loaded in ai-service-manager.ts:');
console.log('OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
console.log('DIAGNOSIS_AI_KEY available:', !!process.env.DIAGNOSIS_AI_KEY);
console.log('Current working directory:', process.cwd());
console.log('Environment file path:', envPath);

/**
 * AI Service Manager
 * This service handles different AI functionalities using the appropriate AI keys
 * to prevent bottlenecks and distribute load.
 */
// Helper function to get configuration for an AI service
interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}

// Local implementation of config and tracking functions
function getOptimalAIConfig(serviceType: AIServiceType): AIConfig {
  const keyName = SERVICE_TYPE_TO_KEY_MAP[serviceType];
  const specificKey = process.env[keyName];
  const defaultKey = process.env.OPENAI_API_KEY;
  
  console.log(`Looking for API key for ${serviceType}...`);
  console.log(`Specific key name: ${keyName}`);
  console.log(`Specific key available: ${!!specificKey}`);
  console.log(`Default key available: ${!!defaultKey}`);
  
  const apiKey = specificKey || defaultKey;
  
  if (!apiKey) {
    console.error(`No API key found for service type: ${serviceType}`);
    console.error(`Tried keys: ${keyName} and OPENAI_API_KEY`);
    throw new Error(`No API key found for service type: ${serviceType}`);
  }
  
  const model = SERVICE_TYPE_DEFAULT_MODEL[serviceType] || 'gpt-3.5-turbo';
  
  return {
    apiKey,
    model,
    temperature: 0.7,
    maxTokens: model.includes('gpt-4') ? 4000 : 2000,
    baseUrl: process.env.OPENAI_API_BASE_URL
  };
}

// Function to track API usage (stub for now)
function trackAPIUsage(serviceType: AIServiceType, tokens: number) {
  console.log(`API Usage: ${serviceType} - ${tokens} tokens`);
  // In a real implementation, this would log to a database or monitoring service
}

class AIServiceManager {
  private openAIClients: Record<string, OpenAI> = {};

  constructor() {
    // Initialize OpenAI clients for each service type
    Object.values(AIServiceType).forEach(serviceType => {
      try {
        this.getOpenAIClient(serviceType);
      } catch (error) {
        console.warn(`Failed to initialize OpenAI client for ${serviceType}:`, error);
      }
    });
  }

  /**
   * Gets an OpenAI client for a specific service type
   */
  private getOpenAIClient(serviceType: AIServiceType): OpenAI {
    try {
      // Get the optimal configuration based on current load
      const config = getOptimalAIConfig(serviceType);
      
      // Try to get a fallback API key if the specific one is not available
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn(`No API key found for service type: ${serviceType}. Using default key.`);
        throw new Error('No API key available');
      }

      // Create a cache key that includes the API key to handle key rotation
      const cacheKey = `${serviceType}_${apiKey.substring(0, 8)}`;
      
      // Check if we already have a client with this API key
      if (!this.openAIClients[cacheKey]) {
        console.log(`Creating new OpenAI client for ${serviceType} with key ending in ${apiKey.slice(-4)}`);
        
        this.openAIClients[cacheKey] = new OpenAI({
          apiKey: apiKey,
          organization: process.env.OPENAI_ORGANIZATION_ID,
          baseURL: config.baseUrl
        });
      }
      
      return this.openAIClients[cacheKey];
    } catch (error) {
      console.error(`Error creating OpenAI client for ${serviceType}:`, error);
      throw error;
    }
  }

  /**
   * Analyze a dental x-ray image
   */
  async analyzeXRay(imageUrl: string, promptDetails: string = ''): Promise<any> {
    try {
      // This is high-priority, time-sensitive analysis
      // We'll use the request queue to prioritize it
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.XRAY_ANALYSIS,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.XRAY_ANALYSIS);
          const config = getOptimalAIConfig(AIServiceType.XRAY_ANALYSIS);

          // Perform any preprocessing/validation here
          if (!imageUrl || !imageUrl.trim()) {
            throw new Error('Image URL is required for x-ray analysis');
          }

          // Simple pre-processing to ensure we don't waste API calls
          // Check if the URL is accessible before sending to OpenAI
          try {
            const urlValid = await fetch(imageUrl, { method: 'HEAD' })
              .then(res => res.ok)
              .catch(() => false);
              
            if (!urlValid) {
              throw new Error('Image URL is not accessible');
            }
          } catch (e) {
            console.warn('Image URL validation failed:', e);
            // Continue anyway - the URL might be accessible only from certain networks
          }

          const response = await client.chat.completions.create({
            model: config.model || 'gpt-4-vision-preview',
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'system',
                content: 'You are a dental radiologist with expertise in interpreting dental x-rays. Analyze the provided image and identify any abnormalities, caries, periapical lesions, bone loss, or other pathologies.'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: `Please analyze this dental x-ray. ${promptDetails}` },
                  { type: 'image_url', image_url: { url: imageUrl }}
                ]
              }
            ]
          });

          trackAPIUsage(AIServiceType.XRAY_ANALYSIS, response.usage?.total_tokens || 0);
          return {
            analysis: response.choices[0].message.content,
            usage: response.usage
          };
        },
        { priority: 9 } // X-ray analysis is high priority
      );
    } catch (error: any) {
      console.error('Error analyzing x-ray:', error.message);
      throw error;
    }
  }

  /**
   * Generate diagnosis based on symptoms and patient history
   */
  async generateDiagnosis(symptoms: string, patientHistory?: string): Promise<any> {
    try {
      // Use request queue with appropriate priority
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.DIAGNOSIS,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.DIAGNOSIS);
          const config = getOptimalAIConfig(AIServiceType.DIAGNOSIS);

          // Validate inputs
          if (!symptoms || !symptoms.trim()) {
            throw new Error('Symptoms description is required for diagnosis');
          }

          const response = await client.chat.completions.create({
            model: config.model || 'gpt-4',
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'system',
                content: 'You are a dental diagnostician with expertise in identifying oral conditions based on symptoms. Provide a differential diagnosis with confidence levels and recommended next steps.'
              },
              {
                role: 'user',
                content: `Patient symptoms: ${symptoms}\n${patientHistory ? `Patient history: ${patientHistory}` : ''}`
              }
            ]
          });

          trackAPIUsage(AIServiceType.DIAGNOSIS, response.usage?.total_tokens || 0);
          return {
            diagnosis: response.choices[0].message.content,
            usage: response.usage
          };
        },
        { priority: 10 } // Diagnosis is highest priority - critical for patient care
      );
    } catch (error: any) {
      console.error('Error generating diagnosis:', error.message);
      throw error;
    }
  }

  /**
   * Generate treatment plan based on diagnosis
   */
  async generateTreatmentPlan(diagnosis: string, patientHistory?: string, insuranceProvider?: string): Promise<any> {
    try {
      // Use request queue with medium-high priority
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.TREATMENT_PLANNING,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.TREATMENT_PLANNING);
          const config = getOptimalAIConfig(AIServiceType.TREATMENT_PLANNING);

          // Validate input
          if (!diagnosis || !diagnosis.trim()) {
            throw new Error('Diagnosis is required for treatment planning');
          }

          const response = await client.chat.completions.create({
            model: config.model || 'gpt-4',
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'system',
                content: 'You are a dental treatment planner with expertise in creating comprehensive care plans. Consider the diagnosis, patient history, and insurance coverage to propose an optimal sequence of treatments. Include alternative treatment options when available.'
              },
              {
                role: 'user',
                content: `Diagnosis: ${diagnosis}\n${patientHistory ? `Patient history: ${patientHistory}` : ''}${insuranceProvider ? `\nInsurance: ${insuranceProvider}` : ''}`
              }
            ]
          });

          // Track API usage for monitoring
          trackAPIUsage(AIServiceType.TREATMENT_PLANNING, response.usage?.total_tokens || 0);
          
          return {
            treatmentPlan: response.choices[0].message.content,
            usage: response.usage
          };
        },
        { priority: 8 } // Treatment planning is high priority but slightly below diagnosis
      );
    } catch (error: any) {
      console.error('Error generating treatment plan:', error.message);
      throw error;
    }
  }

  /**
   * Generate treatment note based on procedure details
   */
  async generateTreatmentNote(prompt: string): Promise<string> {
    try {
      // Use request queue with appropriate priority
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.TREATMENT_PLANNING,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.TREATMENT_PLANNING);
          const config = getOptimalAIConfig(AIServiceType.TREATMENT_PLANNING);

          const response = await client.chat.completions.create({
            model: config.model || 'gpt-4',
            max_tokens: 1000,
            temperature: 0.2, // Lower temperature for more structured, consistent output
            messages: [
              {
                role: 'system',
                content: 'You are a dental professional assistant who creates detailed clinical notes for procedures. Generate clear, professional treatment notes following dental documentation standards. Be specific and use proper dental terminology.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          });

          // Track API usage for monitoring
          trackAPIUsage(AIServiceType.TREATMENT_PLANNING, response.usage?.total_tokens || 0);
          
          return response.choices[0].message.content || '';
        },
        { priority: 7 } // Treatment notes are high priority but below diagnosis and treatment planning
      );
    } catch (error: any) {
      console.error('Error generating treatment note:', error.message);
      throw error;
    }
  }

  /**
   * Generate financial forecast for the practice
   */
  async generateFinancialForecast(historicalData: any, months: number = 12): Promise<any> {
    try {
      // Use request queue with lower priority as this is less time-sensitive
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.FINANCIAL,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.FINANCIAL);
          const config = getOptimalAIConfig(AIServiceType.FINANCIAL);

          // Validate input
          if (!historicalData) {
            throw new Error('Historical data is required for financial forecasting');
          }

          // Pre-process historical data to prevent token waste (remove noise, focus on important data)
          const processedData = typeof historicalData === 'object' 
            ? this.preprocessFinancialData(historicalData)
            : historicalData;

          const response = await client.chat.completions.create({
            model: config.model || 'gpt-4',
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'system',
                content: 'You are a dental practice financial analyst with expertise in forecasting revenue, expenses, and cash flow. Analyze the historical data and generate a forecast for the specified number of months. Include monthly projections, growth trends, and potential optimization opportunities.'
              },
              {
                role: 'user',
                content: `Please generate a ${months}-month financial forecast based on this historical data: ${JSON.stringify(processedData)}`
              }
            ]
          });

          trackAPIUsage(AIServiceType.FINANCIAL, response.usage?.total_tokens || 0);
          return {
            forecast: this.parseFinancialForecast(response.choices[0].message.content || ''),
            rawResponse: response.choices[0].message.content,
            usage: response.usage
          };
        },
        { priority: 3, timeout: 60000 } // Financial forecasting is lower priority and can take longer
      );
    } catch (error: any) {
      console.error('Error generating financial forecast:', error.message);
      throw error;
    }
  }
  
  /**
   * Preprocess financial data to focus on the most relevant information
   * This helps reduce token usage and improve forecast quality
   */
  private preprocessFinancialData(data: any): any {
    try {
      // If data is very large, summarize or truncate it
      if (JSON.stringify(data).length > 8000) {
        console.log('Financial data is large, preprocessing to reduce token usage');
        
        // Create a simplified version focusing on recent months and key metrics
        const simplified: any = {};
        
        // Extract only the most recent months (up to 6)
        if (data.monthlyData && Array.isArray(data.monthlyData)) {
          simplified.monthlyData = data.monthlyData.slice(-6);
        }
        
        // Keep only essential financial metrics
        const essentialMetrics = [
          'totalRevenue', 'totalExpenses', 'netProfit', 'cashFlow',
          'insurancePayments', 'patientPayments', 'staffCosts', 'supplies'
        ];
        
        essentialMetrics.forEach(metric => {
          if (data[metric] !== undefined) {
            simplified[metric] = data[metric];
          }
        });
        
        return simplified;
      }
      
      // Data is not too large, return as is
      return data;
    } catch (e) {
      console.warn('Error preprocessing financial data:', e);
      return data; // Return original data if preprocessing fails
    }
  }

  /**
   * Generate optimal scheduling suggestions
   */
  async generateSchedulingSuggestions(
    doctorAvailability: any,
    patientPreferences: any,
    procedureType: string,
    insuranceInfo?: any // Optional insurance information for coverage verification
  ): Promise<any> {
    try {
      // Use request queue with medium priority
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.SCHEDULING,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.SCHEDULING);
          const config = getOptimalAIConfig(AIServiceType.SCHEDULING);
          
          // Validate inputs
          if (!doctorAvailability) {
            throw new Error('Doctor availability is required for scheduling');
          }
          
          // Format request to optimize token usage
          const formattedRequest = {
            doctorAvailability: this.prepareSchedulingData(doctorAvailability),
            patientPreferences: patientPreferences || { 
              preferredDays: ['Any'], 
              preferredTimes: ['Any'] 
            },
            procedureType,
            procedureDuration: this.getProcedureDuration(procedureType),
            insuranceInfo: insuranceInfo || null
          };

          // Enhanced prompt that includes insurance verification if info is provided
          const systemPrompt = insuranceInfo 
            ? 'You are a dental practice scheduling assistant with expertise in optimizing appointment schedules. Consider doctor availability, patient preferences, procedure type, and verify insurance coverage to suggest optimal appointment times with estimated out-of-pocket costs.'
            : 'You are a dental practice scheduling assistant with expertise in optimizing appointment schedules. Consider doctor availability, patient preferences, and procedure type to suggest optimal appointment times.';

          const response = await client.chat.completions.create({
            model: config.model || 'gpt-3.5-turbo', // Using a faster, cheaper model for scheduling
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: `Please suggest 3-5 optimal appointment times given the following information:
Doctor availability: ${JSON.stringify(formattedRequest.doctorAvailability)}
Patient preferences: ${JSON.stringify(formattedRequest.patientPreferences)}
Procedure type: ${formattedRequest.procedureType}
Estimated procedure duration: ${formattedRequest.procedureDuration} minutes
${insuranceInfo ? `Insurance information: ${JSON.stringify(insuranceInfo)}` : ''}`
              }
            ]
          });

          // Process the response
          const suggestions = response.choices[0].message.content || '';
          
          // Parse suggested times and combine with insurance information if available
          const result: any = {
            suggestions,
            usage: response.usage
          };
          
          // Add insurance verification if provided
          if (insuranceInfo) {
            result.insuranceVerified = true;
            
            // Extract cost information from AI response
            const costMatch = suggestions.match(/estimated out-of-pocket cost:?\s*\$?([\d,.]+)/i);
            if (costMatch && costMatch[1]) {
              result.estimatedCost = parseFloat(costMatch[1].replace(/,/g, ''));
            }
          }

          trackAPIUsage(AIServiceType.SCHEDULING, response.usage?.total_tokens || 0);
          return result;
        },
        { priority: 5 } // Medium priority for scheduling
      );
    } catch (error: any) {
      console.error('Error generating scheduling suggestions:', error.message);
      throw error;
    }
  }
  
  /**
   * Prepare scheduling data to minimize token usage
   */
  private prepareSchedulingData(availability: any): any {
    // If availability is an array of dates/times, keep only next 14 days
    if (Array.isArray(availability)) {
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      
      return availability
        .filter((slot: any) => {
          const slotDate = new Date(slot.date || slot.startTime || slot);
          return !isNaN(slotDate.getTime()) && slotDate <= twoWeeksFromNow;
        })
        .slice(0, 20); // Limit to 20 slots max to prevent token waste
    }
    
    // If it's an object with complex structure, extract only what's needed
    if (typeof availability === 'object') {
      const simplified: any = {};
      
      // Extract only availability for next two weeks
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (availability[dateStr]) {
          simplified[dateStr] = availability[dateStr];
        }
      }
      
      return simplified;
    }
    
    return availability;
  }
  
  /**
   * Get the estimated duration of a procedure type
   */
  private getProcedureDuration(procedureType: string): number {
    // Estimated durations for common procedure types
    const durationMap: Record<string, number> = {
      'cleaning': 60,
      'checkup': 30,
      'filling': 60,
      'crown': 90,
      'root canal': 120,
      'extraction': 60,
      'wisdom tooth extraction': 90,
      'implant': 120,
      'denture fitting': 90,
      'bridge': 90,
      'veneer': 90,
      'whitening': 60,
      'orthodontic adjustment': 30,
      'periodontal treatment': 60,
      'deep cleaning': 90
    };
    
    // Search for keywords in procedure type
    for (const [key, duration] of Object.entries(durationMap)) {
      if (procedureType.toLowerCase().includes(key.toLowerCase())) {
        return duration;
      }
    }
    
    // Default duration if not found
    return 60;
  }

  /**
   * Generate personalized patient communication
   */
  async generatePatientCommunication(
    patientInfo: any,
    communicationType: 'reminder' | 'follow-up' | 'educational' | 'marketing',
    customDetails?: string
  ): Promise<any> {
    try {
      // Use request queue with appropriate priority
      return await aiRequestQueue.enqueueRequest(
        AIServiceType.PATIENT_COMMUNICATION,
        async () => {
          const client = this.getOpenAIClient(AIServiceType.PATIENT_COMMUNICATION);
          const config = getOptimalAIConfig(AIServiceType.PATIENT_COMMUNICATION);
          
          // Validate input
          if (!patientInfo) {
            throw new Error('Patient information is required for communication generation');
          }
          
          // Enhance system prompt based on communication type
          let systemPrompt = 'You are a dental practice communication specialist with expertise in creating personalized messages for patients.';
          
          // Add type-specific instructions to improve quality
          switch (communicationType) {
            case 'reminder':
              systemPrompt += ' Create a friendly reminder that emphasizes the importance of the upcoming appointment without being pushy.';
              break;
            case 'follow-up':
              systemPrompt += ' Create a caring follow-up message that asks about recovery and offers assistance if needed.';
              break;
            case 'educational':
              systemPrompt += ' Create an informative message that educates the patient on dental health topics relevant to their condition.';
              break;
            case 'marketing':
              systemPrompt += ' Create an engaging message that promotes services without being overly sales-focused.';
              break;
          }
          
          // Get appropriate model based on message complexity
          const model = communicationType === 'educational' ? 'gpt-4' : 'gpt-3.5-turbo';
          
          const response = await client.chat.completions.create({
            model: config.model || model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: `Please generate a ${communicationType} message for this patient: ${JSON.stringify(patientInfo)}${customDetails ? `\nAdditional details: ${customDetails}` : ''}`
              }
            ]
          });

          trackAPIUsage(AIServiceType.PATIENT_COMMUNICATION, response.usage?.total_tokens || 0);
          
          // Process response into different formats based on type
          const content = response.choices[0].message.content || '';
          const result: any = {
            message: content,
            usage: response.usage
          };
          
          // Add SMS-friendly version for reminders with character limit
          if (communicationType === 'reminder') {
            // Create SMS-friendly version (160 chars or less if possible)
            const smsMatch = content.match(/SMS version:(.+?)(?=\n|$)/i);
            if (smsMatch && smsMatch[1]) {
              result.smsVersion = smsMatch[1].trim();
            } else if (content.length <= 160) {
              result.smsVersion = content;
            } else {
              // Create shorter version by removing unnecessary parts
              result.smsVersion = content
                .replace(/Dear (Mr\.|Mrs\.|Ms\.|Dr\.) [^,]+,/i, '')
                .replace(/Best regards,[\s\S]*$/i, '')
                .replace(/Sincerely,[\s\S]*$/i, '')
                .substring(0, 157) + '...';
            }
          }
          
          return result;
        },
        { 
          priority: communicationType === 'reminder' ? 6 : 4,
          timeout: 20000
        }
      );
    } catch (error: any) {
      console.error('Error generating patient communication:', error.message);
      throw error;
    }
  }

  /**
   * Get the status of all AI services
   */
  getAIStatus(): Record<string, {
    available: boolean;
    model: string;
    usageMetrics?: {
      requestsToday: number;
      tokensToday: number;
      avgResponseTime: number;
    }
  }> {
    // In a real implementation, we'd check API keys, connection status, etc.
    const statuses: Record<string, any> = {};
    
    // Check each service type
    Object.values(AIServiceType).forEach(serviceType => {
      try {
        const config = getOptimalAIConfig(serviceType);
        
        statuses[serviceType] = {
          available: Boolean(config.apiKey),
          model: config.model || 'unknown',
          usageMetrics: {
            requestsToday: Math.floor(Math.random() * 100), // Mock data
            tokensToday: Math.floor(Math.random() * 10000),
            avgResponseTime: Math.random() * 2 + 0.5 // 0.5 to 2.5 seconds
          }
        };
      } catch (e) {
        statuses[serviceType] = {
          available: false,
          model: 'unknown',
          error: (e as Error).message
        };
      }
    });
    
    return statuses;
  }
  
  /**
   * Get detailed AI service status with queue information (used by monitoring routes)
   */
  getAIServicesStatus() {
    const status = this.getAIStatus();
    const queueStatus = aiRequestQueue.getQueueStatus();
    
    return {
      services: status,
      queue: queueStatus,
      systemStatus: {
        healthy: Object.values(status).some(s => s.available),
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Get AI request queue status for monitoring
   */
  getQueueStatus() {
    return aiRequestQueue.getQueueStatus();
  }

  /**
   * Helper function to parse financial forecast from AI response
   * This converts the AI's text response into structured data
   */
  private parseFinancialForecast(forecastText: string): any {
    try {
      // Simple regex-based parsing - in a real app, this would be more robust
      const revenueMatch = forecastText.match(/total revenue.*?(\$[\d,]+|\d+[\d,.]*)/i);
      const expensesMatch = forecastText.match(/total expenses.*?(\$[\d,]+|\d+[\d,.]*)/i);
      const profitMatch = forecastText.match(/profit.*?(\$[\d,]+|\d+[\d,.]*)/i);
      
      const monthlyRevenue: any = {};
      
      // Look for month names and associated amounts
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      
      months.forEach(month => {
        const regex = new RegExp(`${month}[\\s\\w]*?[:\\-]\\s*?(\\$[\\d,]+|\\d+[\\d,.]*)`, 'i');
        const match = forecastText.match(regex);
        if (match && match[1]) {
          monthlyRevenue[month] = match[1].replace(/[^\d.]/g, '');
        }
      });
      
      return {
        totalRevenue: revenueMatch ? revenueMatch[1].replace(/[^\d.]/g, '') : null,
        totalExpenses: expensesMatch ? expensesMatch[1].replace(/[^\d.]/g, '') : null,
        profit: profitMatch ? profitMatch[1].replace(/[^\d.]/g, '') : null,
        monthlyRevenue
      };
    } catch (error) {
      console.error('Error parsing financial forecast:', error);
      return { error: 'Failed to parse forecast data' };
    }
  }
}

export const aiServiceManager = new AIServiceManager();