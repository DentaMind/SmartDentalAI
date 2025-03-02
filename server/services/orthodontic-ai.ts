
import { OpenAI } from "openai";
import { storage } from "../storage";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface OrthodonticAnalysis {
  facialProfile: {
    analysis: string;
    recommendations: string[];
    indicators: string[];
  };
  dentalArchAnalysis: {
    archForm: string;
    crowding: string;
    spacing: string;
    recommendations: string[];
  };
  cephalometricMeasurements: {
    snAngle: number;
    anBAngle: number;
    mandibularPlaneAngle: number;
    frankfortMandibularAngle: number;
    interpretation: string;
  };
  treatmentOptions: {
    option: string;
    duration: string;
    pros: string[];
    cons: string[];
    estimatedCost: number;
  }[];
  growthPrediction?: {
    potentialGrowth: string;
    recommendations: string[];
    timeframe: string;
  };
}

export async function analyzeOrthodonticCase(
  patientId: number,
  images: string[],
  measurements?: Record<string, number>
): Promise<OrthodonticAnalysis> {
  try {
    // Get patient data
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const patientAge = calculateAge(patient.dateOfBirth);
    const isGrowingPatient = patientAge < 18;

    // Prepare the AI analysis prompt
    const messages = [
      {
        role: "system",
        content: `You are an advanced orthodontic AI system. Analyze the provided images and measurements to create a comprehensive orthodontic report. Consider the patient's age (${patientAge}), medical history, and dental status.`
      },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Patient ID: ${patientId}
            Age: ${patientAge}
            Medical History: ${patient.medicalHistory || "None"}
            ${measurements ? `Provided measurements: ${JSON.stringify(measurements)}` : "No measurements provided"}`
          },
          ...images.map(img => ({
            type: "image_url",
            image_url: { url: img }
          }))
        ]
      }
    ];

    // Get AI analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      response_format: { type: "json_object" }
    });

    // Parse AI response
    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    // Add growth prediction for growing patients
    if (isGrowingPatient && !analysis.growthPrediction) {
      analysis.growthPrediction = await predictGrowthPattern(patientId, patientAge, measurements);
    }

    return analysis;
  } catch (error) {
    console.error("Orthodontic analysis error:", error);
    throw new Error("Failed to analyze orthodontic case");
  }
}

async function predictGrowthPattern(
  patientId: number,
  age: number,
  measurements?: Record<string, number>
): Promise<OrthodonticAnalysis['growthPrediction']> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a pediatric growth prediction AI for orthodontics. Predict the growth pattern for a ${age}-year-old patient using provided measurements.`
        },
        {
          role: "user",
          content: JSON.stringify({ patientId, age, measurements })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Growth prediction error:", error);
    throw new Error("Failed to predict growth pattern");
  }
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export async function generateTreatmentPlan(
  analysis: OrthodonticAnalysis,
  insuranceProvider?: string
): Promise<{
  recommendedPlan: string;
  alternativePlans: string[];
  estimatedDuration: string;
  intervalVisits: number;
  adjustmentFrequency: string;
  costBreakdown: Record<string, number>;
  totalCost: number;
  insuranceCoverage?: number;
  patientResponsibility?: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an orthodontic treatment planning AI. Generate a comprehensive treatment plan based on the provided analysis. Include cost breakdown, duration, and insurance coverage if available.`
        },
        {
          role: "user",
          content: JSON.stringify({
            analysis,
            insuranceProvider
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Orthodontic treatment plan error:", error);
    throw new Error("Failed to generate orthodontic treatment plan");
  }
}

export async function simulate3DTreatmentOutcome(
  patientId: number,
  treatmentOption: string,
  images: string[]
): Promise<{
  projectedTimeframes: { month: number; description: string }[];
  expectedOutcomes: string[];
  potentialChallenges: string[];
  maintenanceRecommendations: string[];
  beforeAfterComparisonPoints: string[];
}> {
  try {
    // This is a placeholder - in a production environment, this would integrate
    // with actual 3D modeling software like Invisalign's ClinCheck or similar
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a 3D treatment outcome simulation AI for orthodontics. Generate a projected treatment timeline and outcomes for a patient undergoing ${treatmentOption} treatment.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Patient ID: ${patientId}\nSelected treatment: ${treatmentOption}` },
            ...images.map(img => ({
              type: "image_url",
              image_url: { url: img }
            }))
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("3D simulation error:", error);
    throw new Error("Failed to simulate 3D treatment outcome");
  }
}
