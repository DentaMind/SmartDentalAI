import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { z } from 'zod';
import { db } from '../db';
import { 
  treatmentPlans, 
  appointments, 
  insertTreatmentPlanSchema,
  insertAppointmentSchema 
} from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { integrationService } from '../services/integration';
import { aiServiceManager } from '../services/ai-service-manager';
import { securityService } from '../services/security';

const router = express.Router();

// Schema for procedure in a treatment plan
const procedureSchema = z.object({
  code: z.string(),
  description: z.string(),
  tooth: z.string().optional(),
  fee: z.number(),
  insuranceCoverage: z.number().optional().nullable(),
  patientResponsibility: z.number().optional().nullable(),
  insuranceCategory: z.enum(['preventive', 'basic', 'major', 'orthodontic']).optional(),
  completed: z.boolean().default(false)
});

// Schema for approving a treatment plan
const approvalSchema = z.object({
  signature: z.string(),
  agreements: z.array(z.string()).optional(),
  termsAccepted: z.boolean()
});

// Schema for scheduling procedures from a treatment plan
const scheduleSchema = z.object({
  autoSchedule: z.boolean().optional(),
  dates: z.array(z.object({
    procedureIndex: z.number(),
    date: z.string().datetime() 
  })).optional()
});

// Schema for completing a procedure
const completeProcedureSchema = z.object({
  procedureIndex: z.number(),
  notes: z.string().optional(),
  actualCost: z.number().optional()
});

// Get a single treatment plan
router.get('/treatment-plans/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    
    const treatmentPlan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, planId)
    });
    
    if (!treatmentPlan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    // Get associated appointments
    const planAppointments = await db.query.appointments.findMany({
      where: eq(appointments.treatmentPlanId, planId)
    });
    
    // Get any associated documents
    const treatmentAgreements = []; // Would fetch from legalDocuments table
    
    // Get any associated insurance claims
    const insuranceClaims = []; // Would fetch from insuranceClaims table
    
    return res.json({
      treatmentPlan,
      appointments: planAppointments,
      treatmentAgreements,
      insuranceClaims
    });
    
  } catch (error: any) {
    console.error('Error fetching treatment plan:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch treatment plan' });
  }
});

// Get patient's treatment plans
router.get('/patients/:patientId/treatment-plans', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    const plans = await db.query.treatmentPlans.findMany({
      where: eq(treatmentPlans.patientId, patientId),
      orderBy: (treatmentPlans, { desc }) => [desc(treatmentPlans.createdAt)]
    });
    
    return res.json({ treatmentPlans: plans });
    
  } catch (error: any) {
    console.error('Error fetching patient treatment plans:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch treatment plans' });
  }
});

// Create a new treatment plan
router.post('/treatment-plans', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const planData = insertTreatmentPlanSchema.parse(req.body);
    
    // Assign the logged-in doctor as creator
    const doctorId = req.user!.id;
    
    // Create the treatment plan
    const newPlan = await db.insert(treatmentPlans).values({
      ...planData,
      doctorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: doctorId,
      lastUpdatedBy: doctorId,
      status: 'proposed'
    }).returning();
    
    // Create an audit log
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'create_treatment_plan',
      resource: `treatment_plan/${newPlan[0].id}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        planId: newPlan[0].id,
        patientId: planData.patientId
      }
    });
    
    return res.status(201).json({ treatmentPlan: newPlan[0] });
    
  } catch (error: any) {
    console.error('Error creating treatment plan:', error);
    return res.status(400).json({ error: error.message || 'Failed to create treatment plan' });
  }
});

// Approve a treatment plan
router.post('/treatment-plans/:id/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const { signature, agreements, termsAccepted } = approvalSchema.parse(req.body);
    
    // Get the treatment plan
    const plan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    // Check if plan is in a state that can be approved
    if (plan.status !== 'proposed') {
      return res.status(400).json({ 
        error: 'Invalid plan status', 
        message: 'Only proposed treatment plans can be approved'
      });
    }
    
    // Update the plan status to accepted
    const updatedPlan = await db.update(treatmentPlans)
      .set({
        status: 'accepted',
        signedByPatient: true,
        patientSignatureDate: new Date(),
        updatedAt: new Date(),
        lastUpdatedBy: req.user!.id
      })
      .where(eq(treatmentPlans.id, planId))
      .returning();
    
    // Save the signature and agreements
    // (In a real system, you'd store the signature image and create records
    // for each agreement the patient accepted)
    
    // Create an audit log
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'approve_treatment_plan',
      resource: `treatment_plan/${planId}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        planId,
        patientId: plan.patientId,
        agreementsAccepted: agreements?.length || 0
      }
    });
    
    return res.json({ treatmentPlan: updatedPlan[0] });
    
  } catch (error: any) {
    console.error('Error approving treatment plan:', error);
    return res.status(400).json({ error: error.message || 'Failed to approve treatment plan' });
  }
});

