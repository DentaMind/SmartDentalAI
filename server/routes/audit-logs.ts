import { Router } from 'express';
import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { and, between, eq, like, or } from 'drizzle-orm';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { startDate, endDate, action, role, search } = req.body;

    let query = db.select().from(auditLogs);

    // Apply date range filter
    if (startDate && endDate) {
      query = query.where(
        between(auditLogs.createdAt, new Date(startDate), new Date(endDate))
      );
    }

    // Apply action filter
    if (action) {
      query = query.where(like(auditLogs.action, `%${action}%`));
    }

    // Apply role filter
    if (role) {
      query = query.where(eq(auditLogs.userRole, role));
    }

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          like(auditLogs.userEmail, `%${search}%`),
          like(auditLogs.details, `%${search}%`),
          like(auditLogs.adminNotes, `%${search}%`)
        )
      );
    }

    // Order by most recent first
    query = query.orderBy(auditLogs.createdAt);

    const logs = await query;
    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const { id, notes } = req.body;

    await db
      .update(auditLogs)
      .set({ adminNotes: notes })
      .where(eq(auditLogs.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update admin notes:', error);
    res.status(500).json({ error: 'Failed to update admin notes' });
  }
});

export default router; 