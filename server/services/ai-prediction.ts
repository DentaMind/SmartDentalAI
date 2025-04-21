import OpenAI from "openai";
import { z } from "zod";
import { aiServiceManager } from "./ai-service-manager";
import { AIServiceType } from "../services/ai-service-types";

// Initialize OpenAI client using the service manager
const openai = aiServiceManager.getOpenAIClient(AIServiceType.DIAGNOSIS);

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
    specialistReferral: z.object({
      type: z.enum(["periodontics", "endodontics", "oral_surgery", "prosthodontics", "orthodontics"]),
      reason: z.string()
    }).optional(),
  })),
  followUpQuestions: z.array(z.string()),
  generalAdvice: z.string(),
  aiDomains: z.object({
    periodontics: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    restorative: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    endodontics: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional(),
    prosthodontics: z.object({
      findings: z.array(z.string()),
      recommendations: z.array(z.string())
    }).optional()
  })
});

export type SymptomPrediction = z.infer<typeof symptomPredictionSchema>;

const SYSTEM_PROMPT = `You are an advanced AI dental diagnostic assistant powered by DentaMind. Analyze patient symptoms comprehensively using evidence-based dental knowledge.

Key Diagnostic Domains:
1. General Dentistry
   - Pain assessment (type, duration, triggers)
   - Pulpal conditions (reversible/irreversible pulpitis)
   - Caries detection
   - Periodontal status

2. Periodontics
   - Bleeding on probing
   - Pocket depths
   - Bone loss patterns
   - Gingival conditions

3. Endodontics
   - Pulp vitality
   - Periapical pathology
   - Root morphology
   - Treatment difficulty assessment

4. Restorative
   - Existing restorations
   - Fracture patterns
   - Occlusal analysis
   - Material selection criteria

5. Oral Surgery
   - Extraction complexity
   - Bone quality
   - Anatomical considerations
   - Post-operative risks

Critical Assessment Points:
- Duration and character of symptoms
- Response to thermal/pressure stimuli
- Previous dental work
- Medical history relevance
- Recent changes in symptoms
- Related systemic conditions

Diagnostic Guidelines:
1. Pulpal Conditions:
   - Reversible Pulpitis: Short-duration pain, stimulus-dependent
   - Irreversible Pulpitis: Spontaneous, lingering pain
   - Necrotic Pulp: No response to testing, possible periapical symptoms

2. Periodontal Disease:
   - Early: BOP, 4-5mm pockets
   - Moderate: 5-7mm pockets, up to 30% bone loss
   - Severe: >7mm pockets, >30% bone loss

3. Caries Risk:
   - Low: Good hygiene, balanced diet, regular checkups
   - Moderate: Some lesions, inadequate hygiene
   - High: Multiple active lesions, poor diet/hygiene

Emergency Indicators:
- Severe spontaneous pain
- Facial swelling
- Fever
- Difficulty breathing/swallowing
- Trauma with avulsion/displacement

Provide analysis in this JSON format:
{
  "possibleConditions": [{
    "condition": string,
    "confidence": number (0-1),
    "description": string,
    "recommendations": string[],
    "urgencyLevel": "low" | "medium" | "high" | "emergency",
    "specialistReferral": {
      "type": "periodontics" | "endodontics" | "oral_surgery" | "prosthodontics" | "orthodontics",
      "reason": string
    }
  }],
  "followUpQuestions": string[],
  "generalAdvice": string,
  "aiDomains": {
    "periodontics": {
      "findings": string[],
      "recommendations": string[]
    },
    // similar structure for other domains
  }
}`;

// Analyze symptoms through specialized dental domains
function analyzeDomains(symptoms: string, patientHistory?: string) {
  const domainAnalysis = {
    periodontics: {
      findings: [] as string[],
      recommendations: [] as string[]
    },
    restorative: {
      findings: [] as string[],
      recommendations: [] as string[]
    },
    endodontics: {
      findings: [] as string[],
      recommendations: [] as string[]
    },
    prosthodontics: {
      findings: [] as string[],
      recommendations: [] as string[]
    }
  };

  // Perio analysis
  if (symptoms.toLowerCase().includes("bleeding") || 
      symptoms.toLowerCase().includes("gum") ||
      symptoms.toLowerCase().includes("periodontal")) {
    domainAnalysis.periodontics.findings.push(
      "Patient reports gingival symptoms",
      "Possible periodontal involvement"
    );
    domainAnalysis.periodontics.recommendations.push(
      "Comprehensive periodontal examination needed",
      "Consider full-mouth probing depths"
    );
  }

  // Endodontic analysis
  if (symptoms.toLowerCase().includes("throbbing") || 
      symptoms.toLowerCase().includes("lingering") ||
      symptoms.toLowerCase().includes("spontaneous")) {
    domainAnalysis.endodontics.findings.push(
      "Signs of possible pulpal involvement",
      "Symptoms suggest possible irreversible pulpitis"
    );
    domainAnalysis.endodontics.recommendations.push(
      "Pulp vitality testing recommended",
      "Periapical radiograph needed"
    );
  }

  return domainAnalysis;
}

export async function predictFromSymptoms(
  symptoms: string,
  patientHistory?: string
): Promise<SymptomPrediction> {
  try {
    // Process symptoms through specialized dental domains
    const domainAnalysis = analyzeDomains(symptoms, patientHistory);

    // Format the prediction request with structured dental knowledge
    const promptData = {
      type: "dental_diagnosis",
      context: {
        symptoms,
        patientHistory: patientHistory || "",
        domainAnalysis,
        // Add evidence-based guidelines reference
        guidelines: {
          periodontal: "2017 World Workshop Classification",
          endodontic: "AAE Treatment Standards",
          restorative: "ADA Clinical Guidelines"
        }
      }
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(promptData) }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);
    const validated = symptomPredictionSchema.parse(result);

    return validated;
  } catch (error) {
    console.error("AI Prediction failed:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Dental diagnosis service configuration error. Please try again later.");
      }
      if (error.message.includes("OpenAI")) {
        throw new Error("Our dental diagnosis service is temporarily unavailable. Please try again in a moment.");
      }
      throw new Error(error.message);
    }
    throw new Error("Failed to analyze symptoms. Please try again.");
  }
}