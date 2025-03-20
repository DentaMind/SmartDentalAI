import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { z } from 'zod';
import { emailAIService, emailTemplateSchema, emailProviderSchema } from '../services/email-ai-service';

const router = express.Router();

// Email configuration check endpoint
router.get('/email/configuration', requireAuth, requireRole(['admin', 'doctor']), async (req: Request, res: Response) => {
  try {
    const config = await emailAIService.checkEmailConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to check email configuration'
    });
  }
});

// Send templated email endpoint
const sendEmailSchema = z.object({
  templateId: z.string(),
  to: z.string().email(),
  data: z.record(z.string()),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string().optional()
  })).optional()
});

router.post('/email/send', requireAuth, requireRole(['admin', 'doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const { templateId, to, data, attachments } = sendEmailSchema.parse(req.body);
    
    const result = await emailAIService.sendTemplatedEmail(templateId, to, data, attachments);
    
    if (result) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Invalid email data'
    });
  }
});

// Send secure document endpoint
const sendSecureDocumentSchema = z.object({
  patientId: z.number(),
  documentType: z.string(),
  documentId: z.string(),
  patientEmail: z.string().email()
});

router.post('/email/secure-document', requireAuth, requireRole(['admin', 'doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    const { patientId, documentType, documentId, patientEmail } = sendSecureDocumentSchema.parse(req.body);
    
    const result = await emailAIService.sendSecureDocument(patientId, documentType, documentId, patientEmail);
    
    if (result) {
      res.json({ success: true, message: 'Secure document email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send secure document email' });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Invalid secure document request'
    });
  }
});

// Process incoming email endpoint (webhook for email provider integration)
const incomingEmailSchema = z.object({
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  text: z.string(),
  html: z.string().optional(),
  date: z.string(),
  attachments: z.array(z.any()).optional()
});

router.post('/email/incoming', async (req: Request, res: Response) => {
  try {
    // This endpoint would typically be called by an email provider webhook
    // In production, add proper authentication for the webhook

    const emailData = incomingEmailSchema.parse(req.body);
    
    // Process the incoming email with AI
    const analysis = await emailAIService.processIncomingEmail({
      ...emailData,
      date: new Date(emailData.date)
    });
    
    // For patient inquiries, generate an automatic response
    if (analysis.eventType === 'patient_inquiry') {
      await emailAIService.generateAIEmailResponse({
        ...emailData,
        date: new Date(emailData.date)
      }, analysis);
    }
    
    res.json({ 
      success: true, 
      message: 'Incoming email processed successfully',
      analysis: {
        eventType: analysis.eventType,
        summary: analysis.summary,
        confidence: analysis.confidence
      }
    });
  } catch (error) {
    console.error('Error processing incoming email:', error);
    res.status(400).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Invalid incoming email data'
    });
  }
});

// Get email templates endpoint
router.get('/email/templates', requireAuth, requireRole(['admin', 'doctor', 'staff']), async (req: Request, res: Response) => {
  try {
    // In production, this would fetch templates from the database
    // For now, we'll return placeholder templates from the service
    const templates = await emailAIService.initialize().then(() => {
      return [
        {
          id: 'appointment-reminder',
          name: 'Appointment Reminder',
          subject: 'Reminder: Your upcoming dental appointment',
          category: 'appointment'
        },
        {
          id: 'lab-case-update',
          name: 'Lab Case Update',
          subject: 'Update on your dental lab case',
          category: 'lab_update'
        }
      ];
    });
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch email templates'
    });
  }
});

// Create or update email template endpoint
router.post('/email/templates', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const template = emailTemplateSchema.parse(req.body);
    
    // In production, this would create or update a template in the database
    res.json({ 
      success: true, 
      message: 'Email template saved successfully',
      template: {
        ...template,
        id: template.id || 'new-template-id'
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Invalid email template data'
    });
  }
});

// Get email providers endpoint
router.get('/email/providers', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    // In production, this would fetch providers from the database
    const providers = [
      {
        id: 'default',
        type: 'gmail',
        email: process.env.EMAIL_ADDRESS || 'notifications@dentamind.com',
        name: 'DentaMind Notifications',
        description: 'Main notification email for DentaMind system'
      }
    ];
    
    res.json(providers);
  } catch (error) {
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch email providers'
    });
  }
});

// Configure email provider endpoint
router.post('/email/providers', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const provider = emailProviderSchema.parse(req.body);
    
    // In production, this would create or update a provider in the database
    res.json({ 
      success: true, 
      message: 'Email provider configured successfully',
      provider: {
        ...provider,
        id: 'provider-id'
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Invalid email provider data'
    });
  }
});

export default router;