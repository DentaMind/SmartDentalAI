/**
 * Email Scheduler Routes
 * 
 * API routes for scheduling and managing emails with time-based optimization
 */

import express from 'express';
import { z } from 'zod';
import { EmailAIService } from '../services/email-ai-service';
import { EmailSchedulerService, getEmailSchedulerService, emailScheduleSchema } from '../services/email-scheduler.ts';

// Time window schema for query parameters
const timeWindowSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
});

// Creating a simplified schema for schedule creation
const createScheduleSchema = emailScheduleSchema.omit({
  id: true,
  status: true,
}).extend({
  recipientEmail: z.string().email(),
  scheduledTime: z.string(),
  optimizeDeliveryTime: z.boolean().default(false),
}).partial({
  tracking: true,
});

export function setupEmailSchedulerRoutes(
  router: express.Router,
  emailService: EmailAIService
) {
  const schedulerService = getEmailSchedulerService(emailService);
  
  // Initialize the scheduler service
  schedulerService.initialize().then(success => {
    console.log(`Email scheduler service initialized: ${success ? 'Success' : 'Failed'}`);
  });
  
  // Schedule a new email
  router.post('/email-scheduler', async (req, res) => {
    try {
      // Validate request body
      const validationResult = createScheduleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          details: validationResult.error.errors
        });
      }
      
      // Schedule the email
      const emailData = validationResult.data;
      const scheduledEmail = await schedulerService.scheduleEmail(emailData);
      
      return res.status(201).json({
        success: true,
        message: 'Email scheduled successfully',
        data: scheduledEmail
      });
    } catch (err) {
      console.error('Error scheduling email:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to schedule email',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Get all scheduled emails
  router.get('/email-scheduler', async (req, res) => {
    try {
      const allEmails = schedulerService.getAllScheduledEmails();
      
      return res.status(200).json({
        success: true,
        count: allEmails.length,
        data: allEmails
      });
    } catch (err) {
      console.error('Error getting scheduled emails:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get scheduled emails',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Get a specific scheduled email
  router.get('/email-scheduler/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const email = schedulerService.getScheduledEmail(id);
      
      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled email not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: email
      });
    } catch (err) {
      console.error('Error getting scheduled email:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get scheduled email',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Cancel a scheduled email
  router.delete('/email-scheduler/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await schedulerService.cancelScheduledEmail(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled email not found or already sent'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Scheduled email cancelled successfully'
      });
    } catch (err) {
      console.error('Error cancelling scheduled email:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel scheduled email',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Get scheduled emails for a patient
  router.get('/email-scheduler/patient/:patientId', async (req, res) => {
    try {
      const { patientId } = req.params;
      const patientIdNum = parseInt(patientId, 10);
      
      if (isNaN(patientIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid patient ID'
        });
      }
      
      const emails = schedulerService.getPatientScheduledEmails(patientIdNum);
      
      return res.status(200).json({
        success: true,
        count: emails.length,
        data: emails
      });
    } catch (err) {
      console.error('Error getting patient scheduled emails:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get patient scheduled emails',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Get email analytics
  router.get('/email-scheduler/analytics', async (req, res) => {
    try {
      // Validate query parameters
      const validationResult = timeWindowSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          details: validationResult.error.errors
        });
      }
      
      // Parse date parameters
      const { startDate, endDate, category } = validationResult.data;
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;
      
      // Get analytics
      const analytics = schedulerService.getEmailAnalytics(
        startDateObj,
        endDateObj,
        category
      );
      
      return res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (err) {
      console.error('Error getting email analytics:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get email analytics',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  // Track email engagement (open, click)
  router.get('/email-scheduler/track/:trackingId/:type', async (req, res) => {
    try {
      const { trackingId, type } = req.params;
      
      // Validate tracking type
      if (!['delivered', 'opened', 'clicked'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tracking type'
        });
      }
      
      // Record engagement
      const success = await schedulerService.recordEmailEngagement(
        trackingId,
        type as 'delivered' | 'opened' | 'clicked'
      );
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Email tracking ID not found'
        });
      }
      
      // For open tracking, return a 1x1 transparent pixel
      if (type === 'opened') {
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.end(pixel);
      }
      
      // For click tracking, redirect to the target URL
      if (type === 'clicked') {
        // In a real implementation, we would extract the target URL from a database
        // For now, redirect to the application home page
        return res.redirect('/');
      }
      
      // Return success for delivered status
      return res.status(200).json({
        success: true,
        message: 'Email tracking recorded successfully'
      });
    } catch (err) {
      console.error('Error recording email engagement:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to record email engagement',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  return router;
}