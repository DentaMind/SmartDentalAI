import express, { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { aiServiceManager } from '../services/ai-service-manager';
import { AIServiceType } from '../services/ai-service-types';
import { storage } from '../storage';
import { log } from '../vite';

const router = express.Router();

// Schema for transcript processing
const transcriptSchema = z.object({
  transcript: z.string().min(1, "Transcript is required"),
  patientId: z.number().int().positive("Valid patient ID is required"),
  category: z.string().optional(),
  addContextFromNotes: z.boolean().optional().default(false),
});

/**
 * @route POST /api/voice-assistant/process
 * @desc Process a voice transcript using AI to enhance and structure the note
 * @access Private
 */
router.post('/process', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const result = transcriptSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: result.error.format()
      });
    }
    
    const { transcript, patientId, category, addContextFromNotes } = result.data;
    
    // Log the request for audit purposes
    log(`Voice assistant processing request for patient ${patientId}`, 'voice-assistant');
    
    // Get context from previous notes if requested
    let contextData = "";
    if (addContextFromNotes) {
      try {
        const recentNotes = await storage.getPatientMedicalNotes(patientId, req.user?.role || '');
        if (recentNotes && recentNotes.length > 0) {
          // Use the most recent 3 notes for context
          const relevantNotes = recentNotes
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
            
          contextData = "Previous notes context:\n" + 
            relevantNotes.map(note => 
              `[${new Date(note.createdAt).toLocaleDateString()}] ${note.content.substring(0, 200)}...`
            ).join("\n\n");
        }
      } catch (error) {
        log(`Error fetching context notes: ${error}`, 'voice-assistant');
        // Continue without context if there's an error
      }
    }
    
    // Get patient information for better AI context
    let patientContext = "";
    try {
      const patient = await storage.getPatient(patientId);
      if (patient) {
        patientContext = `Patient Information:\n- Name: ${patient.firstName} ${patient.lastName}\n- ID: ${patientId}`;
        
        if (patient.medicalHistory) {
          patientContext += `\n- Medical History Highlights: ${
            typeof patient.medicalHistory === 'string' 
              ? patient.medicalHistory.substring(0, 200) 
              : JSON.stringify(patient.medicalHistory).substring(0, 200)
          }`;
        }
      }
    } catch (error) {
      log(`Error fetching patient context: ${error}`, 'voice-assistant');
      // Continue without patient context if there's an error
    }
    
    // Build the prompt for the AI
    const promptTemplate = `
    You are a dental professional assistant helping with clinical note creation. 
    Please take the following voice transcript and transform it into a well-structured, 
    professional clinical note in the ${category || 'general'} category.
    
    ${patientContext}
    
    ${contextData ? contextData + "\n\n" : ""}
    
    VOICE TRANSCRIPT:
    "${transcript}"
    
    Instructions:
    1. Format this into a complete, professional note using proper dental terminology
    2. Organize information into logical sections (examination, treatment, recommendations, etc.)
    3. Correct any dictation errors or mistranscribed dental terms
    4. Use proper syntax and complete sentences
    5. Expand abbreviations where appropriate
    6. Add proper structure and formatting
    
    Respond only with the completed note text, no explanations or additional commentary.
    `;
    
    // Process with AI
    let enhancedTranscript;
    try {
      if (category === 'treatment' || category === 'procedure') {
        enhancedTranscript = await aiServiceManager.generateTreatmentNote(promptTemplate);
      } else {
        enhancedTranscript = await aiServiceManager.generateDiagnosis(promptTemplate);
      }
      
      // Ensure we got a valid response
      if (!enhancedTranscript || typeof enhancedTranscript !== 'string') {
        log(`Invalid AI response for voice transcript processing`, 'voice-assistant');
        throw new Error('Invalid AI response format');
      }
      
      return res.json({
        success: true,
        enhancedTranscript: enhancedTranscript.trim(),
        category: category || 'general',
      });
    } catch (error) {
      log(`Error processing transcript with AI: ${error}`, 'voice-assistant');
      
      // Fall back to the original transcript
      return res.status(200).json({
        success: false,
        message: 'Failed to enhance with AI, using original transcript',
        enhancedTranscript: transcript,
        category: category || 'general',
      });
    }
  } catch (error) {
    log(`Voice assistant processing error: ${error}`, 'voice-assistant');
    return res.status(500).json({
      message: 'Failed to process voice transcript',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/voice-assistant/status
 * @desc Check status of voice assistant service
 * @access Private
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const serviceStatus = {
      available: true,
      aiIntegration: true,
      speechRecognitionSupported: true, // This is checked client-side
      enhancementAvailable: true
    };
    
    return res.json(serviceStatus);
  } catch (error) {
    log(`Voice assistant status check error: ${error}`, 'voice-assistant');
    return res.status(500).json({ message: 'Error checking service status' });
  }
});

export function setupVoiceAssistantRoutes(app: express.Express) {
  app.use('/api/voice-assistant', router);
  log('Voice assistant routes initialized', 'setup');
}