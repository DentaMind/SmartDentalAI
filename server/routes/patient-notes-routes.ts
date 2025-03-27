/**
 * Patient Notes API Routes
 * 
 * Manages the creation, retrieval, updating, and approval of patient notes
 * with full support for AI-assisted drafting, templates, and voice input.
 */
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import { db } from '../db';
import { patientNotes, insertPatientNoteSchema } from '@/shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { log } from '../vite';
import { AIServiceIntegration } from '../services/ai-service-integration';
import { AIServiceType } from '../services/ai-service-types';

const router = express.Router();

/**
 * @route GET /api/patients/:patientId/notes
 * @desc Get all notes for a patient
 * @access Private
 */
router.get('/patients/:patientId/notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    // Retrieve notes from database, most recent first
    const notes = await db
      .select()
      .from(patientNotes)
      .where(eq(patientNotes.patientId, patientId))
      .orderBy(desc(patientNotes.createdAt));
    
    return res.json(notes);
  } catch (error: any) {
    log(`Error fetching patient notes: ${error.message}`, 'patient-notes');
    return res.status(500).json({ 
      message: 'Failed to fetch patient notes', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/patients/:patientId/notes/draft
 * @desc Get the latest draft note for a patient (if any)
 * @access Private
 */
router.get('/patients/:patientId/notes/draft', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    // Get the most recent unapproved note for this patient (if any)
    const draftNote = await db
      .select()
      .from(patientNotes)
      .where(
        and(
          eq(patientNotes.patientId, patientId),
          eq(patientNotes.approved, false)
        )
      )
      .orderBy(desc(patientNotes.createdAt))
      .limit(1);
    
    if (draftNote.length === 0) {
      return res.json({ message: 'No draft notes found', note: null });
    }
    
    return res.json(draftNote[0]);
  } catch (error: any) {
    log(`Error fetching draft note: ${error.message}`, 'patient-notes');
    return res.status(500).json({ 
      message: 'Failed to fetch draft note', 
      error: error.message 
    });
  }
});

/**
 * @route POST /api/patients/:patientId/notes
 * @desc Create a new note (draft)
 * @access Private
 */
const createNoteSchema = z.object({
  providerId: z.number().optional(),
  content: z.string().min(1, 'Note content is required'),
  title: z.string().optional(),
  procedureCode: z.string().optional(),
  templateUsed: z.string().optional(),
  source: z.enum(['ai', 'voice', 'manual', 'template']).default('manual')
});

router.post('/patients/:patientId/notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    // Validate input data
    const validatedData = createNoteSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid note data', 
        errors: validatedData.error.errors 
      });
    }
    
    // Use authenticated user as provider if not specified
    const providerId = validatedData.data.providerId || req.user?.id;
    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }
    
    // Build the note object
    const noteData = {
      patientId,
      providerId,
      content: validatedData.data.content,
      title: validatedData.data.title || 'Clinical Note',
      procedureCode: validatedData.data.procedureCode,
      templateUsed: validatedData.data.templateUsed,
      source: validatedData.data.source,
      approved: false
    };
    
    // Insert the note
    const [newNote] = await db.insert(patientNotes).values(noteData).returning();
    
    return res.status(201).json(newNote);
  } catch (error: any) {
    log(`Error creating patient note: ${error.message}`, 'patient-notes');
    return res.status(500).json({ 
      message: 'Failed to create patient note', 
      error: error.message 
    });
  }
});

/**
 * @route POST /api/patients/:patientId/notes/generate
 * @desc Generate an AI-drafted note based on patient data
 * @access Private - Providers only
 */
const generateNoteSchema = z.object({
  procedureType: z.string().optional(),
  symptoms: z.string().optional(),
  observations: z.string().optional(),
  templateType: z.string().optional(),
  additionalContext: z.string().optional()
});

router.post('/patients/:patientId/notes/generate', requireAuth, requireRole(['doctor', 'dentist']), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    // Validate input data
    const validatedData = generateNoteSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid note generation data', 
        errors: validatedData.error.errors 
      });
    }
    
    // Get patient data for context
    // This would need to be expanded based on your actual patient data structure
    const patient = await db.query.patients.findFirst({
      where: eq(patientNotes.patientId, patientId),
    });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Generate content based on procedure type
    let generatedContent = '';
    let title = 'AI Generated Note';
    
    try {
      // This would integrate with your AI service
      // For now we'll create a simple structured note
      const aiService = new AIServiceIntegration();
      
      // Different prompt based on procedure type
      if (validatedData.data.procedureType === 'comprehensive-exam') {
        title = 'Comprehensive Exam';
        generatedContent = await aiService.generateTreatmentNote(
          `Generate a comprehensive dental exam note for a patient with the following symptoms: ${validatedData.data.symptoms || 'None reported'}. 
          Observations: ${validatedData.data.observations || 'None recorded'}. 
          Additional context: ${validatedData.data.additionalContext || 'N/A'}.`,
          AIServiceType.TREATMENT
        );
      } else if (validatedData.data.procedureType === 'follow-up') {
        title = 'Follow-Up Visit';
        generatedContent = await aiService.generateTreatmentNote(
          `Generate a follow-up dental visit note for a patient. 
          Observations: ${validatedData.data.observations || 'None recorded'}. 
          Additional context: ${validatedData.data.additionalContext || 'N/A'}.`,
          AIServiceType.TREATMENT
        );
      } else {
        // General note
        generatedContent = await aiService.generateTreatmentNote(
          `Generate a clinical dental note for a patient. 
          Symptoms: ${validatedData.data.symptoms || 'None reported'}. 
          Observations: ${validatedData.data.observations || 'None recorded'}. 
          Additional context: ${validatedData.data.additionalContext || 'N/A'}.`,
          AIServiceType.TREATMENT
        );
      }
    } catch (aiError) {
      log(`AI error generating note: ${aiError}`, 'patient-notes');
      
      // Fall back to a template-based note if AI fails
      generatedContent = `
      CLINICAL NOTE
      Date: ${new Date().toISOString().split('T')[0]}
      
      SUBJECTIVE:
      ${validatedData.data.symptoms || 'No symptoms reported.'}
      
      OBJECTIVE:
      ${validatedData.data.observations || 'No observations recorded.'}
      
      ASSESSMENT:
      Based on the examination, further evaluation is recommended.
      
      PLAN:
      Discuss treatment options with patient.
      `;
    }
    
    // Create the draft note
    const noteData = {
      patientId,
      providerId: req.user?.id,
      title,
      content: generatedContent,
      source: 'ai' as const,
      templateUsed: validatedData.data.templateType,
      approved: false
    };
    
    // Save to database
    const [newNote] = await db.insert(patientNotes).values(noteData).returning();
    
    return res.status(201).json(newNote);
  } catch (error: any) {
    log(`Error generating AI note: ${error.message}`, 'patient-notes');
    return res.status(500).json({ 
      message: 'Failed to generate AI note', 
      error: error.message 
    });
  }
});

