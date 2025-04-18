import { Router } from 'express';
import { db } from '../storage';

const router = Router();

router.post('/events', async (req, res) => {
  try {
    const { event, formId, error } = req.body;
    
    // Log the event to the database
    await db.insert('analytics_events').values({
      event,
      formId,
      error: error || null,
      timestamp: new Date(),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to log analytics event:', err);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

export default router; 