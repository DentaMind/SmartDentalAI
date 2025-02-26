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
        // Add dental-specific context
        symptomCategories: {
          pain: ["lingering", "sharp", "dull", "throbbing"],
          xrayFindings: ["radiolucency", "radiopacity", "bone loss"],
          clinicalSigns: ["swelling", "mobility", "sensitivity"]
        },
        // Add medical guidelines reference
        guidelines: [
          "ADA Clinical Practice Guidelines",
          "AAE Endodontic Case Difficulty Assessment",
          "Evidence-based Dentistry Principles"
        ]
      }
    };

    const response = await apiRequest("POST", "/api/ai/predict", promptData);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to analyze symptoms");
    }
    return await response.json();
  } catch (error) {
    console.error("AI Prediction failed:", error);
    if (error instanceof Error && error.message.includes("OpenAI")) {
      throw new Error("Our AI service is temporarily unavailable. Please try again in a moment.");
    }
    throw new Error(error instanceof Error ? error.message : "Failed to analyze symptoms. Please try again.");
  }
}