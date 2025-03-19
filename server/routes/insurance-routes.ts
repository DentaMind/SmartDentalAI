import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { InsuranceVerificationStatusEnum, InsuranceVerificationStatusType, insertInsuranceVerificationSchema } from '@shared/schema';

const router = express.Router();

// Schema for insurance verification check request
const insuranceStatusCheckSchema = z.object({
  patientId: z.number(),
  insuranceProviderId: z.string().optional(),
  appointmentId: z.number().optional(),
});

// Get all active insurance verifications
router.get('/active-verifications', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const verifications = await storage.getActiveInsuranceVerifications();
    res.json(verifications);
  } catch (error) {
    console.error('Failed to get active insurance verifications:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve insurance verifications',
      details: (error as Error).message
    });
  }
});

// Initiate a new insurance verification check
router.post('/status-check', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const validatedData = insuranceStatusCheckSchema.parse(req.body);
    
    // Get patient details
    const patient = await storage.getPatient(validatedData.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create a new insurance verification record
    const newVerification = {
      patientId: validatedData.patientId,
      appointmentId: validatedData.appointmentId,
      status: InsuranceVerificationStatusEnum.enum.pending as InsuranceVerificationStatusType,
      verificationDate: new Date().toISOString(),
      verifiedBy: req.session.user.id,
      insuranceProvider: patient.insuranceProvider || 'Unknown',
      insuranceMemberId: patient.insuranceMemberId || 'Unknown',
    };

    const verification = await storage.createInsuranceVerification(newVerification);
    
    // Typically we would trigger a real-time verification process here
    // that would update the status asynchronously, but for now we'll
    // simulate a successful verification after a delay
    setTimeout(async () => {
      const updatedVerification = {
        ...verification,
        status: InsuranceVerificationStatusEnum.enum.verified,
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        coverage: {
          preventive: '100%',
          basic: '80%',
          major: '50%',
          annual_maximum: 1500,
          remaining: 1200,
          deductible: 50,
          deductible_met: true
        }
      };
      
      await storage.updateInsuranceVerification(verification.id, updatedVerification);
    }, 3000); // 3 second delay to simulate API call
    
    res.status(201).json({ 
      message: 'Insurance verification initiated',
      verificationId: verification.id
    });
  } catch (error) {
    console.error('Failed to initiate insurance verification:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        details: error.errors 
      });
    }
    res.status(500).json({ 
      message: 'Failed to initiate insurance verification',
      details: (error as Error).message
    });
  }
});

// Get verification details by ID
router.get('/verification/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const verificationId = parseInt(req.params.id);
    if (isNaN(verificationId)) {
      return res.status(400).json({ message: 'Invalid verification ID' });
    }

    const verification = await storage.getInsuranceVerification(verificationId);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    res.json(verification);
  } catch (error) {
    console.error('Failed to get insurance verification:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve insurance verification',
      details: (error as Error).message
    });
  }
});

// Get verification history for a patient
router.get('/patient/:patientId/history', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const history = await storage.getPatientInsuranceVerificationHistory(patientId);
    res.json(history);
  } catch (error) {
    console.error('Failed to get patient insurance verification history:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve verification history',
      details: (error as Error).message
    });
  }
});

export default router;