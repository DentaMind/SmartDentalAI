/**
 * DentaMind AI Integration Client Library
 * 
 * This library provides a unified interface for interacting with various AI services
 * integrated throughout the DentaMind platform. These services include:
 * 
 * - Diagnosis: Analyzing patient symptoms and medical history
 * - X-ray Analysis: AI-powered analysis of dental radiographs
 * - Treatment Planning: AI-generated treatment plans based on diagnosis
 * - Financial Forecasting: Practice financial projections
 * - Scheduling Optimization: Intelligent appointment scheduling
 * - Patient Communication: AI-enhanced communication templates
 */

import { apiRequest } from './queryClient';
import { PatientMedicalHistory } from '@shared/schema';

// Type definitions for AI responses
export interface AIServiceStatus {
  available: boolean;
  lastCheck: string;
  errorMessage?: string;
  requestsProcessed: number;
}

export interface SymptomPrediction {
  possibleConditions: Array<{
    condition: string;
    confidence: number;
    description: string;
    recommendations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    specialistReferral?: {
      type: 'periodontics' | 'endodontics' | 'oral_surgery' | 'prosthodontics' | 'orthodontics';
      reason: string;
    };
  }>;
  followUpQuestions: string[];
  generalAdvice: string;
  aiDomains: {
    periodontics?: {
      findings: string[];
      recommendations: string[];
    };
    restorative?: {
      findings: string[];
      recommendations: string[];
    };
    endodontics?: {
      findings: string[];
      recommendations: string[];
    };
    prosthodontics?: {
      findings: string[];
      recommendations: string[];
    };
  };
}

export interface XRayAnalysis {
  findings: Array<{
    type: 'caries' | 'periapical' | 'bone_loss' | 'restoration' | 'root_canal' | 'anomaly' | 'other';
    location: string;
    description: string;
    confidence: number;
    severity?: 'mild' | 'moderate' | 'severe';
  }>;
  analysis: string;
  recommendations: string[];
  comparison?: {
    changes: string[];
    progression: 'improved' | 'stable' | 'worsened';
  };
}

export interface TreatmentPlan {
  procedures: Array<{
    name: string;
    description: string;
    urgency: 'immediate' | 'high' | 'moderate' | 'low' | 'elective';
    rationale: string;
    estimatedCost?: number;
    estimatedTime?: string;
    specialtyRequired?: 'general' | 'periodontics' | 'endodontics' | 'oral_surgery' | 'prosthodontics' | 'orthodontics';
  }>;
  overallAssessment: string;
  alternatives?: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;
  followUp: string;
}

