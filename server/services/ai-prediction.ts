import OpenAI from "openai";
import { z } from "zod";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const MODEL = "gpt-4o";

// Validation schema for AI predictions
export const symptomPredictionSchema = z.object({
  possibleConditions: z.array(z.object({
    condition: z.string(),
    confidence: z.number().min(0).max(1),
    description: z.string(),
    recommendations: z.array(z.string()),
    urgencyLevel: z.enum(["low", "medium", "high", "emergency"]),
  })),
  followUpQuestions: z.array(z.string()),
  generalAdvice: z.string(),
});

export type SymptomPrediction = z.infer<typeof symptomPredictionSchema>;

const SYSTEM_PROMPT = `You are an AI dental diagnostic assistant. Analyze the patient's symptoms and provide:
1. Possible dental conditions with confidence levels
2. Brief descriptions of each condition
3. Recommendations for each condition
4. Urgency level for seeking treatment
5. Follow-up questions to better understand the condition
6. General advice for immediate relief

Respond in JSON format matching this structure:
{
  "possibleConditions": [{
    "condition": "string",
    "confidence": number (0-1),
    "description": "string",
    "recommendations": ["string"],
    "urgencyLevel": "low" | "medium" | "high" | "emergency"
  }],
  "followUpQuestions": ["string"],
  "generalAdvice": "string"
}`;

export async function predictFromSymptoms(
  symptoms: string,
  patientHistory?: string
): Promise<SymptomPrediction> {
  try {
    const prompt = patientHistory 
      ? `Patient symptoms: ${symptoms}\nMedical history: ${patientHistory}`
      : `Patient symptoms: ${symptoms}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const validated = symptomPredictionSchema.parse(result);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid AI response format");
    }
    throw new Error("Failed to generate prediction: " + error.message);
  }
}
