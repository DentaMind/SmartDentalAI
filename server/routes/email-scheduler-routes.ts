import express from 'express';
import { EmailAIService } from '../services/email-ai-service';
import { z } from 'zod';

/**
 * Setup email scheduler related routes
 */
export function setupEmailSchedulerRoutes(router: express.Router, emailService: EmailAIService) {
  
  // Schema for scheduling email
  const scheduleEmailSchema = z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
    scheduledTime: z.string().optional(),
    patientId: z.number().optional(),
    senderId: z.number().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    category: z.enum(['appointment', 'reminder', 'follow-up', 'marketing', 'billing', 'general']).optional()
  });

  // Schedule an email to be sent at a specific time
  router.post('/email/schedule', async (req, res) => {
    try {
      const emailData = scheduleEmailSchema.parse(req.body);
      
      // Call email service
      const result = await emailService.scheduleEmail({
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        scheduledTime: emailData.scheduledTime,
        patientId: emailData.patientId,
        senderId: emailData.senderId,
        templateId: emailData.templateId,
        variables: emailData.variables,
        priority: emailData.priority,
        category: emailData.category
      });
      
      res.json({
        success: true,
        message: 'Email scheduled successfully',
        id: result.id
      });
    } catch (error) {
      console.error('Failed to schedule email:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to schedule email'
      });
    }
  });

  // Get scheduled emails
  router.get('/email/scheduled', async (req, res) => {
    try {
      const scheduledEmails = await emailService.getScheduledEmails();
      res.json({ emails: scheduledEmails });
    } catch (error) {
      console.error('Failed to get scheduled emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled emails'
      });
    }
  });

  // Cancel a scheduled email
  router.delete('/email/schedule/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await emailService.cancelScheduledEmail(id);
      
      if (success) {
        res.json({
          success: true,
          message: 'Email canceled successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Scheduled email not found'
        });
      }
    } catch (error) {
      console.error('Failed to cancel email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel email'
      });
    }
  });

  // Send a patient form via email
  router.post('/email/send-patient-form', async (req, res) => {
    try {
      // Validate request
      const formData = z.object({
        to: z.string().email(),
        patientName: z.string(),
        formType: z.string(),
        formUrl: z.string().url(),
        customMessage: z.string().optional(),
        appointmentDate: z.string().optional(),
        sendCopy: z.boolean().optional(),
        practiceEmail: z.string().email().optional()
      }).parse(req.body);

      // Send the email with form link
      const result = await emailService.sendPatientForm(formData);

      if (result.success) {
        res.json({
          success: true,
          message: 'Patient form email sent successfully',
          trackingId: result.trackingId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send patient form email',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending patient form email:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid request data'
      });
    }
  });

  return router;
}