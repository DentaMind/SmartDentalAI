/**
 * AI Service Integration Manager
 *
 * This service provides a centralized interface for all AI-related functionality in DentaMind.
 * It manages multiple OpenAI instances with separate API keys for different domains:
 * - Diagnosis - For analyzing patient symptoms and medical conditions
 * - Treatment - For treatment planning and procedure recommendations
 * - X-ray - For analyzing dental X-rays and imaging
 * - Financial - For financial forecasting and insurance optimization
 * - Scheduling - For optimizing appointment scheduling
 * - Communication - For patient communication
 */

import OpenAI from "openai";
import { z } from "zod";
import { SymptomPrediction, symptomPredictionSchema } from "./ai-prediction";
import { PatientMedicalHistory } from "@shared/schema";

// Define domain-specific API instances
const diagnosisAI = new OpenAI({ apiKey: process.env.DIAGNOSIS_AI_KEY });
const treatmentAI = new OpenAI({ apiKey: process.env.TREATMENT_AI_KEY });
const xrayAI = new OpenAI({ apiKey: process.env.XRAY_AI_KEY });
const financialAI = new OpenAI({ apiKey: process.env.FINANCIAL_AI_KEY });
const schedulingAI = new OpenAI({ apiKey: process.env.SCHEDULING_AI_KEY });
const communicationAI = new OpenAI({ apiKey: process.env.CHAT_AI_KEY });

// Default model settings
const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_TEMPERATURE = 0.7;
const STRUCTURED_TEMPERATURE = 0.2; // Lower temperature for structured outputs

// Service status tracking
interface ServiceStatus {
  available: boolean;
  lastCheck: Date;
  errorMessage?: string;
  requestsProcessed: number;
}

const serviceStatus: Record<string, ServiceStatus> = {
  diagnosis: { available: true, lastCheck: new Date(), requestsProcessed: 0 },
  treatment: { available: true, lastCheck: new Date(), requestsProcessed: 0 },
  xray: { available: true, lastCheck: new Date(), requestsProcessed: 0 },
  financial: { available: true, lastCheck: new Date(), requestsProcessed: 0 },
  scheduling: { available: true, lastCheck: new Date(), requestsProcessed: 0 },
  communication: { available: true, lastCheck: new Date(), requestsProcessed: 0 },
};

// Response schemas for different AI services
export const xrayAnalysisSchema = z.object({
  findings: z.array(z.object({
    type: z.enum(["caries", "periapical", "bone_loss", "restoration", "root_canal", "anomaly", "other"]),
    location: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    severity: z.enum(["mild", "moderate", "severe"]).optional(),
  })),
  analysis: z.string(),
  recommendations: z.array(z.string()),
  comparison: z.object({
    changes: z.array(z.string()),
    progression: z.enum(["improved", "stable", "worsened"])
  }).optional()
});

export const treatmentPlanSchema = z.object({
  procedures: z.array(z.object({
    name: z.string(),
    description: z.string(),
    urgency: z.enum(["immediate", "high", "moderate", "low", "elective"]),
    rationale: z.string(),
    estimatedCost: z.number().optional(),
    estimatedTime: z.string().optional(),
    specialtyRequired: z.enum(["general", "periodontics", "endodontics", "oral_surgery", "prosthodontics", "orthodontics"]).optional(),
  })),
  overallAssessment: z.string(),
  alternatives: z.array(z.object({
    name: z.string(),
    description: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })).optional(),
  followUp: z.string()
});

export const financialForecastSchema = z.object({
  monthlyRevenue: z.array(z.object({
    month: z.string(),
    amount: z.number(),
    growth: z.number()
  })),
  insights: z.array(z.string()),
  recommendations: z.array(z.string())
});

export const schedulingRecommendationSchema = z.object({
  optimizedSlots: z.array(z.object({
    date: z.string(),
    time: z.string(),
    duration: z.number(),
    patientType: z.string(),
    procedureType: z.string(),
    priority: z.number(),
    reasoning: z.string()
  })),
  insights: z.array(z.string())
});

export const patientCommunicationSchema = z.object({
  message: z.string(),
  subject: z.string().optional(),
  tone: z.enum(["professional", "empathetic", "urgent", "educational", "encouraging"]),
  keyPoints: z.array(z.string())
});

