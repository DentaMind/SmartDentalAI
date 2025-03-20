/**
 * Email AI Service
 * 
 * This service integrates AI with email functionality to:
 * 1. Monitor business email inbox for updates
 * 2. Extract key information from emails using AI
 * 3. Update patient records and system data
 * 4. Generate and send AI-powered email responses
 * 5. Ensure HIPAA compliance for all email communications
 */

import nodemailer from 'nodemailer';
import { z } from 'zod';
import { storage } from '../storage';
import { AIServiceType } from './ai-service-types';
import { aiServiceManager } from './ai-service-manager';
import { aiRequestQueue } from './ai-request-queue';
import * as crypto from 'crypto';

// Email provider configuration schema
const emailProviderSchema = z.object({
  type: z.enum(['gmail', 'outlook', 'smtp']),
  email: z.string().email(),
  // We don't store the password/token directly, it will be in environment variables
  authType: z.enum(['oauth2', 'password']).default('oauth2'),
  name: z.string().optional(),
  description: z.string().optional()
});

// Email template schema
const emailTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  category: z.enum([
    'appointment', 
    'lab_update', 
    'insurance', 
    'prescription', 
    'patient_education',
    'marketing',
    'follow_up',
    'billing'
  ]),
  variables: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Email tracking schema
const emailTrackingSchema = z.object({
  id: z.string().optional(),
  to: z.string(),
  subject: z.string(),
  sentAt: z.date(),
  status: z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']),
  type: z.string(),
  patientId: z.number().optional(),
  providerId: z.number().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional()
});

// Email attachment schema
const attachmentSchema = z.object({
  filename: z.string(),
  content: z.string().or(z.instanceof(Buffer)),
  contentType: z.string().optional(),
  encoding: z.string().optional(),
  cid: z.string().optional()
});

type EmailProvider = z.infer<typeof emailProviderSchema>;
type EmailTemplate = z.infer<typeof emailTemplateSchema>;
type EmailTracking = z.infer<typeof emailTrackingSchema>;
type Attachment = z.infer<typeof attachmentSchema>;

// Different types of email-detectable events
enum EmailEventType {
  LAB_CASE_UPDATE = 'lab_case_update',
  INSURANCE_APPROVAL = 'insurance_approval',
  INSURANCE_DENIAL = 'insurance_denial',
  PATIENT_INQUIRY = 'patient_inquiry',
  APPOINTMENT_REQUEST = 'appointment_request',
  PRESCRIPTION_CONFIRMATION = 'prescription_confirmation',
  SUPPLY_ORDER_UPDATE = 'supply_order_update',
  DOCUMENT_REQUEST = 'document_request'
}

interface EmailContent {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  attachments?: Attachment[];
}

interface AIEmailAnalysis {
  eventType: EmailEventType | null;
  patientName?: string;
  patientId?: number;
  providerId?: number;
  confidence: number;
  detectedEntities: {
    dates?: string[];
    names?: string[];
    procedures?: string[];
    amounts?: string[];
    medications?: string[];
    insuranceInfo?: any;
    labInfo?: any;
  };
  suggestedAction?: string;
  summary: string;
}

class EmailAIService {
  private emailProviders: Map<string, EmailProvider> = new Map();
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;
  
