import { apiRequest } from "./queryClient";

export interface SymptomPrediction {
  possibleConditions: Array<{
    condition: string;
    confidence: number;
    description: string;
    recommendations: string[];
    urgencyLevel: "low" | "medium" | "high" | "emergency";
    specialistReferral?: {
      type: "periodontics" | "endodontics" | "oral_surgery" | "prosthodontics" | "orthodontics";
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

export interface XrayAnalysisResult {
  findings: string[];
  recommendations: string[];
  confidenceScore: number;
  detectedIssues: {
    type: string;
    location: string;
    severity: "low" | "medium" | "high";
    description: string;
  }[];
}

export async function analyzeXray(file: File): Promise<XrayAnalysisResult> {
  try {
    const formData = new FormData();
    formData.append('xray', file);
    
    const response = await fetch('/ai/analyze-xray', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze X-ray');
    }
    
    return await response.json();
  } catch (error) {
    console.error('X-ray analysis error:', error);
    throw new Error('Failed to analyze X-ray');
  }
}

export interface TreatmentPlanResult {
  treatmentSteps: string[];
  estimatedTimeline: string;
  alternativeOptions: string[];
  costEstimate: {
    totalCost: number;
    insuranceCoverage: number;
    patientResponsibility: number;
  };
  maintenanceRecommendations: string[];
}

export async function generateTreatmentPlan(
  diagnosis: string,
  patientHistory?: string
): Promise<TreatmentPlanResult> {
  try {
    const response = await fetch('/ai/generate-treatment-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diagnosis,
        patientHistory
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate treatment plan');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Treatment plan generation error:', error);
    throw new Error('Failed to generate treatment plan');
  }
}

export interface PredictionContext {
  symptoms: string;
  patientHistory?: string;
  vitalSigns?: {
    bloodPressure?: string;
    temperature?: number;
    pulseRate?: number;
  };
  relevantTests?: {
    name: string;
    value: string;
    date: string;
  }[];
  dentalRecords?: {
    lastVisit?: string;
    xrayDate?: string;
    previousTreatments?: string[];
    knownConditions?: string[];
    perioChart?: {
      pocketDepths: number[];
      bleedingPoints: boolean[];
      date: string;
    };
    imaging?: {
      type: "xray" | "cbct";
      findings: string[];
      date: string;
    }[];
  };
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function predictDentalCondition(context: PredictionContext): Promise<SymptomPrediction> {
  try {
    // Use the correct route path for diagnosis
    return await apiRequest<SymptomPrediction>({
      method: "POST",
      url: "/ai/diagnosis",
      body: context
    });
  } catch (error) {
    console.error("AI Prediction failed:", error);
    if (error instanceof Error && error.message.includes("OpenAI")) {
      throw new Error("Our AI service is temporarily unavailable. Please try again in a moment.");
    }
    throw new Error(error instanceof Error ? error.message : "Failed to analyze symptoms. Please try again.");
  }
}

// Interactive diagnosis with refinement
export interface RefinementRequest {
  initialSymptoms: string;
  patientResponse: string;
  question: string;
  previousDiagnosis: SymptomPrediction;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  patientContext?: {
    age?: number;
    gender?: string;
    medicalHistory?: string[];
  };
}

export interface RefinementResponse {
  refinedDiagnosis: SymptomPrediction;
  nextQuestion: string | null;
  processingDetails: string;
}

export async function refineDiagnosis(request: RefinementRequest): Promise<RefinementResponse> {
  try {
    return await apiRequest<RefinementResponse>({
      method: "POST",
      url: "/ai/refine-diagnosis",
      body: request
    });
  } catch (error) {
    console.error("Diagnosis refinement failed:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to refine diagnosis. Please try again.");
  }
}

// Helper function to determine if specialist referral is needed
export function needsSpecialistReferral(prediction: SymptomPrediction): boolean {
  return prediction.possibleConditions.some(condition => 
    condition.specialistReferral && condition.urgencyLevel !== "low"
  );
}

// Helper function to get immediate action recommendations
export function getImmediateActions(prediction: SymptomPrediction): string[] {
  const urgentConditions = prediction.possibleConditions.filter(
    condition => condition.urgencyLevel === "high" || condition.urgencyLevel === "emergency"
  );

  return urgentConditions.flatMap(condition => condition.recommendations);
}

// Helper function to analyze periodontal status
export function analyzePerioStatus(prediction: SymptomPrediction): {
  severity: "healthy" | "gingivitis" | "early" | "moderate" | "severe";
  recommendations: string[];
} {
  const perioFindings = prediction.aiDomains.periodontics?.findings || [];

  // Determine severity based on findings
  if (perioFindings.some(f => f.includes("severe bone loss") || f.includes("pocket depth >7mm"))) {
    return { severity: "severe", recommendations: prediction.aiDomains.periodontics?.recommendations || [] };
  }
  // Add more severity checks here
  return { severity: "healthy", recommendations: [] };
}