// Schedule appointments for a treatment plan
router.post('/treatment-plans/:id/schedule', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const scheduleData = scheduleSchema.parse(req.body);
    
    // Get the treatment plan
    const plan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    // Check if plan is in a state that can be scheduled
    if (plan.status !== 'accepted') {
      return res.status(400).json({ 
        error: 'Invalid plan status', 
        message: 'Only accepted treatment plans can be scheduled'
      });
    }
    
    let appointments = [];
    
    // Extract procedures
    const procedures = Array.isArray(plan.procedures) 
      ? plan.procedures 
      : typeof plan.procedures === 'object' 
        ? Object.values(plan.procedures) 
        : [];
        
    if (procedures.length === 0) {
      return res.status(400).json({ 
        error: 'No procedures', 
        message: 'Treatment plan has no procedures to schedule'
      });
    }
    
    // If auto-scheduling is requested, generate appointment dates
    if (scheduleData.autoSchedule) {
      // In a real system, we'd use a scheduler algorithm that considers:
      // - Doctor availability
      // - Patient availability
      // - Procedure sequence/dependencies
      // - Procedure duration
      // - Healing time between procedures
      
      // For this implementation, we'll schedule each procedure 1 week apart
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start first appointment one week from now
      
      for (let i = 0; i < procedures.length; i++) {
        const procedureDate = new Date(startDate);
        procedureDate.setDate(startDate.getDate() + (i * 7)); // Each procedure 1 week apart
        
        const appointment = {
          date: procedureDate,
          patientId: plan.patientId,
          doctorId: plan.doctorId,
          type: 'treatment',
          status: 'scheduled',
          duration: 60, // Default 60 minute duration
          notes: `Procedure: ${procedures[i].description}`,
          procedureCode: procedures[i].code,
          treatmentPlanId: planId
        };
        
        appointments.push(appointment);
      }
    } 
    // Otherwise use the provided dates
    else if (scheduleData.dates && scheduleData.dates.length > 0) {
      for (const item of scheduleData.dates) {
        if (item.procedureIndex >= procedures.length) {
          return res.status(400).json({ 
            error: 'Invalid procedure index', 
            message: `Procedure index ${item.procedureIndex} is out of bounds`
          });
        }
        
        const procedure = procedures[item.procedureIndex];
        const appointment = {
          date: new Date(item.date),
          patientId: plan.patientId,
          doctorId: plan.doctorId,
          type: 'treatment',
          status: 'scheduled',
          duration: 60, // Default 60 minute duration
          notes: `Procedure: ${procedure.description}`,
          procedureCode: procedure.code,
          treatmentPlanId: planId
        };
        
        appointments.push(appointment);
      }
    } else {
      return res.status(400).json({ 
        error: 'No scheduling data', 
        message: 'Either autoSchedule must be true or dates must be provided'
      });
    }
    
    // Create the appointments
    const createdAppointments = [];
    for (const appt of appointments) {
      const created = await db.insert(appointments).values(appt).returning();
      createdAppointments.push(created[0]);
    }
    
    // Update the plan status to in_progress
    const updatedPlan = await db.update(treatmentPlans)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
        lastUpdatedBy: req.user!.id
      })
      .where(eq(treatmentPlans.id, planId))
      .returning();
    
    // Create an audit log
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'schedule_treatment_plan',
      resource: `treatment_plan/${planId}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        planId,
        patientId: plan.patientId,
        appointmentsCreated: createdAppointments.length
      }
    });
    
    return res.json({
      treatmentPlan: updatedPlan[0],
      appointments: createdAppointments
    });
    
  } catch (error: any) {
    console.error('Error scheduling treatment plan:', error);
    return res.status(400).json({ error: error.message || 'Failed to schedule treatment plan' });
  }
});

// Mark a procedure as completed
router.post('/treatment-plans/:id/complete-procedure', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const { procedureIndex, notes, actualCost } = completeProcedureSchema.parse(req.body);
    
    // Get the treatment plan
    const plan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    // Check if plan is in a state where procedures can be marked complete
    if (plan.status !== 'in_progress') {
      return res.status(400).json({ 
        error: 'Invalid plan status', 
        message: 'Only in-progress treatment plans can have procedures marked as complete'
      });
    }
    
    // Extract procedures
    const procedures = Array.isArray(plan.procedures) 
      ? [...plan.procedures] 
      : typeof plan.procedures === 'object' 
        ? [...Object.values(plan.procedures)] 
        : [];
        
    if (procedures.length === 0 || procedureIndex >= procedures.length) {
      return res.status(400).json({ 
        error: 'Invalid procedure index', 
        message: 'The specified procedure does not exist'
      });
    }
    
    // Update the procedure
    procedures[procedureIndex] = {
      ...procedures[procedureIndex],
      completed: true,
      completedDate: new Date().toISOString(),
      completedBy: req.user!.id,
      notes: notes || procedures[procedureIndex].notes
    };
    
    if (actualCost) {
      procedures[procedureIndex].actualCost = actualCost;
    }
    
    // Check if all procedures are now completed
    const allCompleted = procedures.every((proc: any) => proc.completed);
    
    // Update the plan
    const updatedPlan = await db.update(treatmentPlans)
      .set({
        procedures,
        status: allCompleted ? 'completed' : 'in_progress',
        updatedAt: new Date(),
        lastUpdatedBy: req.user!.id,
        completedDate: allCompleted ? new Date() : null
      })
      .where(eq(treatmentPlans.id, planId))
      .returning();
    
    // If the procedure has an associated appointment, update its status
    if (procedures[procedureIndex].code) {
      await db.update(appointments)
        .set({
          status: 'completed',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(appointments.treatmentPlanId, planId),
            eq(appointments.procedureCode, procedures[procedureIndex].code)
          )
        );
    }
    
    // Check if we need to create an insurance claim
    if (procedures[procedureIndex].insuranceCoverage > 0) {
      // In a real implementation, this would create an insurance claim record
      // and potentially submit it electronically to the insurance company
      await integrationService.submitElectronicClaim({
        patientId: plan.patientId,
        procedureCode: procedures[procedureIndex].code,
        procedureDate: new Date(),
        fee: procedures[procedureIndex].fee,
        insuranceCoverage: procedures[procedureIndex].insuranceCoverage,
        tooth: procedures[procedureIndex].tooth
      });
    }
    
    // Create an audit log
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'complete_procedure',
      resource: `treatment_plan/${planId}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        planId,
        patientId: plan.patientId,
        procedureIndex,
        procedureCode: procedures[procedureIndex].code,
        planStatus: updatedPlan[0].status
      }
    });
    
    return res.json({
      treatmentPlan: updatedPlan[0]
    });
    
  } catch (error: any) {
    console.error('Error completing procedure:', error);
    return res.status(400).json({ error: error.message || 'Failed to complete procedure' });
  }
});

