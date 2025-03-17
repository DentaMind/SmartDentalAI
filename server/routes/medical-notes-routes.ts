import express, { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth, requireRole } from '../middleware/auth';
import { insertMedicalNoteSchema } from '../../shared/schema';
import { type InsertMedicalNote } from '../../shared/schema';
import { generateAiTreatmentNote } from '../services/ai-treatment-note-service';

const router = express.Router();

// Schema for AI treatment note generation
const aiTreatmentNoteSchema = z.object({
  procedure: z.string().min(1),
  teeth: z.array(z.string()).min(1),
  materials: z.array(z.string()).optional(),
  isolation: z.string().optional(),
  anesthesia: z.string().optional(),
  additionalDetails: z.string().optional(),
  patientResponse: z.string().optional(),
});

/**
 * @route GET /api/patients/:patientId/medical-notes
 * @desc Get all medical notes for a patient
 * @access Private
 */
router.get('/patients/:patientId/medical-notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const notes = await storage.getPatientMedicalNotes(patientId, req.user?.role || '');
    return res.json(notes);
  } catch (error) {
    console.error('Error fetching patient medical notes:', error);
    return res.status(500).json({ message: 'Failed to fetch medical notes' });
  }
});

/**
 * @route POST /api/patients/:patientId/medical-notes
 * @desc Create a new medical note for a patient
 * @access Private - Doctor or staff
 */
router.post('/patients/:patientId/medical-notes', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    // Validate note data
    const validationResult = insertMedicalNoteSchema.safeParse({
      ...req.body,
      patientId
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid note data', 
        errors: validationResult.error.flatten() 
      });
    }

    // Make sure there's a doctor assigned if staff is creating the note
    if (req.user?.role === 'staff' && !req.body.doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required for staff-created notes' });
    }

    const noteData: InsertMedicalNote = {
      patientId,
      userId: req.user?.id || 0,
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const note = await storage.createMedicalNote(noteData);
    return res.status(201).json(note);
  } catch (error) {
    console.error('Error creating medical note:', error);
    return res.status(500).json({ message: 'Failed to create medical note' });
  }
});

/**
 * @route POST /api/patients/:patientId/medical-notes/:noteId/sign
 * @desc Sign a medical note (doctor only)
 * @access Private - Doctor only
 */
router.post('/patients/:patientId/medical-notes/:noteId/sign', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.patientId);
    const noteId = Number(req.params.noteId);

    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid patient or note ID' });
    }

    // Update the note with signed info
    const updatedNote = await storage.updateMedicalNote(noteId, {
      signedBy: req.user?.id,
      signedAt: new Date(),
      signedByName: req.body.signedByName || `${req.user?.firstName} ${req.user?.lastName}`,
    });

    if (!updatedNote) {
      return res.status(404).json({ message: 'Medical note not found' });
    }

    return res.json(updatedNote);
  } catch (error) {
    console.error('Error signing medical note:', error);
    return res.status(500).json({ message: 'Failed to sign medical note' });
  }
});

/**
 * @route GET /api/patients/:patientId/medical-notes/:noteId
 * @desc Get a specific medical note
 * @access Private
 */
router.get('/patients/:patientId/medical-notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.patientId);
    const noteId = Number(req.params.noteId);

    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid patient or note ID' });
    }

    const note = await storage.getMedicalNote(noteId);
    
    if (!note || note.patientId !== patientId) {
      return res.status(404).json({ message: 'Medical note not found' });
    }

    // Check if the user has access to this note (admin, the doctor who created it, or staff)
    if (req.user?.role !== 'admin' && req.user?.role !== 'doctor' && req.user?.id !== note.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(note);
  } catch (error) {
    console.error('Error fetching medical note:', error);
    return res.status(500).json({ message: 'Failed to fetch medical note' });
  }
});

/**
 * @route PATCH /api/patients/:patientId/medical-notes/:noteId
 * @desc Update a medical note
 * @access Private - Doctor or creator
 */
router.patch('/patients/:patientId/medical-notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.patientId);
    const noteId = Number(req.params.noteId);

    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid patient or note ID' });
    }

    const note = await storage.getMedicalNote(noteId);
    
    if (!note || note.patientId !== patientId) {
      return res.status(404).json({ message: 'Medical note not found' });
    }

    // Only allow updates if the note is not signed and user is the creator or a doctor
    if (note.signedBy) {
      return res.status(400).json({ message: 'Cannot update a signed note' });
    }

    // Check if the user has permission to update this note
    if (req.user?.role !== 'admin' && req.user?.role !== 'doctor' && req.user?.id !== note.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update the note
    const updatedNote = await storage.updateMedicalNote(noteId, {
      ...req.body,
      updatedAt: new Date()
    });

    return res.json(updatedNote);
  } catch (error) {
    console.error('Error updating medical note:', error);
    return res.status(500).json({ message: 'Failed to update medical note' });
  }
});

/**
 * @route GET /api/patients/:patientId/medical-notes/category/:category
 * @desc Get all medical notes for a patient filtered by category
 * @access Private
 */
router.get('/patients/:patientId/medical-notes/category/:category', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.patientId);
    const category = req.params.category;

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const notes = await storage.getPatientMedicalNotesByCategory(patientId, category, req.user?.role || '');
    return res.json(notes);
  } catch (error) {
    console.error('Error fetching patient medical notes by category:', error);
    return res.status(500).json({ message: 'Failed to fetch medical notes' });
  }
});

/**
 * @route POST /api/ai/generate-treatment-note
 * @desc Generate an AI-assisted treatment note
 * @access Private - Doctors only
 */
router.post('/ai/generate-treatment-note', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    // Validate the input data
    const validationResult = aiTreatmentNoteSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid treatment data', 
        errors: validationResult.error.flatten() 
      });
    }
    
    const data = validationResult.data;
    
    // Call the AI service to generate the note
    const generatedNote = await generateAiTreatmentNote(data);
    
    return res.json({ note: generatedNote });
  } catch (error) {
    console.error('Error generating AI treatment note:', error);
    return res.status(500).json({ message: 'Failed to generate treatment note' });
  }
});

export default router;