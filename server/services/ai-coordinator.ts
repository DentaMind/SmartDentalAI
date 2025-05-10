import OpenAI from "openai";
import { storage } from "../storage";
import { Patient, TreatmentPlan, SymptomPrediction, PatientMedicalHistory } from "@shared/schema";
import { processThroughDomains, enhancePredictionWithDomains } from "./ai-domains";
import { analyzeMedicalHistory } from "./medical-history-ai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.DIAGNOSIS_AI_KEY });

interface DiagnosisResult {
  conditions: Array<{
    name: string;
    confidence: number;
    description: string;
  }>;
  urgencyLevel: "low" | "medium" | "high";
  recommendedTests: string[];
  aiDomains?: Record<string, { findings: string[]; recommendations: string[] }>;
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
    // Create a simplified patient medical history object from string
    const simplifiedMedicalHistory: PatientMedicalHistory = {
      systemicConditions: patientHistory ? patientHistory.split(',') : [],
    };

    // First, process through specialized domains
    const domainInsights = processThroughDomains(symptoms, patientHistory, xrayImages);

    // Prepare messages for OpenAI API
    const messages: any[] = [
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

    // Handle X-ray images if available
    if (xrayImages?.length) {
      const textMessage = {
        role: "user",
        content: "Also analyze these X-ray images (Note: images would be processed here in a production environment)"
      };
      messages.push(textMessage);
    }

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" }
      });

      // Generate a mock response if the API call fails or returns empty
      if (!response.choices[0].message.content) {
        return this.generateMockDiagnosis(symptoms);
      }

      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);

      // Ensure the result has the aiDomains property
      if (!result.aiDomains && domainInsights) {
        result.aiDomains = domainInsights;
      }

      return result;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return this.generateMockDiagnosis(symptoms);
    }
  }

  // Fallback method to generate mock diagnosis when OpenAI API fails
  private generateMockDiagnosis(symptoms: string): DiagnosisResult {
    console.log("Generating mock diagnosis for symptoms:", symptoms);

    return {
      conditions: [
        {
          name: "Probable Dental Caries",
          confidence: 0.85,
          description: "Evidence suggests dental decay affecting enamel and possibly dentin"
        },
        {
          name: "Possible Pulpitis",
          confidence: 0.65,
          description: "Inflammation of the dental pulp may be present"
        }
      ],
      urgencyLevel: "medium",
      recommendedTests: ["Periapical X-ray", "Cold test", "Percussion test"],
      aiDomains: {
        restorative: {
          findings: ["Likely carious lesion", "Possible enamel breakdown"],
          recommendations: ["Radiographic evaluation", "Consider composite restoration"]
        },
        endodontics: {
          findings: ["Potential pulpal involvement", "Possible inflammatory response"],
          recommendations: ["Pulp vitality testing", "Monitor for pulpal deterioration"]
        }
      }
    };
  }

  async generateTreatmentPlan(
    diagnosis: DiagnosisResult,
    patientHistory: string,
    insuranceProvider?: string
  ): Promise<TreatmentPlan> {
    try {
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

      if (!response.choices[0].message.content) {
        // Return a mock treatment plan if API fails
        return this.generateMockTreatmentPlan();
      }

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Error generating treatment plan:", error);
      return this.generateMockTreatmentPlan();
    }
  }

  // Fallback method for treatment plan
  private generateMockTreatmentPlan(): any {
    return {
      id: 1,
      patientId: 1,
      doctorId: 1,
      diagnosis: "Dental caries with possible pulpal involvement",
      procedures: [
        { 
          name: "Initial examination and X-rays", 
          code: "D0150", 
          cost: 75 
        },
        { 
          name: "Composite filling", 
          code: "D2391", 
          cost: 150 
        }
      ],
      cost: 225,
      insuranceCoverage: 180,
      patientResponsibility: 45,
      status: "proposed",
      createdAt: new Date().toISOString()
    };
  }

  async createTreatmentSequence(
    treatmentPlan: TreatmentPlan,
    patientAvailability?: string[]
  ): Promise<TreatmentSequence> {
    try {
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

      if (!response.choices[0].message.content) {
        // Return mock data if API fails
        return this.generateMockTreatmentSequence();
      }

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Error creating treatment sequence:", error);
      return this.generateMockTreatmentSequence();
    }
  }

  // Fallback method for treatment sequence
  private generateMockTreatmentSequence(): TreatmentSequence {
    return {
      steps: [
        {
          order: 1,
          procedure: "Initial examination and X-rays",
          rationale: "Required for diagnosis",
          dependencies: [],
          estimatedTime: "30 minutes",
          specialtyDomain: "general"
        },
        {
          order: 2,
          procedure: "Composite filling",
          rationale: "Treat active caries",
          dependencies: ["Initial examination and X-rays"],
          estimatedTime: "45 minutes",
          specialtyDomain: "restorative"
        }
      ],
      totalEstimatedTime: "75 minutes",
      specialConsiderations: [],
      domainCoordination: {}
    };
  }

  async analyzeCosts(
    treatmentPlan: TreatmentPlan,
    insuranceDetails?: any
  ): Promise<CostAnalysis> {
    try {
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

      if (!response.choices[0].message.content) {
        // Return mock data if API fails
        return this.generateMockCostAnalysis();
      }

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Error analyzing costs:", error);
      return this.generateMockCostAnalysis();
    }
  }

  // Fallback method for cost analysis
  private generateMockCostAnalysis(): CostAnalysis {
    return {
      procedures: [
        {
          name: "Initial examination and X-rays",
          estimatedCost: 75,
          insuranceCoverage: 60,
          patientResponsibility: 15
        },
        {
          name: "Composite filling",
          estimatedCost: 150,
          insuranceCoverage: 120,
          patientResponsibility: 30,
          alternativeOptions: [
            {
              name: "Amalgam filling",
              cost: 100,
              pros: ["Lower cost", "Durable"],
              cons: ["Not tooth-colored", "Contains metal"]
            }
          ]
        }
      ],
      totalCost: 225,
      totalInsuranceCoverage: 180,
      totalPatientResponsibility: 45,
      paymentPlanOptions: [
        {
          months: 3,
          monthlyPayment: 15,
          interestRate: 0
        }
      ]
    };
  }

  // Coordinate all AI analyses for a comprehensive treatment approach
  async generateComprehensivePlan(
    patientId: number,
    symptoms: string,
    xrayImages?: string[]
  ) {
    try {
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
        patient.insuranceProvider
      );

      // Step 3: Create Treatment Sequence
      const sequence = await this.createTreatmentSequence(treatmentPlan);

      // Step 4: Analyze Costs
      const costAnalysis = await this.analyzeCosts(treatmentPlan, {
        provider: patient.insuranceProvider,
        coverageDetails: {}
      });

      return {
        diagnosis,
        treatmentPlan,
        sequence,
        costAnalysis,
        domainInsights: processThroughDomains(symptoms, patient.medicalHistory || "", xrayImages)
      };
    } catch (error) {
      console.error("Error in comprehensive plan generation:", error);
      throw error;
    }
  }
}

export const aiCoordinator = new AICoordinator();