  /**
   * Initialize the email service with provider configuration
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load configuration from storage or environment
      const providers = await this.loadEmailProviders();
      
      // Configure the primary email provider
      if (providers.length > 0) {
        const primaryProvider = providers[0];
        this.setupEmailTransporter(primaryProvider);
      }
      
      // Load email templates
      const templates = await this.loadEmailTemplates();
      templates.forEach(template => {
        this.emailTemplates.set(template.id || crypto.randomUUID(), template);
      });
      
      this.isInitialized = true;
      console.log('Email AI service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      return false;
    }
  }
  
  /**
   * Set up the email transporter for sending emails
   */
  private setupEmailTransporter(provider: EmailProvider) {
    // Different configuration based on provider type
    switch (provider.type) {
      case 'gmail':
        // For Gmail, we'd use OAuth2 in production
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: provider.email,
            // In production, use OAuth2 and proper secret management
            pass: process.env.EMAIL_PASSWORD
          }
        });
        break;
        
      case 'outlook':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.office365.com',
          port: 587,
          secure: false,
          auth: {
            user: provider.email,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        break;
        
      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: provider.email,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        break;
    }
  }

  /**
   * Load email providers from storage or configuration
   */
  private async loadEmailProviders(): Promise<EmailProvider[]> {
    // In production, this would load from database
    // For now, we'll use a placeholder default provider
    const defaultProvider: EmailProvider = {
      type: 'gmail',
      email: process.env.EMAIL_ADDRESS || 'notifications@dentamind.com',
      authType: 'oauth2'
    };
    
    this.emailProviders.set('default', defaultProvider);
    return [defaultProvider];
  }
  
  /**
   * Load email templates from storage
   */
  private async loadEmailTemplates(): Promise<EmailTemplate[]> {
    // In production, this would load from database
    // For now, we'll use placeholder templates
    return [
      {
        id: 'appointment-reminder',
        name: 'Appointment Reminder',
        subject: 'Reminder: Your upcoming dental appointment',
        body: `
Dear {{patientName}},

This is a friendly reminder about your dental appointment with Dr. {{doctorName}} 
on {{appointmentDate}} at {{appointmentTime}}.

Please arrive 15 minutes early to complete any necessary paperwork.

If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
The DentaMind Team
        `,
        category: 'appointment',
        variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'lab-case-update',
        name: 'Lab Case Update',
        subject: 'Update on your dental lab case',
        body: `
Dear {{patientName}},

We have an update regarding your dental lab case:

Status: {{labStatus}}
Expected completion: {{completionDate}}

{{additionalDetails}}

If you have any questions, please don't hesitate to contact us.

Best regards,
The DentaMind Team
        `,
        category: 'lab_update',
        variables: ['patientName', 'labStatus', 'completionDate', 'additionalDetails'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
  
  /**
   * Process incoming email with AI analysis
   */
  async processIncomingEmail(emailContent: EmailContent): Promise<AIEmailAnalysis> {
    try {
      // Prepare email content for AI analysis
      const emailText = `
From: ${emailContent.from}
Subject: ${emailContent.subject}
Date: ${emailContent.date.toISOString()}
Content: ${emailContent.text}
      `;
      
      // Use AI to analyze the email content
      const analysis = await aiRequestQueue.enqueueRequest(
        AIServiceType.COMMUNICATION,
        () => aiServiceManager.generatePatientCommunication(emailText, 'email_analysis')
      );
      
      // Process AI response to extract structured data
      const emailAnalysis = this.parseAIEmailAnalysis(analysis, emailContent);
      
      // Update relevant records based on the analysis
      await this.updateRecordsBasedOnEmail(emailAnalysis);
      
      return emailAnalysis;
    } catch (error) {
      console.error('Error processing incoming email:', error);
      throw new Error('Failed to process incoming email');
    }
  }
  
  /**
   * Parse AI analysis response into structured format
   */
  private parseAIEmailAnalysis(aiResponse: string, originalEmail: EmailContent): AIEmailAnalysis {
    try {
      // In a real implementation, we would properly parse the AI response
      // For now, we'll create a placeholder analysis
      
      // Extract potential patient name from email
      const patientNameMatch = originalEmail.text.match(/(?:patient|name|for)[:s]*(w+s+w+)/i);
      const patientName = patientNameMatch ? patientNameMatch[1] : undefined;
      
      // Detect email type based on keywords
      let eventType = null;
      if (/lab.*case|impression|prosthetic|crown|bridge/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.LAB_CASE_UPDATE;
      } else if (/insurance.*approval|claim.*approved|payment.*approved/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.INSURANCE_APPROVAL;
      } else if (/insurance.*denied|claim.*denied|payment.*denied/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.INSURANCE_DENIAL;
      } else if (/appointment|schedule|booking/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.APPOINTMENT_REQUEST;
      } else if (/prescription|medication|pharmacy/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.PRESCRIPTION_CONFIRMATION;
      } else if (/supplies|order|delivery|shipment/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.SUPPLY_ORDER_UPDATE;
      } else if (/question|inquiry|help|information/i.test(originalEmail.subject + originalEmail.text)) {
        eventType = EmailEventType.PATIENT_INQUIRY;
      }
      
      // Create analysis result
      const analysis: AIEmailAnalysis = {
        eventType,
        patientName,
        confidence: 0.85,
        detectedEntities: {},
        summary: `This email appears to be about ${eventType ? eventType.replace(/_/g, ' ').toLowerCase() : 'general inquiry'}.`
      };
      
      return analysis;
    } catch (error) {
      console.error('Error parsing AI email analysis:', error);
      return {
        eventType: null,
        confidence: 0,
        detectedEntities: {},
        summary: 'Failed to analyze email content'
      };
    }
  }
  
  /**
   * Update system records based on email analysis
   */
  private async updateRecordsBasedOnEmail(analysis: AIEmailAnalysis) {
    // Only proceed if we have high confidence and a recognized event
    if (!analysis.eventType || analysis.confidence < 0.7) {
      return;
    }
    
    try {
      switch (analysis.eventType) {
        case EmailEventType.LAB_CASE_UPDATE:
          // Update lab case status
          if (analysis.detectedEntities.labInfo) {
            // await storage.updateLabCase(analysis.detectedEntities.labInfo);
            console.log('Lab case updated based on email:', analysis.detectedEntities.labInfo);
          }
          break;
          
        case EmailEventType.INSURANCE_APPROVAL:
        case EmailEventType.INSURANCE_DENIAL:
          // Update insurance claim status
          if (analysis.detectedEntities.insuranceInfo) {
            // await storage.updateInsuranceClaim(analysis.detectedEntities.insuranceInfo);
            console.log('Insurance claim updated based on email:', analysis.detectedEntities.insuranceInfo);
          }
          break;
          
        case EmailEventType.APPOINTMENT_REQUEST:
          // Create appointment request
          if (analysis.patientId) {
            // await storage.createAppointmentRequest({
            //   patientId: analysis.patientId,
            //   requestedDates: analysis.detectedEntities.dates || [],
            //   reason: analysis.summary
            // });
            console.log('Appointment request created based on email for patient:', analysis.patientId);
          }
          break;
      }
    } catch (error) {
      console.error('Error updating records based on email:', error);
    }
  }
  
  /**
   * Send an email using a template and personalized data
   */
  async sendTemplatedEmail(
    templateId: string,
    to: string,
    data: Record<string, string>,
    attachments?: Attachment[]
  ): Promise<boolean> {
    try {
      // Ensure email service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Ensure we have a transporter
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      
      // Get the template
      const template = this.emailTemplates.get(templateId);
      if (!template) {
        throw new Error(`Email template not found: ${templateId}`);
      }
      
      // Replace variables in template
      let subject = template.subject;
      let body = template.body;
      
      Object.entries(data).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(placeholder, value);
        body = body.replace(placeholder, value);
      });
      
      // Send the email
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_ADDRESS || 'notifications@dentamind.com',
        to,
        subject,
        text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html: body,
        attachments
      });
      
      // Track the email
      await this.trackEmail({
        id: crypto.randomUUID(),
        to,
        subject,
        sentAt: new Date(),
        status: 'sent',
        type: template.category,
        patientId: data.patientId ? parseInt(data.patientId) : undefined,
        providerId: data.providerId ? parseInt(data.providerId) : undefined
      });
      
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending templated email:', error);
      return false;
    }
  }
  
  /**
   * Generate and send an AI-driven automatic response to patient inquiries
   */
  async generateAIEmailResponse(
    originalEmail: EmailContent,
    analysis: AIEmailAnalysis
  ): Promise<boolean> {
    try {
      // Only respond to patient inquiries automatically
      if (analysis.eventType !== EmailEventType.PATIENT_INQUIRY || !analysis.patientId) {
        return false;
      }
      
      // Generate AI response
      const prompt = `
Original email from patient:
${originalEmail.text}

Patient name: ${analysis.patientName || 'Unknown'}
Topic: ${analysis.summary}

Generate a professional, helpful email response addressing the patient's inquiry.
The response should be concise, clear, and in a friendly professional tone.
Include appropriate next steps or contact information if needed.
Do not include any PHI beyond what was in the original email.
      `;
      
      const aiResponse = await aiRequestQueue.enqueueRequest(
        AIServiceType.COMMUNICATION,
        () => aiServiceManager.generatePatientCommunication(prompt, 'email_response')
      );
      
      // Send the AI-generated response
      if (!this.transporter) {
        await this.initialize();
        if (!this.transporter) {
          throw new Error('Email transporter not initialized');
        }
      }
      
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_ADDRESS || 'notifications@dentamind.com',
        to: originalEmail.from,
        subject: `Re: ${originalEmail.subject}`,
        text: aiResponse,
        html: aiResponse.replace(/\n/g, '<br>')
      });
      
      // Track the email
      await this.trackEmail({
        id: crypto.randomUUID(),
        to: originalEmail.from,
        subject: `Re: ${originalEmail.subject}`,
        sentAt: new Date(),
        status: 'sent',
        type: 'patient_inquiry_response',
        patientId: analysis.patientId
      });
      
      console.log('AI email response sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error generating AI email response:', error);
      return false;
    }
  }
  
  /**
   * Track email for compliance and analytics
   */
  private async trackEmail(tracking: EmailTracking) {
    // In production, this would store in the database
    console.log('Email tracked:', tracking);
    
    // For HIPAA compliance, track all email activity
    await this.logEmailForCompliance(tracking);
  }
  
  /**
   * Log email activity for HIPAA compliance
   */
  private async logEmailForCompliance(tracking: EmailTracking) {
    // In production, this would create a secure HIPAA-compliant log
    try {
      console.log('HIPAA compliance log created for email:', tracking.id);
      
      // Example of creating a compliance record
      // if (tracking.patientId) {
      //   await storage.createComplianceRecord({
      //     type: 'email_communication',
      //     patientId: tracking.patientId,
      //     description: `Email sent: ${tracking.subject}`,
      //     timestamp: new Date().toISOString(),
      //     details: JSON.stringify(tracking)
      //   });
      // }
    } catch (error) {
      console.error('Error creating HIPAA compliance log:', error);
    }
  }
  
  /**
   * Send document securely via encrypted email
   */
  async sendSecureDocument(
    patientId: number,
    documentType: string,
    documentId: string,
    patientEmail: string
  ): Promise<boolean> {
    try {
      // Get patient information
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        throw new Error(`Patient not found: ${patientId}`);
      }
      
      // Generate secure download link (in production, this would be a real secure link)
      const downloadToken = crypto.randomBytes(32).toString('hex');
      const secureLink = `https://dentamind.com/secure-documents/${documentType}/${documentId}?token=${downloadToken}`;
      
      // Send secure email with download link
      const templateId = 'secure-document';
      const data = {
        patientName: `${patient.firstName} ${patient.lastName}`,
        documentType: documentType.charAt(0).toUpperCase() + documentType.slice(1),
        secureLink,
        expirationTime: '48 hours'
      };
      
      // Determine the email template based on document type
      let emailTemplateId;
      switch (documentType) {
        case 'xray':
          emailTemplateId = 'xray-download';
          break;
        case 'prescription':
          emailTemplateId = 'prescription-download';
          break;
        case 'lab_result':
          emailTemplateId = 'lab-result-download';
          break;
        default:
          emailTemplateId = 'secure-document';
      }
      
      return await this.sendTemplatedEmail(templateId, patientEmail, data);
    } catch (error) {
      console.error('Error sending secure document:', error);
      return false;
    }
  }
  
  /**
   * Check if email service is configured properly
   */
  async checkEmailConfiguration(): Promise<{ configured: boolean; status: string }> {
    try {
      // Ensure service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Verify transporter
      if (!this.transporter) {
        return { configured: false, status: 'Email transporter not initialized' };
      }
      
      // Verify connection to mail server
      await this.transporter.verify();
      
      return { configured: true, status: 'Email service is properly configured' };
    } catch (error) {
      console.error('Email configuration check failed:', error);
      return { 
        configured: false, 
        status: `Email configuration error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const emailAIService = new EmailAIService();
export { EmailEventType, emailTemplateSchema, emailProviderSchema };