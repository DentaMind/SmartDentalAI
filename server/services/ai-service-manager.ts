import { OpenAI } from 'openai';
import { 
  AIServiceType, 
  getOptimalAIConfig, 
  trackAPIUsage, 
  getAIServicesStatus
} from '../config/ai-keys';
import { aiRequestQueue } from './ai-request-queue';

/**
 * AI Service Manager
 * This service handles different AI functionalities using the appropriate AI keys
 * to prevent bottlenecks and distribute load.
 */
class AIServiceManager {
  private openAIClients: Record<string, OpenAI> = {};

  constructor() {
    // Initialize OpenAI clients for each service type
    Object.values(AIServiceType).forEach(serviceType => {
      this.getOpenAIClient(serviceType);
    });
  }

  /**
   * Gets an OpenAI client for a specific service type
   */
  private getOpenAIClient(serviceType: AIServiceType): OpenAI {
    // Get the optimal configuration based on current load
    const config = getOptimalAIConfig(serviceType);
    
    if (!config.apiKey) {
      throw new Error(`No API key found for service type: ${serviceType}`);
    }

    // Create a cache key that includes the API key to handle key rotation
    const cacheKey = `${serviceType}_${config.apiKey.substring(0, 8)}`;
    
    // Check if we already have a client with this API key
    if (!this.openAIClients[cacheKey]) {
      console.log(`Creating new OpenAI client for ${serviceType} with key ending in ${config.apiKey.slice(-4)}`);
      
      this.openAIClients[cacheKey] = new OpenAI({
        apiKey: config.apiKey,
        organization: process.env.OPENAI_ORGANIZATION_ID,
        baseURL: config.baseUrl
      });
    }
    
    return this.openAIClients[cacheKey];
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
      const client = this.getOpenAIClient(AIServiceType.TREATMENT_PLANNING);
      const config = getOptimalAIConfig(AIServiceType.TREATMENT_PLANNING);

      const response = await client.chat.completions.create({
        model: config.model || 'gpt-4',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: 'You are a dental treatment planner with expertise in creating comprehensive care plans. Consider the diagnosis, patient history, and insurance coverage to propose an optimal sequence of treatments.'
          },
          {
            role: 'user',
            content: `Diagnosis: ${diagnosis}\n${patientHistory ? `Patient history: ${patientHistory}` : ''}${insuranceProvider ? `\nInsurance: ${insuranceProvider}` : ''}`
          }
        ]
      });

      trackAPIUsage(AIServiceType.TREATMENT_PLANNING, response.usage?.total_tokens || 0);
      return {
        treatmentPlan: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error: any) {
      console.error('Error generating treatment plan:', error.message);
      throw error;
    }
  }

  /**
   * Generate financial forecast for the practice
   */
  async generateFinancialForecast(historicalData: any, months: number = 12): Promise<any> {
    try {
      const client = this.getOpenAIClient(AIServiceType.FINANCIAL);
      const config = getOptimalAIConfig(AIServiceType.FINANCIAL);

      const response = await client.chat.completions.create({
        model: config.model || 'gpt-4',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: 'You are a dental practice financial analyst with expertise in forecasting revenue, expenses, and cash flow. Analyze the historical data and generate a forecast for the specified number of months.'
          },
          {
            role: 'user',
            content: `Please generate a ${months}-month financial forecast based on this historical data: ${JSON.stringify(historicalData)}`
          }
        ]
      });

      trackAPIUsage(AIServiceType.FINANCIAL, response.usage?.total_tokens || 0);
      return {
        forecast: this.parseFinancialForecast(response.choices[0].message.content || ''),
        rawResponse: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error: any) {
      console.error('Error generating financial forecast:', error.message);
      throw error;
    }
  }

  /**
   * Generate optimal scheduling suggestions
   */
  async generateSchedulingSuggestions(
    doctorAvailability: any,
    patientPreferences: any,
    procedureType: string
  ): Promise<any> {
    try {
      const client = this.getOpenAIClient(AIServiceType.SCHEDULING);
      const config = getOptimalAIConfig(AIServiceType.SCHEDULING);

      const response = await client.chat.completions.create({
        model: config.model || 'gpt-3.5-turbo', // Using a faster, cheaper model for scheduling
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: 'You are a dental practice scheduling assistant with expertise in optimizing appointment schedules. Consider doctor availability, patient preferences, and procedure type to suggest optimal appointment times.'
          },
          {
            role: 'user',
            content: `Please suggest optimal appointment times given:
Doctor availability: ${JSON.stringify(doctorAvailability)}
Patient preferences: ${JSON.stringify(patientPreferences)}
Procedure type: ${procedureType}`
          }
        ]
      });

      trackAPIUsage(AIServiceType.SCHEDULING, response.usage?.total_tokens || 0);
      return {
        suggestions: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error: any) {
      console.error('Error generating scheduling suggestions:', error.message);
      throw error;
    }
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
      const client = this.getOpenAIClient(AIServiceType.PATIENT_COMMUNICATION);
      const config = getOptimalAIConfig(AIServiceType.PATIENT_COMMUNICATION);

      const response = await client.chat.completions.create({
        model: config.model || 'gpt-4',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: 'You are a dental practice communication specialist with expertise in creating personalized messages for patients. Consider the patient information and communication type to generate an appropriate message.'
          },
          {
            role: 'user',
            content: `Please generate a ${communicationType} message for this patient: ${JSON.stringify(patientInfo)}${customDetails ? `\nAdditional details: ${customDetails}` : ''}`
          }
        ]
      });

      trackAPIUsage(AIServiceType.PATIENT_COMMUNICATION, response.usage?.total_tokens || 0);
      return {
        message: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error: any) {
      console.error('Error generating patient communication:', error.message);
      throw error;
    }
  }

  /**
   * Get the status of all AI services
   */
  getAIStatus(): Record<string, {
    status: 'available' | 'limited' | 'unavailable',
    usage: number,
    rateLimitPerMinute?: number
  }> {
    return getAIServicesStatus();
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