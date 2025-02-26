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
  };
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
          xrayFindings: ["radiolucency", "radiopacity", "bone_loss"],
          clinicalSigns: ["swelling", "mobility", "sensitivity"],
          periodontal: ["bleeding", "recession", "pocket_depth"],
          endodontic: ["pulp_vitality", "percussion", "thermal_response"],
          restorative: ["fracture", "decay", "wear"]
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