export interface FinancialForecast {
  monthlyRevenue: Array<{
    month: string;
    amount: number;
    growth: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export interface SchedulingRecommendation {
  optimizedSlots: Array<{
    date: string;
    time: string;
    duration: number;
    patientType: string;
    procedureType: string;
    priority: number;
    reasoning: string;
  }>;
  insights: string[];
}

export interface PatientCommunication {
  message: string;
  subject?: string;
  tone: 'professional' | 'empathetic' | 'urgent' | 'educational' | 'encouraging';
  keyPoints: string[];
}

// Main AI integration class
class AIIntegration {
  /**
   * Get the current status of all AI services
   */
  async getAIServicesStatus(): Promise<Record<string, AIServiceStatus>> {
    try {
      const response = await apiRequest<{
        success: boolean;
        status: Record<string, AIServiceStatus>;
      }>({
        url: '/api/ai/status',
        method: 'GET'
      });
      
      if (!response.success) {
        throw new Error('Failed to fetch AI service status');
      }
      
      return response.status;
    } catch (error) {
      console.error('Error fetching AI service status:', error);
      return {
        diagnosis: { available: false, lastCheck: new Date().toISOString(), requestsProcessed: 0 },
        treatment: { available: false, lastCheck: new Date().toISOString(), requestsProcessed: 0 },
        xray: { available: false, lastCheck: new Date().toISOString(), requestsProcessed: 0 },
        financial: { available: false, lastCheck: new Date().toISOString(), requestsProcessed: 0 },
        scheduling: { available: false, lastCheck: new Date().toISOString(), requestsProcessed: 0 },
        communication: { available: false, lastCheck: new Date().toISOString(), requestsProcessed: 0 }
      };
    }
  }
  
  /**
   * Analyze patient symptoms to generate diagnostic information
   */
  async diagnoseSymptoms(
    symptoms: string,
    patientHistory?: PatientMedicalHistory
  ): Promise<SymptomPrediction> {
    try {
      const response = await apiRequest<{
        success: boolean;
        prediction: SymptomPrediction;
      }>({
        url: '/api/ai/diagnosis',
        method: 'POST',
        body: {
          symptoms,
          patientHistory
        }
      });
      
      if (!response.success) {
        throw new Error('Diagnosis failed');
      }
      
      return response.prediction;
    } catch (error) {
      console.error('Error diagnosing symptoms:', error);
      throw error;
    }
  }
  
  /**
   * Analyze a dental X-ray image
   */
  async analyzeXRay(
    xrayId: string | number,
    patientId: string | number,
    previousXRayId?: string | number
  ): Promise<XRayAnalysis> {
    try {
      const response = await apiRequest<{
        success: boolean;
        analysis: XRayAnalysis;
      }>({
        url: `/api/dicom/analyze/${xrayId}`,
        method: 'POST',
        body: {
          patientId,
          previousXRayId
        }
      });
      
      if (!response.success) {
        throw new Error('X-ray analysis failed');
      }
      
      return response.analysis;
    } catch (error) {
      console.error('Error analyzing X-ray:', error);
      throw error;
    }
  }
  
  /**
   * Generate a treatment plan based on diagnosis
   */
  async generateTreatmentPlan(
    diagnosis: string,
    patientId: string | number,
    patientHistory?: PatientMedicalHistory,
    insuranceProvider?: string
  ): Promise<TreatmentPlan> {
    try {
      const response = await apiRequest<{
        success: boolean;
        treatmentPlan: TreatmentPlan;
      }>({
        url: '/api/ai/treatment-plan',
        method: 'POST',
        body: {
          diagnosis,
          patientId,
          patientHistory,
          insuranceProvider
        }
      });
      
      if (!response.success) {
        throw new Error('Treatment plan generation failed');
      }
      
      return response.treatmentPlan;
    } catch (error) {
      console.error('Error generating treatment plan:', error);
      throw error;
    }
  }
  
  /**
   * Generate financial forecast for the practice
   */
  async generateFinancialForecast(
    historicalData: any,
    months: number = 12
  ): Promise<FinancialForecast> {
    try {
      const response = await apiRequest<{
        success: boolean;
        forecast: FinancialForecast;
      }>({
        url: '/api/ai/financial-forecast',
        method: 'POST',
        body: {
          historicalData,
          months
        }
      });
      
      if (!response.success) {
        throw new Error('Financial forecast generation failed');
      }
      
      return response.forecast;
    } catch (error) {
      console.error('Error generating financial forecast:', error);
      throw error;
    }
  }
  
  /**
   * Generate scheduling recommendations
   */
  async optimizeScheduling(
    availability: any[],
    preferences: any = {}
  ): Promise<SchedulingRecommendation> {
    try {
      const response = await apiRequest<{
        success: boolean;
        recommendations: SchedulingRecommendation;
      }>({
        url: '/api/ai/scheduling-optimization',
        method: 'POST',
        body: {
          availability,
          preferences
        }
      });
      
      if (!response.success) {
        throw new Error('Scheduling optimization failed');
      }
      
      return response.recommendations;
    } catch (error) {
      console.error('Error optimizing scheduling:', error);
      throw error;
    }
  }
  
  /**
   * Generate personalized patient communication
   */
  async generatePatientCommunication(
    purpose: string,
    patientInfo: any,
    communicationType: "email" | "sms" | "appointment_reminder" | "treatment_followup" | "educational",
    tone: "professional" | "empathetic" | "urgent" | "educational" | "encouraging" = "professional"
  ): Promise<PatientCommunication> {
    try {
      const response = await apiRequest<{
        success: boolean;
        communication: PatientCommunication;
      }>({
        url: '/api/ai/patient-communication',
        method: 'POST',
        body: {
          purpose,
          patientInfo,
          communicationType,
          tone
        }
      });
      
      if (!response.success) {
        throw new Error('Patient communication generation failed');
      }
      
      return response.communication;
    } catch (error) {
      console.error('Error generating patient communication:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ai = new AIIntegration();