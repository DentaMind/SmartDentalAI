import express from 'express';
import { z } from 'zod';
import { storage } from "../storage";
import { InsertChartingNote } from '@shared/schema';

const router = express.Router();

// Schema for validating charting note creation
const chartingNoteSchema = z.object({
  patientId: z.number(),
  providerId: z.number(),
  title: z.string(),
  noteBody: z.string(),
  source: z.enum(["template", "charting", "voice"]).nullable().optional(),
  status: z.enum(["draft", "approved", "rejected"]).nullable().optional(),
});

// Create a new charting note
router.post('/api/charting-notes', async (req, res) => {
  try {
    const validation = chartingNoteSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }

    const note = validation.data;
    const result = await storage.createChartingNote({
      patientId: note.patientId,
      providerId: note.providerId,
      title: note.title,
      noteBody: note.noteBody,
      source: note.source || "charting",
      status: note.status || "draft",
      approved: false,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating charting note:", error);
    res.status(500).json({ error: "Failed to create charting note" });
  }
});

// Get all charting notes for a patient
router.get('/api/patients/:patientId/charting-notes', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const notes = await storage.getPatientChartingNotes(patientId);
    res.json(notes);
  } catch (error) {
    console.error("Error retrieving charting notes:", error);
    res.status(500).json({ error: "Failed to retrieve charting notes" });
  }
});

// Get a specific charting note
router.get('/api/charting-notes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }
    
    const note = await storage.getChartingNote(id);
    
    if (!note) {
      return res.status(404).json({ error: "Charting note not found" });
    }
    
    res.json(note);
  } catch (error) {
    console.error("Error retrieving charting note:", error);
    res.status(500).json({ error: "Failed to retrieve charting note" });
  }
});

// Update a charting note
router.patch('/api/charting-notes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid note ID" });
    }
    
    const updateSchema = chartingNoteSchema.partial();
    const validation = updateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }
    
    const updates = {
      ...validation.data,
      updatedAt: new Date()
    };
    
    const updated = await storage.updateChartingNote(id, updates);
    
    if (!updated) {
      return res.status(404).json({ error: "Charting note not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating charting note:", error);
    res.status(500).json({ error: "Failed to update charting note" });
  }
});

// Approve a charting note
router.post('/api/charting-notes/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const providerId = parseInt(req.body.providerId);
    
    if (isNaN(id) || isNaN(providerId)) {
      return res.status(400).json({ error: "Invalid input" });
    }
    
    const approved = await storage.approveChartingNote(id, providerId);
    
    if (!approved) {
      return res.status(404).json({ error: "Charting note not found" });
    }
    
    res.json(approved);
  } catch (error) {
    console.error("Error approving charting note:", error);
    res.status(500).json({ error: "Failed to approve charting note" });
  }
});

export default router;