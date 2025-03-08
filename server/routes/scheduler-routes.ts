import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { schedulerService } from '../services/scheduler';
import { notificationService } from '../services/notifications';
import { 
  reminderSettingsSchema, 
  ReminderSettings, 
  CompleteReminderSettings, 
  ReminderLogResponse,
  ReminderTimeframeType
} from '../../shared/schema';

const router = express.Router();

// Get reminder settings
router.get('/reminders/settings', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const settings = await schedulerService.getReminderSettings();
    
    // If settings are missing or incomplete, add some default values for testing
    if (!settings) {
      return res.json({
        enabled: true,
        reminderTypes: [
          { timeframe: '24h', priority: 'high', method: 'both' },
          { timeframe: '48h', priority: 'medium', method: 'email' },
          { timeframe: '1week', priority: 'low', method: 'email' }
        ],
        lastRunTime: new Date().toISOString(),
        remindersSentToday: 12,
        remindersSentThisWeek: 45,
        deliveryStats: {
          email: {
            sent: 40,
            opened: 35,
            failureRate: 0.05
          },
          sms: {
            sent: 15,
            delivered: 14,
            failureRate: 0.07
          }
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get reminder settings" 
    });
  }
});

// Update reminder settings
router.post('/reminders/settings', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
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

// This route was duplicated - removed in favor of the implementation below

// Get reminder stats
router.get('/reminders/stats', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const stats = await schedulerService.getReminderStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get reminder stats" 
    });
  }
});

// Get reminder logs 
router.get('/reminders/logs', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    // Mock data for testing the UI
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        patientId: 1,
        patientName: 'John Smith',
        timeframe: '24h',
        sentTo: 'john@example.com',
        status: 'delivered',
        method: 'email',
        appointmentId: 101
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        patientId: 2,
        patientName: 'Jane Doe',
        timeframe: '48h',
        sentTo: '+1234567890',
        status: 'sent',
        method: 'sms',
        appointmentId: 102
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        patientId: 3,
        patientName: 'Robert Johnson',
        timeframe: '1week',
        sentTo: 'robert@example.com',
        status: 'opened',
        method: 'email',
        appointmentId: 103
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        patientId: 4,
        patientName: 'Maria Garcia',
        timeframe: '24h',
        sentTo: '+1987654321',
        status: 'failed',
        method: 'sms',
        appointmentId: 104
      }
    ];
    
    res.json({
      items: mockLogs,
      totalCount: mockLogs.length,
      page: 1,
      pageSize: 10,
      totalPages: 1
    });
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to get reminder logs" 
    });
  }
});

// Send reminders manually
router.post('/reminders/send', requireAuth, requireRole(['doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const { timeframe = 'all' } = req.body;
    
    if (timeframe !== 'all' && timeframe !== '24h' && timeframe !== '48h' && timeframe !== '1week') {
      return res.status(400).json({ message: "Invalid timeframe. Must be '24h', '48h', '1week', or 'all'" });
    }
    
    const result = await schedulerService.sendReminders(timeframe);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to send reminders" 
    });
  }
});

// Get appointments by date range
router.get('/appointments', requireAuth, async (req: Request, res: Response) => {
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