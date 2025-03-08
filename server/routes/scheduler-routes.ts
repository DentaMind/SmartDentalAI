import { Router } from 'express';
import { z } from 'zod';
import { schedulerService } from '../services/scheduler';
import { notificationService } from '../services/notifications';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Schema for toggle reminders request
const toggleRemindersSchema = z.object({
  enabled: z.boolean()
});

// Schema for setting reminder configuration
const reminderConfigSchema = z.object({
  timeframe: z.enum(['24h', '48h', '1week']),
  enabled: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  methods: z.array(z.enum(['email', 'sms']))
});

// Get reminder settings
router.get('/reminders/settings', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const settings = await schedulerService.getReminderSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting reminder settings:', error);
    res.status(500).json({ 
      error: 'Failed to get reminder settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Toggle reminders on/off
router.post('/reminders/toggle', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const { enabled } = toggleRemindersSchema.parse(req.body);
    
    // In a real application, this would update a database setting
    // For now we'll just return success
    res.json({ 
      success: true,
      enabled,
      message: `Reminders ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling reminders:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to toggle reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Run reminders immediately
router.post('/reminders/run-now', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const result = await notificationService.sendAppointmentReminders();
    res.json({ 
      success: true,
      count: result.count,
      breakdown: result.breakdown,
      message: `Successfully sent ${result.count} reminders`
    });
  } catch (error) {
    console.error('Error running reminders:', error);
    res.status(500).json({ 
      error: 'Failed to run reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get reminder logs
router.get('/reminders/logs', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    // In a production app, this would fetch from a database
    // For now, return empty results
    res.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20
    });
  } catch (error) {
    console.error('Error getting reminder logs:', error);
    res.status(500).json({ 
      error: 'Failed to get reminder logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update reminder configuration
router.post('/reminders/config', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const configs = z.array(reminderConfigSchema).parse(req.body.configs);
    
    // In a real application, this would update configuration in a database
    res.json({ 
      success: true,
      message: 'Reminder configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating reminder configuration:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update reminder configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;