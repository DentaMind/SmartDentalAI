import express from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { AIServiceType } from '../services/ai-service-types';

// Schema for voice transcript processing
const voiceProcessSchema = z.object({
  transcript: z.string(),
  context: z.enum(['patient_notes', 'prescription', 'treatment_plan', 'general']).optional().default('general'),
  patientInfo: z.object({
    id: z.number(),
    name: z.string(),
    age: z.number().optional(),
    gender: z.string().optional(),
  }).optional(),
});

// Set up the router
const router = express.Router();

// Configure OpenAI with the key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_TREATMENT || '',
});

/**
 * Process speech transcript with AI
 * Uses OpenAI to analyze speech and extract structured data or insights
 */
router.post('/process-speech', async (req, res) => {
  try {
    // Validate the request body
    const validatedData = voiceProcessSchema.parse(req.body);
    const { transcript, context, patientInfo } = validatedData;
    
    // Skip empty transcripts
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Empty transcript provided'
      });
    }
    
    // Configure prompt based on context
    let systemPrompt = `You are an AI assistant for dental professionals using the DentaMind platform. `;
    
    switch (context) {
      case 'patient_notes':
        systemPrompt += `Extract relevant clinical information from the dentist's dictation and format it as a clean, professional clinical note. Include only factual information mentioned by the dentist. Format using appropriate clinical sections.`;
        break;
        
      case 'prescription':
        systemPrompt += `Extract prescription details from the dentist's dictation. Identify medication name, dosage, frequency, duration, and special instructions. Format as a structured prescription.`;
        break;
        
      case 'treatment_plan':
        systemPrompt += `Extract treatment plan details from the dentist's dictation. Identify procedures, sequence, estimates, and recommendations. Format as a structured treatment plan with clear steps.`;
        break;
        
      default:
        systemPrompt += `Analyze the dentist's speech and provide helpful insights or actions based on what was said. Respond in a professional, concise manner.`;
    }
    
    // If patient info is provided, add it to the prompt
    if (patientInfo) {
      systemPrompt += `\n\nThis is regarding patient: ${patientInfo.name}`;
      if (patientInfo.age) systemPrompt += `, ${patientInfo.age} years old`;
      if (patientInfo.gender) systemPrompt += `, ${patientInfo.gender}`;
    }
    
    // Call OpenAI API to process the transcript
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the latest available model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: transcript
        }
      ],
      max_tokens: 500,
      temperature: 0.2, // Low temperature for more deterministic responses
    });
    
    // Extract the response text
    const result = completion.choices[0]?.message?.content || 'No response generated';
    
    return res.json({
      success: true,
      result,
      context,
      transcript,
    });
  } catch (error: any) {
    console.error('Error processing voice transcript:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    // Handle OpenAI API errors
    if (error.response) {
      return res.status(500).json({
        success: false,
        error: 'AI processing error',
        details: error.response.data
      });
    }
    
    // Generic error handler
    return res.status(500).json({
      success: false,
      error: 'Failed to process voice transcript',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;