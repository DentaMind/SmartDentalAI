import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertMedicalNote } from '@shared/schema';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /patients/:patientId/medical-notes
 * @desc Get all medical notes for a patient
 * @access Private
 */
router.get('/patients/:patientId/medical-notes', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    // Get user role from the request
    const userRole = req.user?.role || 'staff';
    
    const notes = await storage.getPatientMedicalNotes(patientId, userRole);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching medical notes:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch medical notes' 
    });
  }
});

/**
 * @route POST /patients/:patientId/medical-notes
 * @desc Create a new medical note for a patient
 * @access Private - Doctor or staff
 */
router.post('/patients/:patientId/medical-notes', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    const noteData: InsertMedicalNote = {
      patientId,
      doctorId: req.user!.id,
      content: req.body.content,
      category: req.body.category || 'general',
      noteType: req.body.noteType || 'general',
      private: req.body.visibility === 'private',
      aiGenerated: req.body.aiGenerated || false,
      attachments: req.body.attachments || null,
      aiSuggestions: req.body.aiSuggestions || null,
    };
    
    const newNote = await storage.createMedicalNote(noteData);
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating medical note:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to create medical note' 
    });
  }
});

/**
 * @route POST /patients/:patientId/medical-notes/:noteId/sign
 * @desc Sign a medical note (doctor only)
 * @access Private - Doctor only
 */
router.post('/patients/:patientId/medical-notes/:noteId/sign', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    // This is a stub since we don't have a direct method to sign notes in storage
    // In a real implementation, we would update the note with signedBy and signedAt
    
    // For now, we'll get all notes and find the one to "sign"
    const notes = await storage.getPatientMedicalNotes(patientId, 'doctor');
    const noteToSign = notes.find(note => note.id === noteId);
    
    if (!noteToSign) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // In a real implementation, this would be an update operation
    // For now, we'll just return the note as if it was signed
    const signedNote = {
      ...noteToSign,
      signedBy: req.user!.id,
      signedAt: new Date(),
    };
    
    res.json(signedNote);
  } catch (error) {
    console.error('Error signing medical note:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to sign medical note' 
    });
  }
});

/**
 * @route GET /patients/:patientId/medical-notes/:noteId
 * @desc Get a specific medical note
 * @access Private
 */
router.get('/patients/:patientId/medical-notes/:noteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const userRole = req.user?.role || 'staff';
    const notes = await storage.getPatientMedicalNotes(patientId, userRole);
    const note = notes.find(n => n.id === noteId);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error fetching medical note:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch medical note' 
    });
  }
});

/**
 * @route GET /patients/:patientId/medical-notes/category/:category
 * @desc Get all medical notes for a patient filtered by category
 * @access Private
 */
router.get('/patients/:patientId/medical-notes/category/:category', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const category = req.params.category;
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    const userRole = req.user?.role || 'staff';
    const allNotes = await storage.getPatientMedicalNotes(patientId, userRole);
    
    // Filter notes by category
    const filteredNotes = allNotes.filter(note => note.category === category);
    
    res.json(filteredNotes);
  } catch (error) {
    console.error('Error fetching medical notes by category:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch medical notes' 
    });
  }
});

/**
 * @route POST /patients/:patientId/medical-notes/generate
 * @desc Generate an AI-assisted medical note
 * @access Private - Doctors only
 */
router.post('/patients/:patientId/medical-notes/generate', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    const { symptoms, category, observations } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ message: 'Symptoms are required' });
    }
    
    // Get patient's medical history for context
    const medicalHistory = await storage.getPatientMedicalHistory(patientId);
    
    // In a real implementation, this would call an AI service
    // For now, we'll create a simple formatted note
    const generatedContent = `
MEDICAL NOTE (AI ASSISTED)
--------------------------
Category: ${category || 'General'}
Date: ${new Date().toISOString().split('T')[0]}

SUBJECTIVE:
Patient reports: ${symptoms}

OBJECTIVE:
${observations || 'No specific observations recorded.'}

ASSESSMENT:
Based on the symptoms and patient history, recommended additional evaluation.

PLAN:
- Continue monitoring
- Consider follow-up in 2 weeks
    `;
    
    const noteData: InsertMedicalNote = {
      patientId,
      doctorId: req.user!.id,
      content: generatedContent.trim(),
      category: category || 'general',
      noteType: 'soap',
      private: true,
      aiGenerated: true,
      attachments: null,
      aiSuggestions: { 
        additionalTests: ["Consider CBC if symptoms persist"],
        followUpRecommendation: "2 weeks"
      },
    };
    
    const newNote = await storage.createMedicalNote(noteData);
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error generating AI medical note:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to generate medical note' 
    });
  }
});

export default router;