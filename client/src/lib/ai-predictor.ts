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
    
    const response = await fetch('/api/ai/analyze-xray', {
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
    const response = await fetch('/api/ai/generate-treatment-plan', {
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
    // Format the prediction request with structured dental knowledge
    const promptData = {
      type: "dental_diagnosis",
      context: {
        ...context,
        format_version: "1.0",
        // Add dental-specific context based on the guide
        symptomCategories: {
          pain: ["lingering", "sharp", "dull", "throbbing"],
          xrayFindings: ["radiolucency", "radiopacity", "bone_loss"],
          clinicalSigns: ["swelling", "mobility", "sensitivity"],
          periodontal: ["bleeding", "recession", "pocket_depth"],
          endodontic: ["pulp_vitality", "percussion", "thermal_response"],
          restorative: ["fracture", "decay", "wear"],
          prosthodontic: ["occlusion", "wear_patterns", "adaptation"],
          oralSurgery: ["impaction", "pathology", "bone_quality"]
        },
        // Add medical guidelines reference
        guidelines: [
          "ADA Clinical Practice Guidelines",
          "AAP Periodontal Disease Classification",
          "AAE Endodontic Case Difficulty Assessment",
          "Evidence-based Dentistry Principles"
        ],
        // Add diagnostic criteria based on symptoms
        diagnosticCriteria: {
          pulpitis: {
            reversible: ["short-duration pain", "pain with stimulus only"],
            irreversible: ["spontaneous pain", "lingering pain", "nocturnal pain"]
          },
          periodontitis: {
            early: ["bleeding on probing", "pocket depths 4-5mm"],
            moderate: ["pocket depths 5-7mm", "bone loss 15-33%"],
            severe: ["pocket depths >7mm", "bone loss >33%"]
          }
        }
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