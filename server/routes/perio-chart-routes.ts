import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Middleware to ensure authenticated requests
router.use(requireAuth);

// Get all periodontal charts for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const perioCharts = await storage.getPatientPeriodontalCharts(patientId);
    res.json(perioCharts);
  } catch (error) {
    console.error('Error fetching periodontal charts:', error);
    res.status(500).json({ error: 'Failed to fetch periodontal charts' });
  }
});

// Get a specific periodontal chart
router.get('/:id', async (req, res) => {
  try {
    const chartId = parseInt(req.params.id);
    if (isNaN(chartId)) {
      return res.status(400).json({ error: 'Invalid chart ID' });
    }

    const chart = await storage.getPeriodontalChart(chartId);
    if (!chart) {
      return res.status(404).json({ error: 'Periodontal chart not found' });
    }

    res.json(chart);
  } catch (error) {
    console.error('Error fetching periodontal chart:', error);
    res.status(500).json({ error: 'Failed to fetch periodontal chart' });
  }
});

// Get the latest periodontal chart for a patient
router.get('/latest/patient/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const latestChart = await storage.getLatestPeriodontalChart(patientId);
    if (!latestChart) {
      return res.status(404).json({ error: 'No periodontal charts found for this patient' });
    }

    res.json(latestChart);
  } catch (error) {
    console.error('Error fetching latest periodontal chart:', error);
    res.status(500).json({ error: 'Failed to fetch latest periodontal chart' });
  }
});

// Create a new periodontal chart
router.post('/', async (req, res) => {
  try {
    // Basic validation for required fields
    const chartDataSchema = z.object({
      patientId: z.number(),
      doctorId: z.number(),
      date: z.date().optional(),
      pocketDepths: z.record(z.string(), z.any()).default({}),
      bleedingPoints: z.record(z.string(), z.any()).optional(),
      recession: z.record(z.string(), z.any()).optional(),
      mobility: z.record(z.string(), z.any()).optional(),
      furcation: z.record(z.string(), z.any()).optional(),
      plaqueIndices: z.record(z.string(), z.any()).optional(),
      calculus: z.record(z.string(), z.any()).optional(),
      attachmentLoss: z.record(z.string(), z.any()).optional(),
      diseaseStatus: z.string().optional(),
      diseaseSeverity: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
      notes: z.string().optional(),
      aiRecommendations: z.any().optional(),
      comparisonWithPrevious: z.any().optional(),
      riskAssessment: z.enum(['low', 'moderate', 'high']).optional(),
    });

    const validatedData = chartDataSchema.parse(req.body);
    const newChart = await storage.createPeriodontalChart(validatedData);
    
    res.status(201).json(newChart);
  } catch (error) {
    console.error('Error creating periodontal chart:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create periodontal chart' });
  }
});

// Update an existing periodontal chart
router.patch('/:id', async (req, res) => {
  try {
    const chartId = parseInt(req.params.id);
    if (isNaN(chartId)) {
      return res.status(400).json({ error: 'Invalid chart ID' });
    }

    // Check if chart exists
    const existingChart = await storage.getPeriodontalChart(chartId);
    if (!existingChart) {
      return res.status(404).json({ error: 'Periodontal chart not found' });
    }

    // Validate update data
    const updateDataSchema = z.object({
      pocketDepths: z.record(z.string(), z.any()).optional(),
      bleedingPoints: z.record(z.string(), z.any()).optional(),
      recession: z.record(z.string(), z.any()).optional(),
      mobility: z.record(z.string(), z.any()).optional(),
      furcation: z.record(z.string(), z.any()).optional(),
      plaqueIndices: z.record(z.string(), z.any()).optional(),
      calculus: z.record(z.string(), z.any()).optional(),
      attachmentLoss: z.record(z.string(), z.any()).optional(),
      diseaseStatus: z.string().optional(),
      diseaseSeverity: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
      notes: z.string().optional(),
      aiRecommendations: z.any().optional(),
      comparisonWithPrevious: z.any().optional(),
      riskAssessment: z.enum(['low', 'moderate', 'high']).optional(),
    });

    const validatedData = updateDataSchema.parse(req.body);
    const updatedChart = await storage.updatePeriodontalChart(chartId, validatedData);
    
    res.json(updatedChart);
  } catch (error) {
    console.error('Error updating periodontal chart:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update periodontal chart' });
  }
});

export default router;