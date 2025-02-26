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

const SYSTEM_PROMPT = `You are an AI dental diagnostic assistant. Analyze the patient's symptoms, regardless of detail level provided, and generate insights. With minimal information, focus on common conditions and request more details through follow-up questions.

Key responsibilities:
1. Analyze symptoms and provide possible dental conditions
2. If symptoms are brief, consider common dental issues and ask targeted follow-up questions
3. Include confidence levels that reflect certainty based on available information
4. Always provide immediate recommendations, even with limited data
5. Assess urgency based on reported symptoms

Consider these dental aspects:
- Pulpal conditions (irreversible/reversible pulpitis)
- Periapical pathology
- Periodontal conditions
- Dental caries
- Endodontic issues
- TMJ disorders
- Oral pathology

For radiographic findings:
- Analyze periapical areas
- Evaluate bone patterns
- Consider root morphology
- Look for carious lesions

For pain assessment:
- Duration and type of pain
- Pulpal status indicators
- Referred pain patterns
- Response to stimuli

Respond in JSON format with this structure:
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
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Starting AI prediction with symptoms:", symptoms);

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

    console.log("Received response from OpenAI");

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("Parsing AI response:", content);

    const result = JSON.parse(content);
    const validated = symptomPredictionSchema.parse(result);

    console.log("Successfully validated prediction schema");
    return validated;
  } catch (error) {
    console.error("AI Prediction failed:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("AI service configuration error. Please try again later.");
      }
      if (error.message.includes("OpenAI")) {
        throw new Error("Our AI service is temporarily unavailable. Please try again in a moment.");
      }
      throw new Error(error.message);
    }
    throw new Error("Failed to analyze symptoms. Please try again.");
  }
}