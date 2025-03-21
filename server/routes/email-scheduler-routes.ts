import express from 'express';
import { z } from 'zod';
import { IStorage } from '../types';
import { EmailAIService } from '../services/email-ai-service';

// Schema for scheduling an email
const scheduleEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  scheduledTime: z.string().optional(),
  patientId: z.number().optional(),
  senderId: z.number().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum(['appointment', 'reminder', 'follow-up', 'marketing', 'billing', 'general']).optional(),
});

// Set up email scheduler routes
export function setupEmailSchedulerRoutes(router: express.Router, storage: IStorage) {
  const emailService = new EmailAIService();
  
  // Route to schedule an email
  router.post('/email/schedule', async (req, res) => {
    try {
      // Validate request against schema
      const emailData = scheduleEmailSchema.parse(req.body);
      
      // Schedule the email
      const result = await emailService.scheduleEmail(emailData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule email');
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Email scheduled successfully',
        id: result.id
      });
    } catch (error) {
      console.error('Error scheduling email:', error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Invalid request data'
      });
    }
  });
  
  // Route to get all scheduled emails
  router.get('/email/scheduled', async (req, res) => {
    try {
      // Get scheduled emails
      const emails = await emailService.getScheduledEmails();
      
      // Return success response
      return res.status(200).json({
        success: true,
        emails
      });
    } catch (error) {
      console.error('Error getting scheduled emails:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error'
      });
    }
  });
  
  // Route to cancel a scheduled email
  router.delete('/email/scheduled/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Cancel the email
      const canceled = await emailService.cancelScheduledEmail(id);
      
      if (!canceled) {
        return res.status(404).json({
          success: false,
          message: 'Email not found or already sent'
        });
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Email canceled successfully'
      });
    } catch (error) {
      console.error('Error canceling email:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error'
      });
    }
  });
  
  // Route to send a patient form via email
  router.post('/email/send-patient-form', async (req, res) => {
    try {
      // Validate request against schema
      const { 
        to, 
        patientName, 
        formType, 
        formUrl, 
        customMessage, 
        appointmentDate,
        sendCopy,
        practiceEmail
      } = req.body;
      
      // Send the patient form
      const result = await emailService.sendPatientForm({
        to,
        patientName,
        formType,
        formUrl,
        customMessage,
        appointmentDate,
        sendCopy,
        practiceEmail
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send patient form');
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Patient form sent successfully',
        trackingId: result.trackingId
      });
    } catch (error) {
      console.error('Error sending patient form:', error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Invalid request data'
      });
    }
  });
  
  // Route to generate AI email content
  router.post('/email/generate-content', async (req, res) => {
    try {
      const { 
        purpose, 
        patientName, 
        patientHistory, 
        appointmentType, 
        appointmentDate,
        lastVisitDate,
        topics,
        tone
      } = req.body;
      
      // Generate AI email content
      const content = await emailService.generateEmailContent({
        purpose,
        patientName,
        patientHistory,
        appointmentType,
        appointmentDate,
        lastVisitDate,
        topics,
        tone
      });
      
      // Return success response
      return res.status(200).json({
        success: true,
        content
      });
    } catch (error) {
      console.error('Error generating email content:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error generating content'
      });
    }
  });
  
  // Return the router for mounting in app.ts
  return router;
}