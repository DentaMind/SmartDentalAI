import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { treatmentPlans, diagnoses } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { requireAuth, requireRole } from '../middleware/auth';
import { aiServiceManager } from '../services/ai-service-manager';
import { securityService } from '../services/security';

const router = express.Router();

// Schema for procedure in a treatment plan
const procedureSchema = z.object({
  code: z.string(),
  description: z.string(),
  price: z.number(),
  priority: z.enum(['high', 'medium', 'low']),
  timing: z.string(),
  alternatives: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Schema for treatment plan
const treatmentPlanSchema = z.object({
  patientId: z.string(),
  title: z.string(),
  diagnosis: z.string(),
  procedures: z.array(procedureSchema),
  reasoning: z.string(),
  confidence: z.number(),
  totalCost: z.number(),
  insuranceCoverage: z.number().optional(),
  outOfPocket: z.number().optional(),
  status: z.enum(['draft', 'approved', 'rejected', 'modified']),
  aiDraft: z.string(),
  approvedPlan: z.string().optional(),
  providerNote: z.string().optional()
});

// Schema for generating a treatment plan
const generateTreatmentPlanSchema = z.object({
  patientId: z.string(),
  includeXrays: z.boolean().default(true),
  includePerio: z.boolean().default(true),
  includeRestorative: z.boolean().default(true)
});

// Schema for approving a treatment plan
const approveTreatmentPlanSchema = z.object({
  planId: z.string(),
  approvedPlan: z.string(),
  providerNote: z.string().optional()
});

// Get treatment plans for a patient
router.get('/:patientId', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    const plans = await db.query.treatmentPlans.findMany({
      where: eq(treatmentPlans.patientId, patientId),
      orderBy: (treatmentPlans, { desc }) => [desc(treatmentPlans.createdAt)]
    });
    
    return res.json(plans);
  } catch (error) {
    console.error('Error fetching treatment plans:', error);
    return res.status(500).json({ error: 'Failed to fetch treatment plans' });
  }
});

// Get a specific treatment plan
router.get('/plan/:id', requireAuth, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }
    
    const plan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    return res.json(plan);
  } catch (error) {
    console.error('Error fetching treatment plan:', error);
    return res.status(500).json({ error: 'Failed to fetch treatment plan' });
  }
});

// Generate a new treatment plan
router.post('/generate', requireAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const { patientId, includeXrays, includePerio, includeRestorative } = 
      generateTreatmentPlanSchema.parse(req.body);
    
    // Get the patient's diagnoses
    const patientDiagnoses = await db.query.diagnoses.findMany({
      where: and(
        eq(diagnoses.patientId, parseInt(patientId)),
        eq(diagnoses.status, 'approved')
      ),
      orderBy: (diagnoses, { desc }) => [desc(diagnoses.createdAt)]
    });
    
    // If no approved diagnoses, return an error
    if (patientDiagnoses.length === 0) {
      return res.status(400).json({ 
        error: 'No approved diagnoses found for this patient. Please approve a diagnosis before generating a treatment plan.' 
      });
    }
    
    // Get the most recent approved diagnosis
    const recentDiagnosis = patientDiagnoses[0];
    
    // Use AI service to generate treatment plan
    const aiTreatmentPlan = await aiServiceManager.generateTreatmentPlan({
      patientId: parseInt(patientId),
      diagnosisId: recentDiagnosis.id,
      includeXrays,
      includePerio,
      includeRestorative
    });
    
    // Create a new treatment plan record
    const newPlan = await db.insert(treatmentPlans).values({
      patientId: parseInt(patientId),
      title: aiTreatmentPlan.title || `Treatment Plan for ${recentDiagnosis.condition}`,
      diagnosis: recentDiagnosis.condition,
      procedures: aiTreatmentPlan.procedures,
      reasoning: aiTreatmentPlan.reasoning,
      confidence: aiTreatmentPlan.confidence || 0.7,
      totalCost: aiTreatmentPlan.totalCost || 0,
      status: 'draft',
      aiDraft: JSON.stringify(aiTreatmentPlan),
      createdBy: req.user.id,
      createdAt: new Date()
    }).returning();
    
    return res.status(201).json(newPlan[0]);
  } catch (error) {
    console.error('Error generating treatment plan:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to generate treatment plan' });
  }
});

// Approve a treatment plan
router.post('/approve', requireAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const { planId, approvedPlan, providerNote } = approveTreatmentPlanSchema.parse(req.body);
    
    // Verify the plan exists
    const plan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, parseInt(planId))
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    // Update the plan
    const securityLog = securityService.logAction({
      userId: req.user.id,
      action: 'treatment_plan_approval',
      resource: `treatment_plan:${planId}`,
      details: {
        originalStatus: plan.status,
        newStatus: 'approved'
      }
    });
    
    const updatedPlan = await db.update(treatmentPlans)
      .set({
        status: 'approved',
        approvedPlan,
        providerNote,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(treatmentPlans.id, parseInt(planId)))
      .returning();
    
    return res.json(updatedPlan[0]);
  } catch (error) {
    console.error('Error approving treatment plan:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to approve treatment plan' });
  }
});

export default router;