import { Router } from 'express';
import { db } from '../db';
import { patientFormRecords } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all form records for a patient
router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await db
      .select()
      .from(patientFormRecords)
      .where(eq(patientFormRecords.patientId, parseInt(patientId)))
      .orderBy(patientFormRecords.createdAt);

    res.json(records);
  } catch (error) {
    console.error('Error fetching form records:', error);
    res.status(500).json({ error: 'Failed to fetch form records' });
  }
});

// Save a new form record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patientId, filePath, fileName, submittedBy, status, formType, version } = req.body;

    if (!patientId || !filePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [record] = await db
      .insert(patientFormRecords)
      .values({
        patientId: parseInt(patientId),
        filePath,
        fileName,
        submittedBy,
        status: status || 'submitted',
        formType: formType || 'intake',
        version: version || 1,
      })
      .returning();

    res.status(201).json(record);
  } catch (error) {
    console.error('Error saving form record:', error);
    res.status(500).json({ error: 'Failed to save form record' });
  }
});

// Delete a form record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db
      .delete(patientFormRecords)
      .where(eq(patientFormRecords.id, parseInt(id)));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting form record:', error);
    res.status(500).json({ error: 'Failed to delete form record' });
  }
});

// PATCH /api/patient-form-records/:id/status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status) {
    return res.status(400).json({ error: 'Missing status' });
  }

  try {
    await db
      .update(patientFormRecords)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(patientFormRecords.id, parseInt(id)));
    
    res.status(200).json({ message: 'Status updated' });
  } catch (err) {
    console.error('Error updating form status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router; 