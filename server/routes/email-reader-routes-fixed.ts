/**
 * Email Reader Routes
 * 
 * Provides API endpoints for configuring and managing email reading features
 * for a dental practice's email accounts.
 */
import { Router } from 'express';
import { z } from 'zod';
import { EmailReaderService } from '../services/email-reader-service-fixed';
import '../middleware/auth';

// Helper middleware to check authentication
const ensureAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  next();
};

const emailReaderService = new EmailReaderService();

// Validation schema for email account configuration
const emailConfigSchema = z.object({
  user: z.string().email(),
  password: z.string().min(1),
  host: z.string().min(3),
  port: z.number().int().positive(),
  tls: z.boolean(),
  folderNames: z.array(z.string()).optional(),
  practiceId: z.string().optional()
});

// Validation schema for updating processing settings
const processingSettingsSchema = z.object({
  autoRespond: z.boolean(),
  categorizeEmails: z.boolean(),
  extractAppointmentRequests: z.boolean(),
  notifyStaff: z.boolean(),
  maxEmailsToProcess: z.number().int().positive().max(500)
});

export function setupEmailReaderRoutes(router: Router): Router {
  /**
   * Configure an email account for a practice
   */
  router.post('/email-reader/configure', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      // Validate the request body
      const validationResult = emailConfigSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration data',
          errors: validationResult.error.errors
        });
      }
      
      // Get the validated data
      const config = validationResult.data;
      
      // Set a default practiceId if not provided
      if (!config.practiceId) {
        config.practiceId = req.user.id.toString();
      }
      
      // Configure the email account
      const result = await emailReaderService.configureEmailAccount(config);
      
      return res.json(result);
    } catch (error) {
      console.error('Error configuring email account:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error configuring email account'
      });
    }
  });

  /**
   * Test an email connection without saving configuration
   */
  router.post('/email-reader/test-connection', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      // Validate the request body
      const validationResult = emailConfigSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration data',
          errors: validationResult.error.errors
        });
      }
      
      // Get the validated data
      const config = validationResult.data;
      
      // Test the connection
      const result = await emailReaderService.testConnection(config);
      
      return res.json(result);
    } catch (error) {
      console.error('Error testing email connection:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error testing email connection'
      });
    }
  });

  /**
   * Update email processing settings
   */
  router.post('/email-reader/settings', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      // Validate the request body
      const validationResult = processingSettingsSchema.safeParse(req.body.settings);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid settings data',
          errors: validationResult.error.errors
        });
      }
      
      const practiceId = req.body.practiceId || req.user.id.toString();
      const settings = validationResult.data;
      
      // Update the settings
      const result = await emailReaderService.updateProcessingSettings(practiceId, settings);
      
      return res.json(result);
    } catch (error) {
      console.error('Error updating email processing settings:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating settings'
      });
    }
  });

  /**
   * Start email processing
   */
  router.post('/email-reader/start', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const practiceId = req.body.practiceId || req.user.id.toString();
      
      // Start processing emails
      const result = await emailReaderService.startProcessingEmails(practiceId);
      
      return res.json(result);
    } catch (error) {
      console.error('Error starting email processing:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error starting email processing'
      });
    }
  });

  /**
   * Stop email processing
   */
  router.post('/email-reader/stop', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const practiceId = req.body.practiceId || req.user.id.toString();
      
      // Stop processing emails
      const result = await emailReaderService.stopProcessingEmails(practiceId);
      
      return res.json(result);
    } catch (error) {
      console.error('Error stopping email processing:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error stopping email processing'
      });
    }
  });

  /**
   * Get email processing status
   */
  router.get('/email-reader/status', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const practiceId = req.query.practiceId?.toString() || req.user.id.toString();
      
      // Get the status
      const status = await emailReaderService.getEmailProcessingStatus(practiceId);
      
      return res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting email processing status:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error getting status'
      });
    }
  });

  /**
   * Get processed emails
   */
  router.get('/email-reader/emails', ensureAuthenticated, async (req, res) => {
    try {
      // Make sure we have a user with proper access
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const practiceId = req.query.practiceId?.toString() || req.user.id.toString();
      const page = parseInt(req.query.page?.toString() || '1');
      const pageSize = parseInt(req.query.pageSize?.toString() || '20');
      const category = req.query.category?.toString();
      
      // Get the processed emails
      const emails = await emailReaderService.getProcessedEmails(
        practiceId,
        page,
        pageSize,
        category
      );
      
      return res.json({
        success: true,
        ...emails
      });
    } catch (error) {
      console.error('Error getting processed emails:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error getting emails'
      });
    }
  });

  // Return the router for mounting in app.ts
  return router;
}