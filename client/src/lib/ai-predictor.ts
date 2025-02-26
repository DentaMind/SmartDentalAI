import { apiRequest } from "./queryClient";

export interface SymptomPrediction {
  possibleConditions: Array<{
    condition: string;
    confidence: number;
    description: string;
    recommendations: string[];
    urgencyLevel: "low" | "medium" | "high" | "emergency";
  }>;
  followUpQuestions: string[];
  generalAdvice: string;
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
}

export async function predictDentalCondition(context: PredictionContext): Promise<SymptomPrediction> {
  try {
    // Format the prediction request with structured data
    const promptData = {
      type: "dental_diagnosis",
      context: {
        ...context,
        format_version: "1.0",
        // Add medical guidelines reference
        guidelines: [
          "ADA Clinical Practice Guidelines",
          "AAE Endodontic Case Difficulty Assessment",
          "Evidence-based Dentistry Principles"
        ]
      }
    };

    const response = await apiRequest("POST", "/api/ai/predict", promptData);
    return await response.json();
  } catch (error) {
    console.error("AI Prediction failed:", error);
    throw new Error("Failed to analyze symptoms. Please try again.");
  }
}
