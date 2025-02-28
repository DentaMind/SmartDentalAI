import OpenAI from "openai";
import { TreatmentPlan, InsertTreatmentPlan } from "@shared/schema";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateAITreatmentPlan(diagnosis: string, patientHistory: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert dental treatment planner. Analyze the diagnosis and patient history to generate a comprehensive treatment plan following best practices in dental care. Include:
          - Prioritized treatment steps
          - Timeline estimates
          - Cost estimates
          - Alternative treatment options
          - Insurance considerations
          - Follow-up care recommendations`
        },
        {
          role: "user",
          content: `Diagnosis: ${diagnosis}\nPatient History: ${patientHistory}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiRecommendation = JSON.parse(response.choices[0].message.content);
    return aiRecommendation;
  } catch (error) {
    console.error("AI Treatment Plan Generation error:", error);
    throw new Error("Failed to generate AI treatment plan recommendation");
  }
}

export async function estimateTreatmentSuccess(
  diagnosis: string,
  proposedTreatment: string,
  patientHistory: string
): Promise<{
  successProbability: number;
  riskFactors: string[];
  recommendations: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `As a dental treatment outcome analyzer, evaluate the proposed treatment plan considering the diagnosis and patient history. Provide:
          - Success probability (as a percentage)
          - Risk factors that might affect outcomes
          - Recommendations to improve success rate`
        },
        {
          role: "user",
          content: `
            Diagnosis: ${diagnosis}
            Proposed Treatment: ${proposedTreatment}
            Patient History: ${patientHistory}
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Treatment Success Estimation error:", error);
    throw new Error("Failed to estimate treatment success probability");
  }
}

export async function generateCostComparison(
  treatmentPlan: TreatmentPlan
): Promise<{
  averageCost: number;
  marketRange: { min: number; max: number };
  competitorPricing: { low: number; medium: number; high: number };
  justification: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `As a dental pricing specialist, analyze the treatment plan and provide:
          - Average cost in the market
          - Typical price range
          - Competitor pricing tiers
          - Cost justification factors`
        },
        {
          role: "user",
          content: JSON.stringify(treatmentPlan)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Cost Comparison Generation error:", error);
    throw new Error("Failed to generate cost comparison");
  }
}