// Service class with retry logic and error handling
class AIServiceIntegration {
  
  /**
   * Get the current status of all AI services
   */
  getServiceStatus(): Record<string, ServiceStatus> {
    return serviceStatus;
  }

  /**
   * Check all AI services for availability
   */
  async checkAllServices(): Promise<Record<string, ServiceStatus>> {
    await Promise.allSettled([
      this.checkService("diagnosis", diagnosisAI),
      this.checkService("treatment", treatmentAI),
      this.checkService("xray", xrayAI),
      this.checkService("financial", financialAI),
      this.checkService("scheduling", schedulingAI),
      this.checkService("communication", communicationAI)
    ]);
    
    return serviceStatus;
  }

  /**
   * Check individual service availability
   */
  private async checkService(name: string, client: OpenAI): Promise<boolean> {
    try {
      // Perform a simple completion to validate the API key
      await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5
      });
      
      serviceStatus[name].available = true;
      serviceStatus[name].lastCheck = new Date();
      serviceStatus[name].errorMessage = undefined;
      return true;
    } catch (error) {
      serviceStatus[name].available = false;
      serviceStatus[name].lastCheck = new Date();
      serviceStatus[name].errorMessage = error instanceof Error ? error.message : "Unknown error";
      return false;
    }
  }

  /**
   * Generic AI processing with retry logic
   */
  private async processWithRetry<T>(
    service: string, 
    client: OpenAI,
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    options: {
      model?: string;
      temperature?: number;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    const {
      model = DEFAULT_MODEL,
      temperature = STRUCTURED_TEMPERATURE,
      maxRetries = 2
    } = options;
    
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries <= maxRetries) {
      try {
        const response = await client.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: temperature,
          response_format: { type: "json_object" }
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("No response content");
        }
        
        const result = JSON.parse(content);
        const validated = schema.parse(result);
        
        // Update service metrics
        serviceStatus[service].requestsProcessed += 1;
        serviceStatus[service].available = true;
        serviceStatus[service].lastCheck = new Date();
        
        return validated;
      } catch (error) {
        retries++;
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        // Only wait if we're going to retry
        if (retries <= maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        }
      }
    }
    
    // Update service status
    serviceStatus[service].available = false;
    serviceStatus[service].lastCheck = new Date();
    serviceStatus[service].errorMessage = lastError?.message;
    
    throw lastError || new Error(`Failed to process ${service} request after ${maxRetries} retries`);
  }

  /**
   * Analyze patient symptoms and generate diagnostic information
   */
  async diagnoseSymptoms(
    symptoms: string, 
    patientHistory?: PatientMedicalHistory
  ): Promise<SymptomPrediction> {
    const systemPrompt = `You are an advanced AI dental diagnostic assistant powered by DentaMind. 
Analyze patient symptoms comprehensively using evidence-based dental knowledge.

Your analysis should consider:
- Duration and character of symptoms
- Response to thermal/pressure stimuli
- Previous dental work
- Medical history relevance
- Recent changes in symptoms
- Related systemic conditions

Provide structured differential diagnosis with confidence levels and follow-up recommendations.
Format your response as a JSON object.`;

    const userPrompt = JSON.stringify({
      type: "dental_diagnosis",
      symptoms,
      patientHistory: patientHistory || {},
      guidelines: {
        periodontal: "2017 World Workshop Classification",
        endodontic: "AAE Treatment Standards",
        restorative: "ADA Clinical Guidelines"
      }
    });

    return this.processWithRetry(
      "diagnosis", 
      diagnosisAI,
      systemPrompt,
      userPrompt,
      symptomPredictionSchema
    );
  }

  /**
   * Analyze dental X-ray image and provide findings
   */
  async analyzeXRay(
    xrayUrl: string,
    position: string,
    patientHistory?: PatientMedicalHistory,
    previousXRayUrl?: string
  ) {
    const systemPrompt = `You are an expert dental radiologist AI assistant. 
Analyze the dental X-ray described by the user, considering the position and any patient history.
Focus on identifying pathologies, anomalies, and other significant findings visible in the X-ray.
If a previous X-ray is mentioned, compare changes between the two.

Provide your analysis as a structured JSON response.`;

    const userPrompt = JSON.stringify({
      type: "xray_analysis",
      xrayDescription: `A dental X-ray of position ${position}. ${previousXRayUrl ? "There is also a previous X-ray available for comparison." : ""}`,
      patientHistory: patientHistory || {},
      previousFindings: previousXRayUrl ? "Please compare with the previous X-ray." : undefined
    });

    return this.processWithRetry(
      "xray",
      xrayAI,
      systemPrompt,
      userPrompt,
      xrayAnalysisSchema
    );
  }

  /**
   * Generate treatment plan based on diagnosis and patient information
   */
  async generateTreatmentPlan(
    diagnosis: string,
    patientHistory?: PatientMedicalHistory,
    insuranceProvider?: string
  ) {
    const systemPrompt = `You are a dental treatment planning AI specialist.
Create a comprehensive treatment plan based on the diagnosis and patient information provided.
Consider the patient's medical history, insurance coverage, and best practices in dental care.
Sequence treatments in appropriate order with clear rationale for each procedure.

Provide your treatment plan as a structured JSON response.`;

    const userPrompt = JSON.stringify({
      type: "treatment_planning",
      diagnosis,
      patientHistory: patientHistory || {},
      insurance: insuranceProvider,
      preferences: {
        considerCost: true,
        preserveTissue: true,
        minimizeAppointments: true
      }
    });

    return this.processWithRetry(
      "treatment",
      treatmentAI,
      systemPrompt,
      userPrompt,
      treatmentPlanSchema
    );
  }

  /**
   * Generate financial forecast based on practice data
   */
  async generateFinancialForecast(
    historicalData: any,
    months: number = 12
  ) {
    const systemPrompt = `You are an AI financial analyst specializing in dental practice finances.
Analyze the historical financial data provided and generate a forecast for the specified number of months.
Identify trends, potential growth areas, and recommendations for optimizing revenue.

Provide your financial forecast as a structured JSON response.`;

    const userPrompt = JSON.stringify({
      type: "financial_forecast",
      historicalData,
      forecastMonths: months,
      includeTrends: true,
      includeRecommendations: true
    });

    return this.processWithRetry(
      "financial",
      financialAI,
      systemPrompt,
      userPrompt,
      financialForecastSchema
    );
  }

  /**
   * Generate scheduling optimization recommendations
   */
  async optimizeScheduling(
    availability: any[],
    preferences: any = {}
  ) {
    const systemPrompt = `You are an AI scheduling specialist for dental practices.
Analyze the provided availability data and optimize the scheduling based on given preferences.
Consider procedure types, patient types, and time constraints to maximize efficiency.

Provide your scheduling recommendations as a structured JSON response.`;

    const userPrompt = JSON.stringify({
      type: "scheduling_optimization",
      availability,
      preferences: {
        prioritizeProcedureTypes: preferences.prioritizeProcedureTypes || [],
        groupSimilarProcedures: preferences.groupSimilarProcedures || true,
        leaveBufferTime: preferences.leaveBufferTime || true,
        ...preferences
      }
    });

    return this.processWithRetry(
      "scheduling",
      schedulingAI,
      systemPrompt,
      userPrompt,
      schedulingRecommendationSchema
    );
  }

  /**
   * Generate personalized patient communication
   */
  async generatePatientCommunication(
    purpose: string,
    patientInfo: any,
    communicationType: "email" | "sms" | "appointment_reminder" | "treatment_followup" | "educational",
    tone: "professional" | "empathetic" | "urgent" | "educational" | "encouraging" = "professional"
  ) {
    const systemPrompt = `You are an AI communication specialist for a dental practice.
Generate personalized patient communication based on the provided information and purpose.
Ensure the communication is clear, appropriate for the medium, and conveys the necessary information effectively.
Match the tone to the specified preference and purpose of the communication.

Provide your communication as a structured JSON response.`;

    const userPrompt = JSON.stringify({
      type: "patient_communication",
      purpose,
      patientInfo,
      communicationType,
      tone,
      includeKeyPoints: true
    });

    return this.processWithRetry(
      "communication",
      communicationAI,
      systemPrompt,
      userPrompt,
      patientCommunicationSchema,
      { temperature: 0.7 } // Higher temperature for more creative communication
    );
  }
}

// Export singleton instance
export const aiService = new AIServiceIntegration();