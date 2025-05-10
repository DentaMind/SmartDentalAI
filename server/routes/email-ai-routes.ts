import express from 'express';
import { z } from 'zod';
import { EmailAIService } from '../services/email-ai-service';

// Initialize the EmailAIService
const emailService = new EmailAIService();

// Define validation schemas
const emailProviderSchema = z.object({
  name: z.string(),
  host: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string().optional(),
  useSSL: z.boolean(),
  isDefault: z.boolean()
});

const emailTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  type: z.string(),
  aiGenerated: z.boolean()
});

const emailSettingsSchema = z.object({
  monitoring: z.object({
    enabled: z.boolean(),
    checkInterval: z.number(),
    folders: z.array(z.string()),
    processAttachments: z.boolean()
  }),
  autoResponder: z.object({
    enabled: z.boolean()
  }),
  aiEnabled: z.boolean()
});

const testEmailSchema = z.object({
  email: z.string().email()
});

export function setupEmailAIRoutes(router: express.Router) {
  // Make sure the service is initialized
  router.use('/email-ai/*', async (req, res, next) => {
    if (!emailService.isInitialized) {
      try {
        await emailService.initialize();
      } catch (error) {
        console.error('Failed to initialize EmailAIService:', error);
        // Continue anyway, allowing routes to determine if initialization is required
      }
    }
    next();
  });

  // Get email providers
  router.get('/email-ai/providers', async (req, res) => {
    try {
      const providers = await emailService.getEmailProviders();
      res.json(providers);
    } catch (error) {
      console.error('Error fetching email providers:', error);
      res.status(500).json({ error: 'Failed to fetch email providers' });
    }
  });

  // Get a specific email provider
  router.get('/email-ai/providers/:id', async (req, res) => {
    try {
      const provider = await emailService.getEmailProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: 'Email provider not found' });
      }
      res.json(provider);
    } catch (error) {
      console.error('Error fetching email provider:', error);
      res.status(500).json({ error: 'Failed to fetch email provider' });
    }
  });

  // Create a new email provider
  router.post('/email-ai/providers', async (req, res) => {
    try {
      const validation = emailProviderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid provider data', details: validation.error.errors });
      }

      const newProvider = await emailService.createEmailProvider(validation.data);
      res.status(201).json(newProvider);
    } catch (error) {
      console.error('Error creating email provider:', error);
      res.status(500).json({ error: 'Failed to create email provider' });
    }
  });

  // Update an email provider
  router.put('/email-ai/providers/:id', async (req, res) => {
    try {
      const validation = emailProviderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid provider data', details: validation.error.errors });
      }

      const updatedProvider = await emailService.updateEmailProvider(req.params.id, validation.data);
      if (!updatedProvider) {
        return res.status(404).json({ error: 'Email provider not found' });
      }
      res.json(updatedProvider);
    } catch (error) {
      console.error('Error updating email provider:', error);
      res.status(500).json({ error: 'Failed to update email provider' });
    }
  });

  // Delete an email provider
  router.delete('/email-ai/providers/:id', async (req, res) => {
    try {
      const success = await emailService.deleteEmailProvider(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Email provider not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email provider:', error);
      res.status(500).json({ error: 'Failed to delete email provider' });
    }
  });

  // Test email provider connection
  router.post('/email-ai/providers/:id/test', async (req, res) => {
    try {
      const result = await emailService.testConnection(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Error testing email provider connection:', error);
      res.status(500).json({ error: 'Failed to test email provider connection', message: error.message });
    }
  });

  // Get email templates
  router.get('/email-ai/templates', async (req, res) => {
    try {
      const templates = await emailService.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  });

  // Get a specific email template
  router.get('/email-ai/templates/:id', async (req, res) => {
    try {
      const template = await emailService.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Email template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({ error: 'Failed to fetch email template' });
    }
  });

  // Create a new email template
  router.post('/email-ai/templates', async (req, res) => {
    try {
      const validation = emailTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid template data', details: validation.error.errors });
      }

      const newTemplate = await emailService.createEmailTemplate(validation.data);
      res.status(201).json(newTemplate);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ error: 'Failed to create email template' });
    }
  });

  // Update an email template
  router.put('/email-ai/templates/:id', async (req, res) => {
    try {
      const validation = emailTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid template data', details: validation.error.errors });
      }

      const updatedTemplate = await emailService.updateEmailTemplate(req.params.id, validation.data);
      if (!updatedTemplate) {
        return res.status(404).json({ error: 'Email template not found' });
      }
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ error: 'Failed to update email template' });
    }
  });

  // Delete an email template
  router.delete('/email-ai/templates/:id', async (req, res) => {
    try {
      const success = await emailService.deleteEmailTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Email template not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  });

  // Get email monitoring status
  router.get('/email-ai/status', async (req, res) => {
    try {
      const status = await emailService.getMonitorStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching email monitor status:', error);
      res.status(500).json({ error: 'Failed to fetch email monitor status' });
    }
  });

  // Update email monitoring settings
  router.post('/email-ai/settings', async (req, res) => {
    try {
      const validation = emailSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid settings data', details: validation.error.errors });
      }

      const updatedSettings = await emailService.updateSettings(validation.data);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating email settings:', error);
      res.status(500).json({ error: 'Failed to update email settings' });
    }
  });

  // Send a test email
  router.post('/email-ai/test-email', async (req, res) => {
    try {
      const validation = testEmailSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid email address', details: validation.error.errors });
      }

      const result = await emailService.sendTestEmail(validation.data.email);
      res.json(result);
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ error: 'Failed to send test email', message: error.message });
    }
  });

  // Start manual email checking
  router.post('/email-ai/check-now', async (req, res) => {
    try {
      const result = await emailService.checkEmailsNow();
      res.json(result);
    } catch (error) {
      console.error('Error checking emails:', error);
      res.status(500).json({ error: 'Failed to check emails', message: error.message });
    }
  });

  // Get recent email activity logs
  router.get('/email-ai/logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await emailService.getRecentActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({ error: 'Failed to fetch email logs' });
    }
  });

  // Generate an AI response for a given email
  router.post('/email-ai/generate-response', async (req, res) => {
    try {
      const { emailContent, context } = req.body;
      if (!emailContent) {
        return res.status(400).json({ error: 'Email content is required' });
      }

      const generatedResponse = await emailService.generateAIResponse(emailContent, context);
      res.json(generatedResponse);
    } catch (error) {
      console.error('Error generating AI response:', error);
      res.status(500).json({ error: 'Failed to generate AI response', message: error.message });
    }
  });

  // Analyze email content with AI
  router.post('/email-ai/analyze', async (req, res) => {
    try {
      const { emailContent } = req.body;
      if (!emailContent) {
        return res.status(400).json({ error: 'Email content is required' });
      }

      const analysis = await emailService.analyzeEmailContent(emailContent);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing email:', error);
      res.status(500).json({ error: 'Failed to analyze email', message: error.message });
    }
  });

  return router;
}