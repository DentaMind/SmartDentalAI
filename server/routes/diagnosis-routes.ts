import express from 'express';
import { z } from 'zod';
import { storage } from "../storage";
import { InsertDiagnosis } from '@shared/schema';
import axios from 'axios';

const router = express.Router();

// OpenAI integration for diagnosis generation
async function generateAIDiagnosis(patientId: number) {
  try {
    // Get patient's medical notes, chart data, and xrays
    const notes = await storage.getPatientMedicalNotes(patientId, 'doctor');
    const perioEntries = await storage.getPatientPerioChartEntries(patientId);
    const restorativeEntries = await storage.getPatientRestorativeChartEntries(patientId);
    const xrays = await storage.getPatientXrays(patientId);
    
    // Select most recent notes and data
    const recentNotes = notes.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    ).slice(0, 3);
    
    // Combine patient data for AI analysis
    const patientData = {
      notes: recentNotes.map(note => note.content),
      perioData: perioEntries,
      restorativeData: restorativeEntries,
      xrayCount: xrays.length
    };
    
    // Select the appropriate OpenAI API key based on the diagnosis context
    const apiKey = process.env.OPENAI_API_KEY_DIAGNOSIS;
    
    if (!apiKey) {
      throw new Error("OpenAI API key not configured for diagnosis");
    }
    
    // Send data to OpenAI API for diagnosis generation
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a dental AI assistant that analyzes patient data and suggests possible diagnoses with confidence levels and reasoning.'
          },
          {
            role: 'user',
            content: `Generate dental diagnoses based on the following patient data: ${JSON.stringify(patientData)}`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse and return AI-generated diagnoses
    const aiResponse = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(aiResponse);
    
    return {
      suggestions: parsedResponse.diagnoses || [],
      aiResponse: parsedResponse
    };
  } catch (error) {
    console.error("Error generating AI diagnosis:", error);
    
    // Return fallback suggestions if AI generation fails
    return {
      suggestions: [
        { 
          label: "Unable to generate AI diagnosis", 
          confidence: 0,
          reasoning: "There was an error connecting to the AI diagnosis service."
        }
      ],
      error: "Failed to generate AI diagnosis"
    };
  }
}

// Schema for validating diagnosis feedback
const diagnosisFeedbackSchema = z.object({
  selected: z.string(),
  feedback: z.string().optional(),
  reasoningOverride: z.string().optional(),
  providerId: z.number().optional()
});

// Get diagnoses for a patient
router.get('/api/diagnosis/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    // Get existing diagnoses
    const existingDiagnoses = await storage.getDiagnosesForPatient(patientId);
    
    // If there are recent diagnoses, return them
    if (existingDiagnoses.length > 0) {
      // Sort by most recent
      const sortedDiagnoses = existingDiagnoses.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      // If the most recent diagnosis is less than 1 day old, return it
      const mostRecent = sortedDiagnoses[0];
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (new Date(mostRecent.createdAt || 0) > oneDayAgo && !mostRecent.modifiedExplanation) {
        return res.json({ 
          suggestions: [
            {
              label: mostRecent.condition,
              confidence: mostRecent.confidence,
              reasoning: mostRecent.explanation
            }
          ],
          existingDiagnosis: true
        });
      }
    }
    
    // Generate new AI diagnosis
    const aiDiagnosis = await generateAIDiagnosis(patientId);
    
    res.json(aiDiagnosis);
  } catch (error) {
    console.error("Error retrieving diagnosis:", error);
    res.status(500).json({ error: "Failed to retrieve diagnosis" });
  }
});

// Submit feedback on a diagnosis
router.post('/api/diagnosis/:patientId/feedback', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const validation = diagnosisFeedbackSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }
    
    const { selected, feedback, reasoningOverride, providerId } = validation.data;
    
    // Create a new diagnosis record
    const newDiagnosis = await storage.createDiagnosis({
      patientId,
      condition: selected,
      confidence: 90, // Provider selected, so high confidence
      explanation: feedback || "Provider selected diagnosis",
      modifiedExplanation: reasoningOverride || null,
      aiSource: "gpt-4-diagnosis",
      status: "approved",
      providerId: providerId || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: new Date(),
      approvedBy: providerId || 1,
      suggestedTreatments: [],
      metadataJson: JSON.stringify({
        providerFeedback: feedback,
        reasoningOverride,
        selectedByProvider: true
      })
    });
    
    // Also create a charting note with the diagnosis
    await storage.createChartingNote({
      patientId,
      providerId: providerId || 1,
      title: "Diagnosis: " + selected,
      noteBody: `Diagnosis: ${selected}\n\n${reasoningOverride || feedback || ""}`,
      source: "charting",
      status: "approved",
      approved: true,
      approvedBy: providerId || 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({ 
      success: true, 
      message: "Diagnosis feedback submitted",
      diagnosis: newDiagnosis
    });
  } catch (error) {
    console.error("Error submitting diagnosis feedback:", error);
    res.status(500).json({ error: "Failed to submit diagnosis feedback" });
  }
});

export default router;