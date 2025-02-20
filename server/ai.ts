import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIDiagnosis(
  symptoms: string,
  xrayImage?: string
): Promise<{
  diagnosis: string;
  confidence: number;
  recommendations: string[];
}> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a dental AI assistant. Analyze the symptoms and provide a detailed diagnosis with recommendations. Response should be in JSON format with diagnosis, confidence score (0-1), and array of recommendations.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Patient symptoms: ${symptoms}`,
          },
        ],
      },
    ];

    if (xrayImage) {
      messages[1].content.push({
        type: "image_url",
        image_url: {
          url: xrayImage,
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error("Failed to generate AI diagnosis: " + error.message);
  }
}

export async function generateTreatmentPlan(
  diagnosis: string,
  patientHistory: any
): Promise<{
  procedures: string[];
  timeline: string;
  estimatedCost: number;
  precautions: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a dental treatment planning assistant. Based on the diagnosis and patient history, generate a comprehensive treatment plan. Include procedures, timeline, estimated cost, and precautions. Respond in JSON format.",
        },
        {
          role: "user",
          content: JSON.stringify({ diagnosis, patientHistory }),
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error("Failed to generate treatment plan: " + error.message);
  }
}
