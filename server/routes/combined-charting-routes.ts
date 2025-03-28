import express from 'express';
import { z } from 'zod';
import { storage } from "../storage";

const router = express.Router();

// Schema for validating combined charting data
const combinedChartingSchema = z.object({
  restorative: z.record(
    z.string(), // tooth number
    z.object({
      surfaces: z.array(z.string()),
      procedures: z.array(z.string())
    })
  ),
  perio: z.record(
    z.string(), // tooth number
    z.object({
      probing: z.array(z.number()),
      bop: z.array(z.boolean()),
      mobility: z.number(),
      furcation: z.number()
    })
  )
});

// Get all charting data for a patient
router.get('/api/patients/:patientId/charting', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    // Get restorative chart entries
    const restorativeEntries = await storage.getPatientRestorativeChartEntries(patientId);
    
    // Get perio chart entries
    const perioEntries = await storage.getPatientPerioChartEntries(patientId);
    
    // Format data for frontend
    const formattedRestorative: Record<string, { surfaces: string[], procedures: string[] }> = {};
    const formattedPerio: Record<string, { probing: number[], bop: boolean[], mobility: number, furcation: number }> = {};
    
    // Process restorative entries
    restorativeEntries.forEach(entry => {
      formattedRestorative[entry.toothNumber] = {
        surfaces: Array.isArray(entry.surfaces) ? entry.surfaces : [],
        procedures: Array.isArray(entry.procedures) ? entry.procedures : []
      };
    });
    
    // Process perio entries
    perioEntries.forEach(entry => {
      formattedPerio[entry.toothNumber] = {
        probing: Array.isArray(entry.probingValues) ? entry.probingValues : [0, 0, 0, 0, 0, 0],
        bop: Array.isArray(entry.bop) ? entry.bop : [false, false, false, false, false, false],
        mobility: entry.mobility || 0,
        furcation: entry.furcation || 0
      };
    });
    
    res.json({
      restorative: formattedRestorative,
      perio: formattedPerio
    });
  } catch (error) {
    console.error("Error retrieving patient charting data:", error);
    res.status(500).json({ error: "Failed to retrieve patient charting data" });
  }
});

// Save all charting data for a patient
router.post('/api/patients/:patientId/charting', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const providerId = req.body.providerId || 1; // Default to first provider if not specified
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const validation = combinedChartingSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      });
    }
    
    const chartData = validation.data;
    
    // Process restorative data
    for (const [toothNumber, data] of Object.entries(chartData.restorative)) {
      // Check if entry already exists
      const existingEntries = await storage.getPatientRestorativeChartEntriesByTooth(patientId, toothNumber);
      
      if (existingEntries.length > 0) {
        // Update existing entry
        await storage.updateRestorativeChartEntry(existingEntries[0].id, {
          surfaces: data.surfaces,
          procedures: data.procedures,
          updatedAt: new Date()
        });
      } else {
        // Create new entry
        await storage.createRestorativeChartEntry({
          patientId,
          toothNumber,
          surfaces: data.surfaces,
          procedures: data.procedures,
          providerId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // Process perio data
    for (const [toothNumber, data] of Object.entries(chartData.perio)) {
      // Check if entry already exists
      const existingEntries = await storage.getPatientPerioChartEntriesByTooth(patientId, toothNumber);
      
      if (existingEntries.length > 0) {
        // Update existing entry
        await storage.updatePerioChartEntry(existingEntries[0].id, {
          probingValues: data.probing,
          bop: data.bop,
          mobility: data.mobility,
          furcation: data.furcation,
          updatedAt: new Date()
        });
      } else {
        // Create new entry
        await storage.createPerioChartEntry({
          patientId,
          toothNumber,
          probing: data.probing,
          bop: data.bop,
          mobility: data.mobility,
          furcation: data.furcation,
          providerId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    res.json({ success: true, message: "Charting data saved successfully" });
  } catch (error) {
    console.error("Error saving patient charting data:", error);
    res.status(500).json({ error: "Failed to save patient charting data" });
  }
});

export default router;