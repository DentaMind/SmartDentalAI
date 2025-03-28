import express from 'express';
import { z } from 'zod';
import { storage } from "../storage";
import { InsertPerioChartEntry } from '@shared/schema';

const router = express.Router();

// Schema for validating perio chart entry creation
const perioChartEntrySchema = z.object({
  patientId: z.number(),
  toothNumber: z.string(),
  probing: z.array(z.number()),
  bop: z.array(z.boolean()),
  mobility: z.number(),
  furcation: z.number(),
  providerId: z.number(),
  notes: z.string().optional(),
});

// Create a new perio chart entry
router.post('/api/perio-chart-entries', async (req, res) => {
  try {
    const validation = perioChartEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }

    const entry = validation.data;
    const result = await storage.createPerioChartEntry({
      patientId: entry.patientId,
      providerId: entry.providerId,
      toothNumber: entry.toothNumber,
      probing: entry.probing,
      bop: entry.bop,
      mobility: entry.mobility,
      furcation: entry.furcation,
      notes: entry.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating perio chart entry:", error);
    res.status(500).json({ error: "Failed to create perio chart entry" });
  }
});

// Get all perio chart entries for a patient
router.get('/api/patients/:patientId/perio-chart-entries', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const entries = await storage.getPatientPerioChartEntries(patientId);
    res.json(entries);
  } catch (error) {
    console.error("Error retrieving perio chart entries:", error);
    res.status(500).json({ error: "Failed to retrieve perio chart entries" });
  }
});

// Get perio chart entries for a specific tooth
router.get('/api/patients/:patientId/teeth/:toothNumber/perio', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const toothNumber = req.params.toothNumber;
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const entries = await storage.getPatientPerioChartEntriesByTooth(patientId, toothNumber);
    res.json(entries);
  } catch (error) {
    console.error("Error retrieving perio chart entries for tooth:", error);
    res.status(500).json({ error: "Failed to retrieve perio chart entries for tooth" });
  }
});

// Update a perio chart entry
router.patch('/api/perio-chart-entries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }
    
    const updateSchema = perioChartEntrySchema.partial();
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
    
    const updated = await storage.updatePerioChartEntry(id, updates);
    
    if (!updated) {
      return res.status(404).json({ error: "Perio chart entry not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating perio chart entry:", error);
    res.status(500).json({ error: "Failed to update perio chart entry" });
  }
});

export default router;