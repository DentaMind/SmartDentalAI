import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { storage } from '../storage';
import { log } from '../vite';
import { InsertMedicalNote, insertMedicalNoteSchema } from '../../shared/schema';
import { z } from 'zod';
import { generateAiTreatmentNote } from '../services/ai-treatment-note-service';

const router = express.Router();

/**
 * @route GET /api/patients/:patientId/medical-notes
 * @desc Get all medical notes for a patient
 * @access Private
 */
router.get('/patients/:patientId/medical-notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const notes = await storage.getPatientMedicalNotes(patientId, req.user?.role || '');
    return res.json(notes);
  } catch (error: any) {
    log(`Error fetching medical notes: ${error.message}`, 'medical-notes');
    return res.status(500).json({ message: 'Error fetching medical notes', error: error.message });
  }
});

/**
 * @route GET /api/patients/:patientId/medical-notes/category/:category
 * @desc Get notes for a patient by category
 * @access Private
 */
router.get('/patients/:patientId/medical-notes/category/:category', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const { category } = req.params;
    const notes = await storage.getPatientMedicalNotesByCategory(patientId, category, req.user?.role || '');
    return res.json(notes);
  } catch (error: any) {
    log(`Error fetching medical notes by category: ${error.message}`, 'medical-notes');
    return res.status(500).json({ message: 'Error fetching medical notes', error: error.message });
  }
});

/**
 * @route POST /api/patients/:patientId/medical-notes
 * @desc Create a new medical note for a patient
 * @access Private - Doctor or staff
 */
router.post('/patients/:patientId/medical-notes', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ message: 'User ID is required' });
    }

    // Validate the request body against the schema
    const validateResult = insertMedicalNoteSchema.safeParse({ ...req.body, patientId, doctorId });
    
    if (!validateResult.success) {
      return res.status(400).json({ 
        message: 'Invalid note data', 
        errors: validateResult.error.format() 
      });
    }

    const noteData: InsertMedicalNote = validateResult.data;
    const note = await storage.createMedicalNote(noteData);
    return res.status(201).json(note);
  } catch (error: any) {
    log(`Error creating medical note: ${error.message}`, 'medical-notes');
    return res.status(500).json({ message: 'Error creating medical note', error: error.message });
  }
});

/**
 * @route GET /api/medical-notes/:noteId
 * @desc Get a specific medical note
 * @access Private
 */
router.get('/medical-notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.noteId);
    if (isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid note ID' });
    }

    const note = await storage.getMedicalNote(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    return res.json(note);
  } catch (error: any) {
    log(`Error fetching medical note: ${error.message}`, 'medical-notes');
    return res.status(500).json({ message: 'Error fetching medical note', error: error.message });
  }
});

/**
 * @route PUT /api/medical-notes/:noteId
 * @desc Update a medical note
 * @access Private - Doctor or staff
 */
router.put('/medical-notes/:noteId', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.noteId);
    if (isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid note ID' });
    }

    const existingNote = await storage.getMedicalNote(noteId);
    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // If the note is already signed, don't allow updates unless from the signing doctor
    if (existingNote.signedAt && existingNote.signedBy && existingNote.signedBy !== req.user?.id) {
      return res.status(403).json({ 
        message: 'Cannot modify a note that has been signed by another doctor' 
      });
    }

    const updates = req.body;
    const updatedNote = await storage.updateMedicalNote(noteId, updates);
    return res.json(updatedNote);
  } catch (error: any) {
    log(`Error updating medical note: ${error.message}`, 'medical-notes');
    return res.status(500).json({ message: 'Error updating medical note', error: error.message });
  }
});

/**
 * @route POST /api/medical-notes/:noteId/sign
 * @desc Sign a medical note (only by a doctor)
 * @access Private - Doctor only
 */
router.post('/medical-notes/:noteId/sign', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.noteId);
    if (isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid note ID' });
    }

    const existingNote = await storage.getMedicalNote(noteId);
    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (existingNote.signedAt) {
      return res.status(400).json({ message: 'Note has already been signed' });
    }

    // Update the note with signature information
    const updates = {
      signedAt: new Date(),
      signedBy: req.user?.id
    };

    const updatedNote = await storage.updateMedicalNote(noteId, updates);
    return res.json(updatedNote);
  } catch (error: any) {
    log(`Error signing medical note: ${error.message}`, 'medical-notes');
    return res.status(500).json({ message: 'Error signing medical note', error: error.message });
  }
});

/**
 * @route POST /api/medical-notes/generate-treatment-note
 * @desc Generate a treatment note using AI
 * @access Private - Doctor or staff
 */
router.post('/medical-notes/generate-treatment-note', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    // Define the schema for the request body
    const generateNoteSchema = z.object({
      procedure: z.string().min(1, "Procedure is required"),
      teeth: z.array(z.string()).min(1, "At least one tooth must be specified"),
      materials: z.array(z.string()).optional(),
      isolation: z.string().optional(),
      anesthesia: z.string().optional(),
      additionalDetails: z.string().optional(),
      patientResponse: z.string().optional(),
    });

    // Validate the request body
    const validateResult = generateNoteSchema.safeParse(req.body);
    
    if (!validateResult.success) {
      return res.status(400).json({ 
        message: 'Invalid treatment note data', 
        errors: validateResult.error.format() 
      });
    }

    // Generate the note using AI
    const generatedNote = await generateAiTreatmentNote(validateResult.data);
    
    return res.json({ 
      note: generatedNote,
      procedureDetails: validateResult.data
    });
  } catch (error: any) {
    log(`Error generating AI treatment note: ${error.message}`, 'medical-notes');
    return res.status(500).json({ 
      message: 'Error generating treatment note', 
      error: error.message 
    });
  }
});

export default router;