import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { patientNotes } from '../../shared/schema';
import { storage } from '../storage';

const router = express.Router();

// Get all notes for a patient
router.get('/patients/:patientId/notes', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Query the database for patient notes
    const notes = await db.select().from(patientNotes)
      .where({ patientId })
      .orderBy([
        { column: patientNotes.updatedAt, order: 'desc' }
      ]);
      
    return res.json(notes);
  } catch (error) {
    console.error('Error fetching patient notes:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch patient notes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific note
router.get('/patients/:patientId/notes/:noteId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Query the database for the specific note
    const note = await db.select().from(patientNotes)
      .where({ patientId, id: noteId })
      .limit(1);
      
    if (!note || note.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    return res.json(note[0]);
  } catch (error) {
    console.error('Error fetching patient note:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch patient note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new note
router.post('/patients/:patientId/notes', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Validate the request body
    const noteSchema = z.object({
      content: z.string().min(1, 'Note content is required'),
      noteType: z.enum(['soap', 'procedure', 'followup', 'general', 'consultation']).nullable(),
      category: z.enum([
        'restorative', 'periodontal', 'orthodontic', 'endodontic', 
        'surgical', 'prosthodontic', 'pediatric', 'preventive'
      ]).nullable(),
      private: z.boolean().default(false),
      aiGenerated: z.boolean().default(false),
      status: z.enum(['draft', 'final', 'archived']).default('draft'),
      tags: z.array(z.string()).optional().nullable()
    });
    
    const validationResult = noteSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid note data',
        details: validationResult.error.errors
      });
    }
    
    const validatedData = validationResult.data;
    
    // Create a timestamp for now
    const now = new Date();
    
    // Insert the new note
    const newNote = await db.insert(patientNotes).values({
      patientId,
      doctorId: req.user.id,
      content: validatedData.content,
      noteType: validatedData.noteType,
      category: validatedData.category,
      private: validatedData.private,
      aiGenerated: validatedData.aiGenerated,
      status: validatedData.status,
      tags: validatedData.tags,
      createdAt: now,
      updatedAt: now,
      signedAt: validatedData.status === 'final' ? now : null,
      signedBy: validatedData.status === 'final' ? req.user.id : null,
      version: 1
    }).returning();
    
    if (!newNote || newNote.length === 0) {
      return res.status(500).json({ error: 'Failed to create note' });
    }
    
    return res.status(201).json(newNote[0]);
  } catch (error) {
    console.error('Error creating patient note:', error);
    return res.status(500).json({ 
      error: 'Failed to create patient note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a note
router.put('/patients/:patientId/notes/:noteId', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const patientId = parseInt(req.params.patientId);
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Fetch the existing note
    const existingNote = await db.select().from(patientNotes)
      .where({ patientId, id: noteId })
      .limit(1);
      
    if (!existingNote || existingNote.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = existingNote[0];
    
    // Check if user has permission to edit this note
    // Only the doctor who created the note or an admin should be able to edit it
    if (note.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this note' });
    }
    
    // If the note is already finalized, we don't allow updates unless creating a new version
    if (note.status === 'final' && !req.body.createNewVersion) {
      return res.status(400).json({ 
        error: 'Cannot update a finalized note',
        message: 'Set createNewVersion to true to create a new version of this note'
      });
    }
    
    // Validate the request body
    const updateSchema = z.object({
      content: z.string().optional(),
      noteType: z.enum(['soap', 'procedure', 'followup', 'general', 'consultation']).nullable().optional(),
      category: z.enum([
        'restorative', 'periodontal', 'orthodontic', 'endodontic', 
        'surgical', 'prosthodontic', 'pediatric', 'preventive'
      ]).nullable().optional(),
      private: z.boolean().optional(),
      status: z.enum(['draft', 'final', 'archived']).optional(),
      tags: z.array(z.string()).optional().nullable(),
      createNewVersion: z.boolean().optional()
    });
    
    const validationResult = updateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid note data',
        details: validationResult.error.errors
      });
    }
    
    const validatedData = validationResult.data;
    const now = new Date();
    
    // Handle version creation if needed
    if (note.status === 'final' && validatedData.createNewVersion) {
      // Create a new version based on the existing note
      const newVersionNote = {
        patientId,
        doctorId: req.user.id,
        content: validatedData.content || note.content,
        noteType: validatedData.noteType !== undefined ? validatedData.noteType : note.noteType,
        category: validatedData.category !== undefined ? validatedData.category : note.category,
        private: validatedData.private !== undefined ? validatedData.private : note.private,
        status: 'draft', // Always start as draft
        tags: validatedData.tags !== undefined ? validatedData.tags : note.tags,
        createdAt: now,
        updatedAt: now,
        signedAt: null,
        signedBy: null,
        version: (note.version || 1) + 1,
        previousVersionId: note.id
      };
      
      const newNote = await db.insert(patientNotes).values(newVersionNote).returning();
      
      if (!newNote || newNote.length === 0) {
        return res.status(500).json({ error: 'Failed to create new version of note' });
      }
      
      return res.status(201).json({
        ...newNote[0],
        message: 'Created new version of note'
      });
    }
    
    // Handle signing the note if status is changed to final
    const isBecomingFinal = note.status !== 'final' && validatedData.status === 'final';
    
    // Update the existing note
    const updateData: any = { updatedAt: now };
    
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.noteType !== undefined) updateData.noteType = validatedData.noteType;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.private !== undefined) updateData.private = validatedData.private;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    
    if (isBecomingFinal) {
      updateData.signedAt = now;
      updateData.signedBy = req.user.id;
    }
    
    const updatedNote = await db.update(patientNotes)
      .set(updateData)
      .where({ id: noteId })
      .returning();
    
    if (!updatedNote || updatedNote.length === 0) {
      return res.status(500).json({ error: 'Failed to update note' });
    }
    
    return res.json(updatedNote[0]);
  } catch (error) {
    console.error('Error updating patient note:', error);
    return res.status(500).json({ 
      error: 'Failed to update patient note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a note (only drafts should be deletable)
router.delete('/patients/:patientId/notes/:noteId', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const patientId = parseInt(req.params.patientId);
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Fetch the existing note
    const existingNote = await db.select().from(patientNotes)
      .where({ patientId, id: noteId })
      .limit(1);
      
    if (!existingNote || existingNote.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = existingNote[0];
    
    // Check if user has permission to delete this note
    // Only the doctor who created the note or an admin should be able to delete it
    if (note.doctorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this note' });
    }
    
    // Only allow deletion of draft notes
    if (note.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Only draft notes can be deleted',
        message: 'Finalized notes cannot be deleted for medical record integrity'
      });
    }
    
    // Delete the note
    await db.delete(patientNotes).where({ id: noteId });
    
    return res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient note:', error);
    return res.status(500).json({ 
      error: 'Failed to delete patient note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate an AI-assisted note
router.post('/ai/generate-note', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validation
    const generateSchema = z.object({
      patientId: z.number(),
      noteType: z.string().optional(),
      category: z.string().optional(),
      existingContent: z.string().optional()
    });
    
    const validationResult = generateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.errors
      });
    }
    
    const data = validationResult.data;
    
    // Verify patient exists
    const patient = await storage.getPatient(data.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // In a real implementation, this would call an AI service
    // For now, we'll generate some simulated content based on the request
    const patientName = patient.user ? `${patient.user.firstName} ${patient.user.lastName}` : 'Patient';
    
    let aiContent = '';
    
    switch (data.noteType) {
      case 'soap':
        aiContent = generateSoapNoteContent(patientName);
        break;
      case 'procedure':
        aiContent = generateProcedureNoteContent(patientName, data.category);
        break;
      case 'followup':
        aiContent = generateFollowupNoteContent(patientName);
        break;
      case 'consultation':
        aiContent = generateConsultationNoteContent(patientName);
        break;
      default:
        aiContent = generateGeneralNoteContent(patientName);
    }
    
    // Combine with existing content if provided
    if (data.existingContent) {
      aiContent = `${data.existingContent}\n\n${aiContent}`;
    }
    
    return res.json({ content: aiContent });
  } catch (error) {
    console.error('Error generating AI note:', error);
    return res.status(500).json({ 
      error: 'Failed to generate AI note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions to generate simulated AI content
function generateSoapNoteContent(patientName: string): string {
  return `**SUBJECTIVE**
Patient ${patientName} presents with chief complaint of mild to moderate pain in the lower right quadrant, specifically around tooth #30. Patient rates pain as 4/10, states it started approximately 3 days ago and is exacerbated by cold foods and beverages. No reported swelling or fever.

**OBJECTIVE**
Clinical examination reveals:
- Visible occlusal caries on tooth #30
- Positive response to cold testing
- No percussion sensitivity
- No visible swelling or fistula
- Probing depths within normal limits

**ASSESSMENT**
Tooth #30 presents with deep occlusal decay with potential pulpal involvement. Radiographs show proximity to pulp chamber but no clear exposure. Diagnosis: Advanced caries with reversible pulpitis.

**PLAN**
1. Remove caries and evaluate pulpal exposure
2. If no exposure, place protective base and composite restoration
3. If pulpal exposure, discuss endodontic therapy options
4. Recommend regular use of fluoride rinse
5. 6-month recall examination`;
}

function generateProcedureNoteContent(patientName: string, category?: string): string {
  if (category === 'restorative') {
    return `**RESTORATIVE PROCEDURE**
Patient: ${patientName}
Teeth: #19
Procedure: Class II MO Composite Restoration
Anesthesia: 1.8 ml 2% Lidocaine with 1:100,000 epinephrine via mandibular block
Isolation: Rubber dam isolation achieved
Materials: Universal bonding agent, A2 shade nanohybrid composite

Clinical Notes:
Old amalgam restoration removed. Deep caries excavated on mesial and occlusal surfaces. No pulpal exposure. Calcium hydroxide liner placed over deepest portion. Matrix band placed. Selective etch technique used on enamel margins. Universal bonding agent applied in two coats and light-cured. Composite placed in increments with adequate curing between layers. Occlusion checked and adjusted. Patient tolerated procedure well with no complications.

Post-operative instructions provided for possible sensitivity. Patient advised to avoid chewing on that side for 24 hours.`;
  } else if (category === 'periodontal') {
    return `**PERIODONTAL PROCEDURE**
Patient: ${patientName}
Procedure: Scaling and Root Planing, Lower Right Quadrant (teeth #28-32)
Anesthesia: 1.7 ml 4% Articaine with 1:100,000 epinephrine via infiltration
Instruments: Ultrasonic scaler and hand instruments

Clinical Notes:
Significant calculus deposits observed, especially on lingual surfaces of #31-32. Bleeding on probing was present at most sites pre-procedure. Scaling and root planing performed thoroughly on all tooth surfaces. Good tissue response noted during procedure. All accessible calculus removed with ultrasonic and hand instrumentation. Root surfaces feel smooth upon tactile exploration with explorer. Patient tolerated procedure well.

Post-operative instructions provided for proper home care. Chlorhexidine rinse prescribed BID for 2 weeks. Patient scheduled for 6-week re-evaluation.`;
  } else {
    return `**DENTAL PROCEDURE**
Patient: ${patientName}
Procedure: Dental Examination and Prophylaxis
Findings: Routine examination performed. Light calculus deposits noted on lingual surfaces of lower anterior teeth. No caries detected. Periodontal health within normal limits with probing depths ≤3mm throughout.

Treatment Performed:
- Full mouth prophylaxis
- Selective polishing
- Fluoride application

Home care instructions reinforced. Patient advised to continue brushing twice daily with fluoride toothpaste and daily flossing. Next routine examination recommended in 6 months.`;
  }
}

function generateFollowupNoteContent(patientName: string): string {
  return `**FOLLOW-UP VISIT**
Patient: ${patientName}
Reason for Visit: 2-week follow-up after extraction of tooth #17

Subjective: Patient reports good healing with minimal discomfort. No longer taking any pain medication. No complaints of swelling, bleeding or unusual symptoms.

Objective: 
- Extraction site showing healthy granulation tissue
- No signs of infection or dry socket
- Adjacent teeth stable
- No pathological periodontal pocketing

Assessment: Healing progressing as expected with no complications.

Plan: 
- No further follow-up needed for extraction site
- Discussed restorative options for the edentulous space including implant, fixed bridge, or removable partial denture
- Patient expressing interest in implant option
- Will schedule for implant consultation if patient decides to proceed`;
}

function generateConsultationNoteContent(patientName: string): string {
  return `**INITIAL CONSULTATION**
Patient: ${patientName}

Chief Complaint: "My front tooth is chipped and I'm concerned about the appearance."

Medical History: Reviewed and updated. Patient reports controlled hypertension treated with lisinopril 10mg daily. No allergies to medications. No other significant medical conditions.

Dental History: Last dental visit approximately 1 year ago for routine examination. Reports inconsistent flossing habits. Brushes twice daily.

Clinical Findings:
- Fractured incisal edge of tooth #8 (approximately 3mm)
- No pulpal exposure
- No mobility or percussion sensitivity
- Adjacent teeth intact
- Class I occlusion

Radiographic Findings:
- No periapical pathology
- Adequate bone levels
- No other significant radiographic findings

Treatment Options Discussed:
1. Direct composite restoration
2. Porcelain veneer
3. Full coverage crown

Patient elected to proceed with composite restoration due to immediate esthetics and lower cost. Procedure scheduled for next week. Impression taken for diagnostic model.`;
}

function generateGeneralNoteContent(patientName: string): string {
  return `**CLINICAL NOTE**
Patient: ${patientName}

Communication notes: Discussed the importance of regular flossing and proper brushing technique with patient. Demonstrated modified Bass technique and proper floss positioning. Patient was receptive to instruction and demonstrated adequate technique before leaving.

Patient reports being diligent with twice-daily brushing but admits to rarely flossing. Emphasized the importance of interdental cleaning for periodontal health. Recommended daily flossing and use of fluoride mouthwash.

Will re-evaluate oral hygiene at next recall appointment.`;
}

export default router;