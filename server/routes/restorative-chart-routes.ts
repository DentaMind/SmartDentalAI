import express from 'express';
import { z } from 'zod';
import { storage } from "../storage";
import { InsertRestorativeChartEntry } from '@shared/schema';

const router = express.Router();

// Schema for validating restorative chart entry creation
const restorativeChartEntrySchema = z.object({
  patientId: z.number(),
  toothNumber: z.string(),
  surfaces: z.array(z.string()),
  procedures: z.array(z.string()),
  providerId: z.number(),
  notes: z.string().optional(),
});

// Create a new restorative chart entry
router.post('/api/restorative-chart-entries', async (req, res) => {
  try {
    const validation = restorativeChartEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }

    const entry = validation.data;
    const result = await storage.createRestorativeChartEntry({
      patientId: entry.patientId,
      providerId: entry.providerId,
      toothNumber: entry.toothNumber,
      surfaces: entry.surfaces,
      procedures: entry.procedures,
      notes: entry.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating restorative chart entry:", error);
    res.status(500).json({ error: "Failed to create restorative chart entry" });
  }
});

// Get all restorative chart entries for a patient
router.get('/api/patients/:patientId/restorative-chart-entries', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const entries = await storage.getPatientRestorativeChartEntries(patientId);
    res.json(entries);
  } catch (error) {
    console.error("Error retrieving restorative chart entries:", error);
    res.status(500).json({ error: "Failed to retrieve restorative chart entries" });
  }
});

// Get restorative chart entries for a specific tooth
router.get('/api/patients/:patientId/teeth/:toothNumber/restorative', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const toothNumber = req.params.toothNumber;
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const entries = await storage.getPatientRestorativeChartEntriesByTooth(patientId, toothNumber);
    res.json(entries);
  } catch (error) {
    console.error("Error retrieving restorative chart entries for tooth:", error);
    res.status(500).json({ error: "Failed to retrieve restorative chart entries for tooth" });
  }
});

// Update a restorative chart entry
router.patch('/api/restorative-chart-entries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }
    
    const updateSchema = restorativeChartEntrySchema.partial();
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
    
    const updated = await storage.updateRestorativeChartEntry(id, updates);
    
    if (!updated) {
      return res.status(404).json({ error: "Restorative chart entry not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating restorative chart entry:", error);
    res.status(500).json({ error: "Failed to update restorative chart entry" });
  }
});

export default router;