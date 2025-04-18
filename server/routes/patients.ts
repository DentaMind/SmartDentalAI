import { Router } from 'express';
import { db } from '../db';
import { patients } from '../../shared/schema';
import { eq, and, or, like } from 'drizzle-orm';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';
import { AuditLogService } from '../services/audit-log';

const router = Router();

// Validation schemas
const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().max(20).optional(),
  gender: z.string().max(10).optional(),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  insuranceProvider: z.string().max(255).optional(),
  insuranceId: z.string().max(100).optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  conditions: z.string().optional(),
  emergencyContact: z.string().optional(),
  preferredLanguage: z.string().max(50).optional(),
  preferredCommunication: z.string().max(50).optional(),
});

const updatePatientSchema = createPatientSchema.partial();

// POST /api/patients/create
router.post('/create', validateRequest({ body: createPatientSchema }), async (req, res) => {
  try {
    const newPatient = await db.insert(patients).values({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await AuditLogService.logAction(
      req.user?.id || 0,
      req.user?.email || 'system',
      req.user?.role || 'system',
      'patient_create',
      'success',
      'Created new patient record',
      { patientId: newPatient[0].id }
    );

    res.json(newPatient[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const patient = await db.select().from(patients).where(eq(patients.id, id));
    if (patient.length === 0) return res.status(404).json({ error: 'Patient not found' });

    await AuditLogService.logAction(
      req.user?.id || 0,
      req.user?.email || 'system',
      req.user?.role || 'system',
      'patient_view',
      'success',
      'Viewed patient record',
      { patientId: id }
    );

    res.json(patient[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GET /api/patients (List all with search)
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = db.select().from(patients).where(eq(patients.isActive, true));

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(patients.firstName, searchTerm),
          like(patients.lastName, searchTerm),
          like(patients.email, searchTerm),
          like(patients.phone, searchTerm)
        )
      );
    }

    const allPatients = await query
      .orderBy(patients.createdAt)
      .limit(Number(limit))
      .offset(offset);

    const total = await db.select({ count: db.fn.count() }).from(patients);

    res.json({
      patients: allPatients,
      pagination: {
        total: Number(total[0].count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(total[0].count) / Number(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// PUT /api/patients/:id
router.put('/:id', validateRequest({ body: updatePatientSchema }), async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const updatedPatient = await db.update(patients)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(patients.id, id))
      .returning();

    if (updatedPatient.length === 0) return res.status(404).json({ error: 'Patient not found' });

    await AuditLogService.logAction(
      req.user?.id || 0,
      req.user?.email || 'system',
      req.user?.role || 'system',
      'patient_update',
      'success',
      'Updated patient record',
      { patientId: id }
    );

    res.json(updatedPatient[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// DELETE /api/patients/:id (Soft delete)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const deletedPatient = await db.update(patients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();

    if (deletedPatient.length === 0) return res.status(404).json({ error: 'Patient not found' });

    await AuditLogService.logAction(
      req.user?.id || 0,
      req.user?.email || 'system',
      req.user?.role || 'system',
      'patient_delete',
      'success',
      'Soft deleted patient record',
      { patientId: id }
    );

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router; 