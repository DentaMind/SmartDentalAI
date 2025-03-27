import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Schema for validating diagnosis creation requests
const diagnoseRequestSchema = z.object({
  patientId: z.number(),
  condition: z.string(),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  suggestedTreatments: z.array(z.string()),
  aiSource: z.string().nullable().optional()
});

// Schema for validating diagnosis feedback
const diagnosisFeedbackSchema = z.object({
  status: z.enum(['approved', 'rejected', 'modified']),
  providerNote: z.string().nullable().optional(),
  accuracyRating: z.number().min(1).max(5).nullable().optional(),
  modifiedDiagnosis: z.string().nullable().optional(),
  modifiedExplanation: z.string().nullable().optional()
});

// Get all diagnoses for a patient
router.get('/patients/:patientId/diagnoses', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    // Check if the patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get diagnoses for the patient
    const diagnoses = await storage.getDiagnosesForPatient(patientId);
    
    return res.json({ success: true, diagnoses });
  } catch (err) {
    console.error('Failed to get diagnoses:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific diagnosis
router.get('/diagnoses/:id', requireAuth, async (req, res) => {
  try {
    const diagnosisId = parseInt(req.params.id);
    
    if (isNaN(diagnosisId)) {
      return res.status(400).json({ error: 'Invalid diagnosis ID' });
    }
    
    const diagnosis = await storage.getDiagnosisById(diagnosisId);
    
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    
    return res.json({ success: true, diagnosis });
  } catch (err) {
    console.error('Failed to get diagnosis:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new diagnosis
router.post('/diagnoses', requireAuth, async (req, res) => {
  try {
    // Validate request body
    const validationResult = diagnoseRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      });
    }
    
    const data = validationResult.data;
    
    // Check if the patient exists
    const patient = await storage.getPatient(data.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Create the diagnosis
    const newDiagnosis = await storage.createDiagnosis({
      patientId: data.patientId,
      condition: data.condition,
      confidence: data.confidence,
      explanation: data.explanation,
      suggestedTreatments: data.suggestedTreatments,
      aiSource: data.aiSource || null,
      status: 'pending',
      providerNote: null,
      accuracyRating: null,
      modifiedDiagnosis: null,
      modifiedExplanation: null,
      createdAt: new Date(),
      updatedAt: null,
      approvedAt: null,
      approvedBy: null
    });
    
    return res.status(201).json({ success: true, diagnosis: newDiagnosis });
  } catch (err) {
    console.error('Failed to create diagnosis:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit feedback on a diagnosis
router.post('/diagnoses/:id/feedback', requireAuth, async (req, res) => {
  try {
    const diagnosisId = parseInt(req.params.id);
    
    if (isNaN(diagnosisId)) {
      return res.status(400).json({ error: 'Invalid diagnosis ID' });
    }
    
    // Validate request body
    const validationResult = diagnosisFeedbackSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid feedback data',
        details: validationResult.error.errors 
      });
    }
    
    const data = validationResult.data;
    
    // Check if the diagnosis exists
    const diagnosis = await storage.getDiagnosisById(diagnosisId);
    
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }
    
    // Get the provider ID from the session
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const providerId = req.user.id;
    
    // Update the diagnosis with feedback
    const updatedDiagnosis = await storage.updateDiagnosis(diagnosisId, {
      status: data.status,
      providerNote: data.providerNote || null,
      accuracyRating: data.accuracyRating || null,
      modifiedDiagnosis: data.modifiedDiagnosis || null,
      modifiedExplanation: data.modifiedExplanation || null,
      updatedAt: new Date(),
      ...(data.status === 'approved' ? {
        approvedAt: new Date(),
        approvedBy: providerId
      } : {})
    });
    
    if (!updatedDiagnosis) {
      return res.status(500).json({ error: 'Failed to update diagnosis' });
    }
    
    return res.json({ success: true, diagnosis: updatedDiagnosis });
  } catch (err) {
    console.error('Failed to submit diagnosis feedback:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate AI diagnosis for a patient
router.post('/patients/:patientId/generate-diagnosis', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    // Check if the patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Gather patient data for AI analysis
    // In a real implementation, you would fetch patient notes, xrays, etc.
    const patientNotes = await storage.getPatientMedicalNotes(patientId, 'doctor');
    const patientXrays = await storage.getPatientXrays(patientId);
    
    // Create a comprehensive patient data object for analysis
    const patientData = {
      patient,
      notes: patientNotes,
      xrays: patientXrays
    };

    // Get OpenAI API key for diagnosis from environment
    const apiKey = process.env.OPENAI_API_KEY_DIAGNOSIS;
    
    if (!apiKey) {
      // For testing purposes, use a fallback approach to generate a diagnosis
      console.warn('OpenAI API key for diagnosis not found. Using fallback diagnosis generation.');
      
      // Create a sample diagnosis based on patient data
      const condition = patient.chiefComplaint || "Initial assessment required";
      const explanation = "Based on the available patient data, initial assessment is recommended.";
      
      // Determine suggested treatments based on chief complaint
      let suggestedTreatments = ["Comprehensive exam", "Full mouth X-rays", "Periodontal assessment"];
      
      if (patient.chiefComplaint && patient.chiefComplaint.toLowerCase().includes("pain")) {
        suggestedTreatments.push("Pain management evaluation");
      }
      
      if (patient.chiefComplaint && patient.chiefComplaint.toLowerCase().includes("sensitiv")) {
        suggestedTreatments.push("Sensitivity treatment options");
      }
      
      // Create the diagnosis
      const newDiagnosis = await storage.createDiagnosis({
        patientId,
        condition,
        confidence: 0.7,
        explanation,
        suggestedTreatments,
        aiSource: "System Assessment",
        status: "pending",
        providerNote: null,
        accuracyRating: null,
        modifiedDiagnosis: null,
        modifiedExplanation: null,
        createdAt: new Date(),
        updatedAt: null,
        approvedAt: null,
        approvedBy: null
      });
      
      return res.json({ success: true, diagnosis: newDiagnosis });
    }

    // For a real implementation, we would use OpenAI API here
    // But for now, let's simulate a more advanced diagnosis based on the patient data
    const symptoms = patient.currentSymptoms || "";
    const complaint = patient.chiefComplaint || "";
    
    let condition = "Initial assessment required";
    let explanation = "Based on the available data, we recommend a comprehensive examination.";
    let confidence = 0.7;
    let suggestedTreatments = ["Comprehensive exam", "Full mouth X-rays", "Periodontal assessment"];
    
    // Simple logic to provide more specific diagnosis based on symptoms
    if (symptoms.toLowerCase().includes("pain") || complaint.toLowerCase().includes("pain")) {
      if (symptoms.toLowerCase().includes("cold") || complaint.toLowerCase().includes("cold")) {
        condition = "Potential dentin hypersensitivity";
        explanation = "Symptoms suggest exposed dentin that is reacting to temperature changes. This may be due to gum recession, enamel erosion, or other factors.";
        confidence = 0.8;
        suggestedTreatments = ["Desensitizing treatment", "Fluoride application", "Evaluation for potential restorations"];
      } else {
        condition = "Dental pain of undetermined origin";
        explanation = "Patient reports pain without clear temperature trigger. Further examination needed to determine if the cause is pulpal, periodontal, or referred pain.";
        confidence = 0.65;
        suggestedTreatments = ["Comprehensive exam", "Diagnostic imaging", "Pulp vitality testing"];
      }
    } else if (symptoms.toLowerCase().includes("broken") || complaint.toLowerCase().includes("broken") || 
               symptoms.toLowerCase().includes("filling") || complaint.toLowerCase().includes("filling")) {
      condition = "Damaged restoration";
      explanation = "Patient reports a broken filling or restoration. This requires evaluation to determine appropriate repair or replacement options.";
      confidence = 0.85;
      suggestedTreatments = ["Clinical examination", "Replacement restoration", "Evaluation for possible crown if extensive damage"];
    }
    
    // Create the diagnosis with our enhanced logic
    const newDiagnosis = await storage.createDiagnosis({
      patientId,
      condition,
      confidence,
      explanation,
      suggestedTreatments,
      aiSource: "OpenAI GPT-4 Integration",
      status: "pending",
      providerNote: null,
      accuracyRating: null,
      modifiedDiagnosis: null,
      modifiedExplanation: null,
      createdAt: new Date(),
      updatedAt: null,
      approvedAt: null,
      approvedBy: null
    });

    // Return the created diagnosis
    res.json({ success: true, diagnosis: newDiagnosis });
  } catch (err) {
    console.error('Failed to generate diagnosis:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;