/**
 * @route PUT /api/patients/:patientId/notes/:noteId
 * @desc Update a note (edit content or approve)
 * @access Private - Providers only for approval
 */
const updateNoteSchema = z.object({
  content: z.string().optional(),
  title: z.string().optional(),
  approved: z.boolean().optional(),
  procedureCode: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

router.put('/patients/:patientId/notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.noteId);
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(noteId) || isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid ID parameters' });
    }
    
    // Validate input data
    const validatedData = updateNoteSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid note update data', 
        errors: validatedData.error.errors 
      });
    }
    
    // Get the existing note
    const existingNote = await db.query.patientNotes.findFirst({
      where: and(
        eq(patientNotes.id, noteId),
        eq(patientNotes.patientId, patientId)
      )
    });
    
    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // For approval, ensure user has provider role
    if (validatedData.data.approved === true && !['doctor', 'dentist', 'provider'].includes(req.user?.role || '')) {
      return res.status(403).json({ message: 'Only providers can approve notes' });
    }
    
    // Build update object
    const updateData: Record<string, any> = {};
    
    if (validatedData.data.content !== undefined) {
      updateData.content = validatedData.data.content;
    }
    
    if (validatedData.data.title !== undefined) {
      updateData.title = validatedData.data.title;
    }
    
    if (validatedData.data.procedureCode !== undefined) {
      updateData.procedureCode = validatedData.data.procedureCode;
    }
    
    if (validatedData.data.metadata !== undefined) {
      updateData.metadata = validatedData.data.metadata;
    }
    
    // Handle approval process
    if (validatedData.data.approved === true && !existingNote.approved) {
      updateData.approved = true;
      updateData.approvedBy = req.user?.id;
      updateData.approvedAt = new Date();
    }
    
    // Update the note in database
    const [updatedNote] = await db
      .update(patientNotes)
      .set(updateData)
      .where(
        and(
          eq(patientNotes.id, noteId),
          eq(patientNotes.patientId, patientId)
        )
      )
      .returning();
    
    return res.json(updatedNote);
  } catch (error: any) {
    log(`Error updating patient note: ${error.message}`, 'patient-notes');
    return res.status(500).json({ 
      message: 'Failed to update patient note', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/notes/templates
 * @desc Get available note templates
 * @access Private
 */
router.get('/notes/templates', requireAuth, async (req: Request, res: Response) => {
  try {
    // In a full implementation, you'd retrieve these from a database
    // For now, we'll return hardcoded templates
    const templates = [
      {
        id: 'comprehensive-exam',
        name: 'Comprehensive Exam',
        content: `# COMPREHENSIVE DENTAL EXAMINATION
Date: ${new Date().toLocaleDateString()}
Provider: [Provider Name]

## SUBJECTIVE
Chief Complaint: 
Medical History: 
Dental History: 

## OBJECTIVE
### EXAMINATION FINDINGS
Extraoral Examination:
Intraoral Examination:
Periodontal Status:
Restorative Status:
X-rays Reviewed:

## ASSESSMENT
Diagnosis:

## PLAN
Recommended Treatment:
Treatment Sequencing:
Alternative Options Discussed:

Patient accepted proposed treatment plan: [Yes/No]`
      },
      {
        id: 'perio-eval',
        name: 'Periodontal Evaluation',
        content: `# PERIODONTAL EVALUATION
Date: ${new Date().toLocaleDateString()}
Provider: [Provider Name]

Pocket Depths: 
Bleeding Points: 
Recession: 
Mobility: 
Furcation: 

## ASSESSMENT
Periodontal Diagnosis: 
Risk Factors: 

## PLAN
Recommended Treatment:
Home Care Instructions:
Recall Interval:`
      },
      {
        id: 'treatment-note',
        name: 'Treatment Note',
        content: `# TREATMENT NOTE
Date: ${new Date().toLocaleDateString()}
Provider: [Provider Name]
Procedure: 
Teeth: 

## PROCEDURE DETAILS
Anesthesia: 
Materials Used: 
Technique: 

## OUTCOMES
Patient Toleration: 
Post-Op Instructions Given: 
Follow-up Scheduled: `
      }
    ];
    
    return res.json(templates);
  } catch (error: any) {
    log(`Error fetching note templates: ${error.message}`, 'patient-notes');
    return res.status(500).json({ 
      message: 'Failed to fetch note templates', 
      error: error.message 
    });
  }
});

export function setupPatientNotesRoutes(app: express.Express) {
  app.use('/api', router);
  log('Patient notes routes initialized', 'setup');
}

export default router;