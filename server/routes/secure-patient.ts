import express from 'express';
import { z } from 'zod';
import { securePatient } from '../services/secure-patient';
import { validateRequest } from '../middleware/validate-request';
import { requireAuth } from '../middleware/require-auth';
import { rateLimit } from '../middleware/rate-limit';

const router = express.Router();

// Request validation schemas
const patientIdSchema = z.object({
  patientId: z.number().int().positive()
});

const updatePatientSchema = z.object({
  patientId: z.number().int().positive(),
  data: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    medicalHistory: z.any().optional(),
    // Add other fields as needed
  })
});

const consentSchema = z.object({
  patientId: z.number().int().positive(),
  consentData: z.object({
    type: z.string(),
    granted: z.boolean(),
    expiresAt: z.string().datetime().optional(),
    details: z.string().optional()
  })
});

// Apply rate limiting to all routes
router.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Require authentication for all routes
router.use(requireAuth);

// Get patient by ID
router.get(
  '/:patientId',
  validateRequest({ params: patientIdSchema }),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const patient = await securePatient.getPatient(req.user.id, Number(patientId));
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      res.json(patient);
    } catch (error) {
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update patient
router.put(
  '/:patientId',
  validateRequest({ params: patientIdSchema, body: updatePatientSchema }),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { data } = req.body;

      const updatedPatient = await securePatient.updatePatient(
        req.user.id,
        Number(patientId),
        data
      );

      res.json(updatedPatient);
    } catch (error) {
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete patient (soft delete)
router.delete(
  '/:patientId',
  validateRequest({ params: patientIdSchema }),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      await securePatient.deletePatient(req.user.id, Number(patientId));
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update patient consent
router.post(
  '/:patientId/consent',
  validateRequest({ params: patientIdSchema, body: consentSchema }),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { consentData } = req.body;

      await securePatient.updatePatientConsent(
        req.user.id,
        Number(patientId),
        consentData
      );

      res.status(204).send();
    } catch (error) {
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router; 