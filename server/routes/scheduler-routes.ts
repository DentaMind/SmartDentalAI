import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { schedulerService } from '../services/scheduler';
import { notificationService } from '../services/notifications';
import { z } from 'zod';

const router = express.Router();

// Reminder settings schema
const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  reminderTypes: z.array(
    z.object({
      timeframe: z.enum(['24h', '48h', '1week']),
      priority: z.enum(['low', 'medium', 'high']),
      method: z.enum(['email', 'sms', 'both']),
      template: z.string().optional(),
    })
  )
});

// Get reminder settings
router.get('/reminders/settings', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const settings = await schedulerService.getReminderSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get reminder settings" 
    });
  }
});

// Update reminder settings
router.post('/reminders/settings', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const settings = reminderSettingsSchema.parse(req.body);
    await schedulerService.updateReminderSettings(settings);
    res.json({ message: "Reminder settings updated successfully" });
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : "Invalid reminder settings" 
    });
  }
});

// Trigger reminders manually
router.post('/reminders/send', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const { timeframe } = req.body;
    
    if (!['24h', '48h', '1week', 'all'].includes(timeframe)) {
      return res.status(400).json({ message: "Invalid timeframe" });
    }
    
    let count = 0;
    if (timeframe === 'all') {
      await notificationService.sendAppointmentReminders();
      count = -1; // We don't know the exact count in this case
    } else {
      count = await notificationService.sendAppointmentRemindersByTimeframe(
        timeframe as '24h' | '48h' | '1week'
      );
    }
    
    res.json({ 
      message: "Reminders sent successfully", 
      count: count >= 0 ? count : 'multiple'
    });
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to send reminders" 
    });
  }
});

// Get reminder stats
router.get('/reminders/stats', requireAuth, requireRole(['doctor', 'staff']), async (req, res) => {
  try {
    const stats = await schedulerService.getReminderStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get reminder stats" 
    });
  }
});

// Get appointments by date range
router.get('/appointments', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    
    const appointments = await schedulerService.getAppointmentsByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get appointments" 
    });
  }
});

export default router;