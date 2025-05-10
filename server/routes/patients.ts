import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate-request';
import { apiLimiter, strictLimiter } from '../middleware/rate-limit';
import { authenticate } from '../middleware/auth';
import { MemStorage } from '../storage';

const router = Router();
const storage = new MemStorage();

// Patient schema validation
const patientSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-()]{10,}$/),
  medicalHistory: z.array(z.object({
    condition: z.string(),
    diagnosedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().optional()
  })).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string()
  })).optional()
});

// List patients with pagination and filters
router.get('/', authenticate, apiLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const patients = await storage.getPatients({
      page: Number(page),
      limit: Number(limit),
      search: search?.toString()
    });
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', authenticate, apiLimiter, async (req, res) => {
  try {
    const patient = await storage.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', 
  authenticate, 
  strictLimiter,
  validateRequest({ body: patientSchema }), 
  async (req, res) => {
    try {
      const patient = await storage.createPatient(req.body);
      res.status(201).json(patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
});

// Update patient
router.put('/:id',
  authenticate,
  strictLimiter,
  validateRequest({ body: patientSchema.partial() }),
  async (req, res) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json(patient);
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Failed to update patient' });
    }
});

// Delete patient
router.delete('/:id', authenticate, strictLimiter, async (req, res) => {
  try {
    const success = await storage.deletePatient(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router; 