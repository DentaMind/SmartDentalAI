import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { 
  Prescription, 
  InsertPrescription, 
  insertPrescriptionSchema, 
  Patient 
} from '../../shared/schema';
import { db } from '../db';
import { prescriptions } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateAiPrescription, checkMedicationSafety, createPrescriptionDraft } from '../services/ai-prescription-service';

const router = express.Router();

/**
 * @route POST /prescriptions/generate
 * @desc Generate an AI prescription recommendation
 * @access Private - Doctors only
 */
router.post('/prescriptions/generate', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    // Validate the input data
    const validationSchema = z.object({
      patientId: z.number(),
      requestedMedication: z.string().optional(),
      reason: z.string().optional(),
    });

    const validationResult = validationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid request data', errors: validationResult.error.errors });
    }

    const { patientId, requestedMedication, reason } = validationResult.data;

    // Make sure at least medication or reason is provided
    if (!requestedMedication && !reason) {
      return res.status(400).json({ message: 'Either requested medication or reason must be provided' });
    }

    // Get patient data for AI input
    const patientData = await db.query.patients.findFirst({
      where: eq(prescriptions.patientId, patientId)
    });

    if (!patientData) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Extract patient allergies and medications from medical history
    let allergies: string[] = [];
    let medications: string[] = [];
    let conditions: string[] = [];

    if (patientData.medicalHistory) {
      try {
        const medicalHistory = typeof patientData.medicalHistory === 'string' 
          ? JSON.parse(patientData.medicalHistory)
          : patientData.medicalHistory;
        
        allergies = medicalHistory.allergies || [];
        medications = medicalHistory.medications || medicalHistory.currentMedications || [];
        
        // Collect medical conditions from boolean fields
        if (patientData.hypertension) conditions.push('Hypertension');
        if (patientData.diabetes) conditions.push('Diabetes');
        if (patientData.heartDisease) conditions.push('Heart Disease');
        if (patientData.asthma) conditions.push('Asthma');
        if (patientData.arthritis) conditions.push('Arthritis');
        if (patientData.cancer) conditions.push('Cancer');
        if (patientData.stroke) conditions.push('Stroke');
        if (patientData.kidneyDisease) conditions.push('Kidney Disease');
        if (patientData.liverDisease) conditions.push('Liver Disease');
        if (patientData.thyroidDisease) conditions.push('Thyroid Disease');
        if (patientData.mentalIllness) conditions.push('Mental Illness');
        if (patientData.seizures) conditions.push('Seizures');
        if (patientData.bleedingDisorders) conditions.push('Bleeding Disorders');
        if (patientData.autoimmune) conditions.push('Autoimmune Disorder');
        if (patientData.hepatitis) conditions.push('Hepatitis');
        if (patientData.hivAids) conditions.push('HIV/AIDS');
        if (patientData.lungDisease) conditions.push('Lung Disease');
        if (patientData.osteoporosis) conditions.push('Osteoporosis');
      } catch (e) {
        console.error('Error parsing medical history:', e);
      }
    }

    // Get previous prescriptions for the patient
    const previousPrescriptions = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, patientId),
      orderBy: (prescriptions, { desc }) => [desc(prescriptions.date)]
    });

    // Format previous prescriptions for AI input
    const formattedPreviousPrescriptions = previousPrescriptions.map(p => ({
      drugName: p.drugName,
      lastPrescribed: p.date.toISOString().split('T')[0],
      wasEffective: p.status !== 'cancelled' // Simple heuristic for effectiveness
    }));

    // Prepare input for AI prescription generation
    const aiInput = {
      patientId,
      patientName: `${patientData.firstName} ${patientData.lastName}`,
      patientAllergies: allergies,
      conditions,
      medications,
      requestedMedication,
      reason,
      previousPrescriptions: formattedPreviousPrescriptions
    };

    // Generate prescription recommendation
    const prescriptionSuggestion = await generateAiPrescription(aiInput);

    // Generate draft prescription object
    const prescriptionDraft = createPrescriptionDraft(
      prescriptionSuggestion,
      req.user.id,
      patientId,
      JSON.stringify(aiInput)
    );

    // If a specific medication was requested, check for safety
    let safetyCheck = null;
    if (requestedMedication) {
      safetyCheck = await checkMedicationSafety(requestedMedication, {
        allergies,
        currentMedications: medications,
        medicalConditions: conditions
      });
    }

    res.status(200).json({
      suggestion: prescriptionSuggestion,
      draft: prescriptionDraft,
      safetyCheck,
      patientData: {
        allergies,
        medications,
        conditions
      }
    });
  } catch (error: any) {
    console.error('Error generating prescription:', error);
    res.status(500).json({ message: 'Failed to generate prescription', error: error.message });
  }
});

