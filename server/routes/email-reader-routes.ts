import express from 'express';
import { z } from 'zod';
import { EmailReaderService } from '../services/email-reader-service';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const emailReaderService = new EmailReaderService();

// Zod schema for email configuration
const emailConnectionSchema = z.object({
  user: z.string().email(),
  password: z.string(),
  host: z.string(),
  port: z.number().int().positive(),
  tls: z.boolean(),
  folderNames: z.array(z.string()).optional(),
  practiceId: z.string().optional()
});

// Zod schema for email processing settings
const emailProcessingSettingsSchema = z.object({
  autoRespond: z.boolean().default(false),
  categorizeEmails: z.boolean().default(true),
  extractAppointmentRequests: z.boolean().default(true),
  notifyStaff: z.boolean().default(true),
  maxEmailsToProcess: z.number().int().positive().default(50)
});

// Configure email connection
router.post('/configure', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    // Validate request body against schema
    const connectionConfig = emailConnectionSchema.parse(req.body);
    
    // Add the user ID to track who configured this email
    const userId = req.user?.id || 1;
    
    // Configure the email account
    const result = await emailReaderService.configureEmailAccount({
      ...connectionConfig,
      practiceId: connectionConfig.practiceId || `practice_${userId}`
    });
    
    res.json({
      success: true,
      message: 'Email configuration saved successfully',
      result
    });
  } catch (error) {
    console.error('Error configuring email connection:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid configuration',
      error: error instanceof z.ZodError ? error.errors : undefined
    });
  }
});

// Update processing settings
router.post('/settings', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const settings = emailProcessingSettingsSchema.parse(req.body);
    const userId = req.user?.id || 1;
    
    await emailReaderService.updateProcessingSettings(userId.toString(), settings);
    
    res.json({
      success: true,
      message: 'Email processing settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating email processing settings:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid settings',
      error: error instanceof z.ZodError ? error.errors : undefined
    });
  }
});

// Test email connection
router.post('/test-connection', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const connectionConfig = emailConnectionSchema.parse(req.body);
    
    const testResult = await emailReaderService.testConnection(connectionConfig);
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details
    });
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid configuration',
      error: error instanceof z.ZodError ? error.errors : undefined
    });
  }
});

// Start reading emails (manual trigger)
router.post('/start', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { practiceId } = req.body;
    const userId = req.session.userId;
    
    if (!practiceId) {
      return res.status(400).json({
        success: false,
        message: 'Practice ID is required'
      });
    }
    
    const result = await emailReaderService.startProcessingEmails(practiceId);
    
    res.json({
      success: result.success,
      message: result.message,
      details: result.details
    });
  } catch (error) {
    console.error('Error starting email processing:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start email processing'
    });
  }
});

// Stop reading emails (manual trigger)
router.post('/stop', requireAuth, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { practiceId } = req.body;
    const userId = req.session.userId;
    
    if (!practiceId) {
      return res.status(400).json({
        success: false,
        message: 'Practice ID is required'
      });
    }
    
    const result = await emailReaderService.stopProcessingEmails(practiceId);
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error stopping email processing:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to stop email processing'
    });
  }
});

// Get status of email processing
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const practiceId = req.query.practiceId as string || `practice_${userId}`;
    
    const status = await emailReaderService.getEmailProcessingStatus(practiceId);
    
    res.json(status);
  } catch (error) {
    console.error('Error getting email processing status:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get status'
    });
  }
});

// Get processed emails
router.get('/processed-emails', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const practiceId = req.query.practiceId as string || `practice_${userId}`;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const category = req.query.category as string || undefined;
    
    const processedEmails = await emailReaderService.getProcessedEmails(
      practiceId,
      page,
      limit,
      category
    );
    
    res.json(processedEmails);
  } catch (error) {
    console.error('Error getting processed emails:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get processed emails'
    });
  }
});

export default router;