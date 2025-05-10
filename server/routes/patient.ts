import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate-request';
import { apiLimiter } from '../middleware/rate-limit';
import { authenticate } from '../middleware/auth';
import { MemStorage } from '../storage';

const router = Router();
const storage = new MemStorage();

// Validation schemas
const patientSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  email: z.string().email(),
  phone: z.string().min(10),
  medicalHistory: z.array(z.object({
    condition: z.string(),
    diagnosedDate: z.string().datetime(),
    notes: z.string().optional()
  })).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string()
  })).optional()
});

// Apply security middleware to all routes
router.use(authenticate);
router.use(apiLimiter);

// GET /patients - List all patients
router.get('/', validateRequest({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional()
  })
}), async (req, res) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const patients = await storage.getPatients({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /patients/:id - Get patient by ID
router.get('/:id', validateRequest({
  params: z.object({
    id: z.string()
  })
}), async (req, res) => {
  try {
    const patient = await storage.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// POST /patients - Create new patient
router.post('/', validateRequest({
  body: patientSchema
}), async (req, res) => {
  try {
    const patient = await storage.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// PUT /patients/:id - Update patient
router.put('/:id', validateRequest({
  params: z.object({
    id: z.string()
  }),
  body: patientSchema
}), async (req, res) => {
  try {
    const patient = await storage.updatePatient(req.params.id, req.body);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// DELETE /patients/:id - Delete patient
router.delete('/:id', validateRequest({
  params: z.object({
    id: z.string()
  })
}), async (req, res) => {
  try {
    const success = await storage.deletePatient(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router; 