/**
 * @route POST /prescriptions
 * @desc Create a new prescription
 * @access Private - Doctors only
 */
router.post('/prescriptions', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const validationResult = insertPrescriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid prescription data', errors: validationResult.error.errors });
    }

    const prescriptionData = validationResult.data;
    
    // Ensure the doctor is the one creating it
    prescriptionData.doctorId = req.user.id;
    
    // If signed, set signedBy and signedAt
    if (req.body.signed) {
      prescriptionData.signedBy = req.user.id;
      prescriptionData.signedAt = new Date();
    }

    // Insert prescription into database
    const [newPrescription] = await db.insert(prescriptions).values(prescriptionData).returning();

    res.status(201).json(newPrescription);
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Failed to create prescription', error: error.message });
  }
});

/**
 * @route GET /prescriptions/patient/:patientId
 * @desc Get all prescriptions for a patient
 * @access Private
 */
router.get('/prescriptions/patient/:patientId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    // Verify access rights - doctors can access any patient's prescriptions,
    // patients can only access their own
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Unauthorized access to patient prescriptions' });
    }

    const patientPrescriptions = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, patientId),
      orderBy: (prescriptions, { desc }) => [desc(prescriptions.date)]
    });

    res.status(200).json(patientPrescriptions);
  } catch (error: any) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

/**
 * @route GET /prescriptions/:id
 * @desc Get a specific prescription
 * @access Private
 */
router.get('/prescriptions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const prescriptionId = parseInt(req.params.id, 10);
    if (isNaN(prescriptionId)) {
      return res.status(400).json({ message: 'Invalid prescription ID' });
    }

    const prescription = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, prescriptionId)
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify access rights
    if (req.user.role === 'patient' && req.user.id !== prescription.patientId) {
      return res.status(403).json({ message: 'Unauthorized access to prescription' });
    }

    res.status(200).json(prescription);
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

/**
 * @route PATCH /prescriptions/:id
 * @desc Update a prescription (doctors only)
 * @access Private - Doctors only
 */
router.patch('/prescriptions/:id', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const prescriptionId = parseInt(req.params.id, 10);
    if (isNaN(prescriptionId)) {
      return res.status(400).json({ message: 'Invalid prescription ID' });
    }

    // Find the prescription first
    const existingPrescription = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, prescriptionId)
    });

    if (!existingPrescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only the prescribing doctor can modify it
    if (existingPrescription.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'Only the prescribing doctor can modify this prescription' });
    }

    // Don't allow updating certain fields
    const { id, patientId, doctorId, date, ...allowedUpdates } = req.body;

    // If signing the prescription, add signature details
    if (req.body.status === 'active' && !existingPrescription.signedBy) {
      allowedUpdates.signedBy = req.user.id;
      allowedUpdates.signedAt = new Date();
    }

    // Update the prescription
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set({ ...allowedUpdates, updatedAt: new Date() })
      .where(eq(prescriptions.id, prescriptionId))
      .returning();

    res.status(200).json(updatedPrescription);
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Failed to update prescription', error: error.message });
  }
});

/**
 * @route DELETE /prescriptions/:id
 * @desc Cancel a prescription (doesn't actually delete it, just marks as cancelled)
 * @access Private - Doctors only
 */
router.delete('/prescriptions/:id', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const prescriptionId = parseInt(req.params.id, 10);
    if (isNaN(prescriptionId)) {
      return res.status(400).json({ message: 'Invalid prescription ID' });
    }

    // Find the prescription first
    const existingPrescription = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.id, prescriptionId)
    });

    if (!existingPrescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only the prescribing doctor can cancel it
    if (existingPrescription.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'Only the prescribing doctor can cancel this prescription' });
    }

    // Update the prescription status to cancelled
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set({ 
        status: 'cancelled', 
        updatedAt: new Date(),
        notes: req.body.reason 
          ? `${existingPrescription.notes || ''}\nCancelled: ${req.body.reason}`
          : `${existingPrescription.notes || ''}\nCancelled by doctor.`
      })
      .where(eq(prescriptions.id, prescriptionId))
      .returning();

    res.status(200).json(updatedPrescription);
  } catch (error: any) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json({ message: 'Failed to cancel prescription', error: error.message });
  }
});

export default router;