// Cancel a treatment plan
router.post('/treatment-plans/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    
    // Get the treatment plan
    const plan = await db.query.treatmentPlans.findFirst({
      where: eq(treatmentPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Treatment plan not found' });
    }
    
    // Check if plan is in a state that can be cancelled
    if (plan.status === 'completed' || plan.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Invalid plan status', 
        message: 'This treatment plan cannot be cancelled'
      });
    }
    
    // Update the plan status to cancelled
    const updatedPlan = await db.update(treatmentPlans)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        lastUpdatedBy: req.user!.id
      })
      .where(eq(treatmentPlans.id, planId))
      .returning();
    
    // Cancel any associated appointments
    await db.update(appointments)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(appointments.treatmentPlanId, planId));
    
    // Create an audit log
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'cancel_treatment_plan',
      resource: `treatment_plan/${planId}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        planId,
        patientId: plan.patientId
      }
    });
    
    return res.json({ treatmentPlan: updatedPlan[0] });
    
  } catch (error: any) {
    console.error('Error cancelling treatment plan:', error);
    return res.status(400).json({ error: error.message || 'Failed to cancel treatment plan' });
  }
});

// Generate an AI-assisted treatment plan
router.post('/treatment-plans/generate', requireAuth, requireRole(['doctor']), async (req: Request, res: Response) => {
  try {
    const { patientId, diagnosis, teeth, conditions } = z.object({
      patientId: z.number(),
      diagnosis: z.string(),
      teeth: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional()
    }).parse(req.body);
    
    // In a real implementation, this would:
    // 1. Fetch the patient's medical history and insurance details
    // 2. Send the diagnosis and other info to an AI service
    // 3. Receive back a structured treatment plan with options
    
    // For this example, we'll simulate AI generation
    const treatmentPlanOptions = await aiServiceManager.generateTreatmentPlan(
      diagnosis,
      undefined, // patient history would go here
      undefined  // insurance provider would go here
    );
    
    return res.json({
      treatmentPlanOptions,
      message: 'Generated treatment plan options'
    });
    
  } catch (error: any) {
    console.error('Error generating treatment plan:', error);
    return res.status(400).json({ error: error.message || 'Failed to generate treatment plan' });
  }
});

export default router;