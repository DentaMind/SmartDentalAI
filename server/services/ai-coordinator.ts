import OpenAI from "openai";
import { storage } from "../storage";
import { Patient, TreatmentPlan, SymptomPrediction } from "@shared/schema";
import { processThroughDomains, enhancePredictionWithDomains } from "./ai-domains";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DiagnosisResult {
  conditions: Array<{
    name: string;
    confidence: number;
    description: string;
  }>;
  urgencyLevel: "low" | "medium" | "high";
  recommendedTests: string[];
}

interface TreatmentSequence {
  steps: Array<{
    order: number;
    procedure: string;
    rationale: string;
    dependencies: string[];
    estimatedTime: string;
    specialtyDomain: string;
  }>;
  totalEstimatedTime: string;
  specialConsiderations: string[];
  domainCoordination: {
    perioFirst?: boolean;
    endoBeforeRestoration?: boolean;
    surgicalConsiderations?: string[];
  };
}

interface CostAnalysis {
  procedures: Array<{
    name: string;
    estimatedCost: number;
    insuranceCoverage: number;
    patientResponsibility: number;
    alternativeOptions?: Array<{
      name: string;
      cost: number;
      pros: string[];
      cons: string[];
    }>;
  }>;
  totalCost: number;
  totalInsuranceCoverage: number;
  totalPatientResponsibility: number;
  paymentPlanOptions: Array<{
    months: number;
    monthlyPayment: number;
    interestRate: number;
  }>;
}

export class AICoordinator {
  async analyzeDiagnosis(
    symptoms: string,
    patientHistory: string,
    xrayImages?: string[]
  ): Promise<DiagnosisResult> {
    // First, process through specialized domains
    const domainInsights = processThroughDomains(symptoms, patientHistory, xrayImages);

    const messages = [
      {
        role: "system",
        content: `You are a dental AI expert. Analyze the following symptoms, patient history, and domain-specific insights to provide a detailed diagnosis. Consider:
          - Potential conditions and their likelihood
          - Urgency level
          - Additional tests needed
          - Cross-validate findings between different dental specialties`
      },
      {
        role: "user",
        content: JSON.stringify({
          symptoms,
          patientHistory,
          domainInsights
        })
      }
    ];

    if (xrayImages?.length) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Also analyze these X-ray images:" },
          ...xrayImages.map(img => ({
            type: "image_url",
            image_url: { url: img }
          }))
        ]
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  async generateTreatmentPlan(
    diagnosis: DiagnosisResult,
    patientHistory: string,
    insuranceProvider?: string
  ): Promise<TreatmentPlan> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a dental treatment planning expert. Create an optimal treatment plan considering:
            - Diagnosis and conditions
            - Patient history and contraindications
            - Best practices and latest research
            - Insurance coverage if available
            - Coordinate between different dental specialties
            - Consider treatment dependencies and sequencing`
        },
        {
          role: "user",
          content: JSON.stringify({
            diagnosis,
            patientHistory,
            insuranceProvider
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  async createTreatmentSequence(
    treatmentPlan: TreatmentPlan,
    patientAvailability?: string[]
  ): Promise<TreatmentSequence> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a dental treatment sequencing expert. Create an optimal sequence considering:
            - Treatment dependencies
            - Healing time requirements
            - Patient availability if provided
            - Clinical efficiency
            - Coordination between different specialists
            - Priority of procedures based on urgency`
        },
        {
          role: "user",
          content: JSON.stringify({
            treatmentPlan,
            patientAvailability
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  async analyzeCosts(
    treatmentPlan: TreatmentPlan,
    insuranceDetails?: any
  ): Promise<CostAnalysis> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a dental financial analysis expert. Provide detailed cost analysis considering:
            - Standard procedure costs
            - Insurance coverage and limitations
            - Patient payment options
            - Potential savings opportunities
            - Alternative treatment options and their costs
            - Payment plan feasibility`
        },
        {
          role: "user",
          content: JSON.stringify({
            treatmentPlan,
            insuranceDetails
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  // Coordinate all AI analyses for a comprehensive treatment approach
  async generateComprehensivePlan(
    patientId: number,
    symptoms: string,
    xrayImages?: string[]
  ) {
    const patient = await storage.getPatient(patientId);
    if (!patient) throw new Error("Patient not found");

    // Step 1: Initial Diagnosis with specialized domain insights
    const diagnosis = await this.analyzeDiagnosis(
      symptoms,
      patient.medicalHistory || "",
      xrayImages
    );

    // Step 2: Generate Treatment Plan
    const treatmentPlan = await this.generateTreatmentPlan(
      diagnosis,
      patient.medicalHistory || "",
      patient.user.insuranceProvider
    );

    // Step 3: Create Treatment Sequence
    const sequence = await this.createTreatmentSequence(treatmentPlan);

    // Step 4: Analyze Costs
    const costAnalysis = await this.analyzeCosts(treatmentPlan, {
      provider: patient.user.insuranceProvider,
      coverageDetails: patient.user.insuranceCoverageDetails
    });

    return {
      diagnosis,
      treatmentPlan,
      sequence,
      costAnalysis,
      domainInsights: processThroughDomains(symptoms, patient.medicalHistory || "", xrayImages)
    };
  }
}

export const aiCoordinator = new AICoordinator();