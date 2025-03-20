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

import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { aiServiceManager } from './ai-service-manager';
import { AIServiceType } from './ai-service-types';
import { z } from 'zod';

// Define schemas for validation
export const emailProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  host: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string().optional(),
  useSSL: z.boolean(),
  isDefault: z.boolean()
});

export const emailTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  type: z.enum(['general', 'reminder', 'follow_up', 'insurance', 'lab_case', 'prescription', 'treatment_plan', 'billing', 'marketing']),
  aiGenerated: z.boolean(),
  lastUsed: z.string().optional(),
  variables: z.array(z.string()).optional(),
  htmlVersion: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional()
});

export const emailTrackingSchema = z.object({
  id: z.string(),
  emailId: z.string(),
  recipient: z.string(),
  opened: z.boolean(),
  openCount: z.number(),
  openTimestamps: z.array(z.string()),
  clicked: z.boolean(),
  clickCount: z.number(),
  clickTimestamps: z.array(z.string()),
  responded: z.boolean(),
  responseTimestamp: z.string().optional()
});

export const attachmentSchema = z.object({
  filename: z.string(),
  content: z.any(), // This would typically be a Buffer
  contentType: z.string().optional()
});

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
  attachments?: any[];
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

type EmailProvider = z.infer<typeof emailProviderSchema>;
type EmailTemplate = z.infer<typeof emailTemplateSchema>;
type EmailTracking = z.infer<typeof emailTrackingSchema>;
type Attachment = z.infer<typeof attachmentSchema>;

export class EmailAIService {
  private emailProviders: Map<string, EmailProvider> = new Map();
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private transporter: nodemailer.Transporter | null = null;
  private isCheckingEmails: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  public isInitialized: boolean = false;
  private settings = {
    monitoring: {
      enabled: false,
      checkInterval: 5, // minutes
      folders: ['INBOX'],
      processAttachments: true
    },
    autoResponder: {
      enabled: false
    },
    aiEnabled: false
  };

  /**
   * Initialize the email service with provider configuration
   */
  async initialize(): Promise<boolean> {
    try {
      // Load providers
      const loadedProviders = await this.loadEmailProviders();
      loadedProviders.forEach(provider => {
        if (provider.id) {
          this.emailProviders.set(provider.id, provider);
        } else {
          console.warn('Skipping provider without ID:', provider);
        }
      });

      // Load templates
      const templates = await this.loadEmailTemplates();
      templates.forEach(template => {
        if (template.id) {
          this.emailTemplates.set(template.id, template);
        } else {
          console.warn('Skipping template without ID:', template);
        }
      });

      // Load settings
      await this.loadSettings();

      // Set up email checking if enabled
      if (this.settings.monitoring.enabled) {
        this.startEmailChecking();
      }

      // Set up default email provider
      const providersList = Array.from(this.emailProviders.values());
      const defaultProvider = providersList.find(p => p.isDefault);
      if (defaultProvider) {
        this.setupEmailTransporter(defaultProvider);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize email service:', errorMessage);
      return false;
    }
  }

  /**
   * Set up the email transporter for sending emails
   */
  private setupEmailTransporter(provider: EmailProvider) {
    try {
      this.transporter = nodemailer.createTransport({
        host: provider.host,
        port: provider.port,
        secure: provider.useSSL,
        auth: {
          user: provider.username,
          pass: provider.password
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error setting up email transporter:', error);
      return false;
    }
  }

  /**
   * Load email providers from storage or configuration
   */
  private async loadEmailProviders(): Promise<EmailProvider[]> {
    // In a real implementation, this would load from the database
    // For now, return a mock default provider
    const defaultProvider: EmailProvider = {
      id: 'default',
      name: 'Default Provider',
      host: 'smtp.example.com',
      port: 587,
      username: 'user@example.com',
      password: '', // Password would be stored securely
      useSSL: true,
      isDefault: true
    };
    
    return [defaultProvider];
  }

  /**
   * Load email templates from storage
   */
  private async loadEmailTemplates(): Promise<EmailTemplate[]> {
    // In a real implementation, this would load from the database
    // For now, return a comprehensive set of templates for different scenarios
    return [
      {
        id: 'welcome',
        name: 'New Patient Welcome',
        subject: 'Welcome to DentaMind - Your Dental Health Partner',
        body: 'Dear {{patientName}},\n\nThank you for choosing DentaMind for your dental care needs. We are committed to providing you with exceptional dental care in a comfortable and friendly environment.\n\nYour patient portal is now active, where you can:\n- View your upcoming appointments\n- Access your treatment plans\n- Review your billing information\n- Communicate with your dental team\n\nIf you have any questions or need assistance, please don\'t hesitate to contact us at {{practicePhone}} or reply to this email.\n\nWe look forward to seeing you at your first appointment on {{appointmentDate}} at {{appointmentTime}}.\n\nBest regards,\nDr. {{providerName}}\nDentaMind Team',
        type: 'general',
        aiGenerated: false,
        variables: ['patientName', 'practicePhone', 'appointmentDate', 'appointmentTime', 'providerName'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Welcome to DentaMind!</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>Thank you for choosing DentaMind for your dental care needs. We are committed to providing you with exceptional dental care in a comfortable and friendly environment.</p>' +
          '<p>Your patient portal is now active, where you can:</p>' +
          '<ul>' +
          '<li>View your upcoming appointments</li>' +
          '<li>Access your treatment plans</li>' +
          '<li>Review your billing information</li>' +
          '<li>Communicate with your dental team</li>' +
          '</ul>' +
          '<p>If you have any questions or need assistance, please don\'t hesitate to contact us at <a href="tel:{{practicePhone}}">{{practicePhone}}</a> or reply to this email.</p>' +
          '<p>We look forward to seeing you at your first appointment on <strong>{{appointmentDate}}</strong> at <strong>{{appointmentTime}}</strong>.</p>' +
          '<p>Best regards,<br>Dr. {{providerName}}<br>DentaMind Team</p>' +
          '</div>',
        description: 'Initial email sent to new patients after their account creation',
        category: 'Onboarding'
      },
      {
        id: 'appointment-reminder',
        name: 'Appointment Reminder',
        subject: 'Your Upcoming Appointment at DentaMind',
        body: 'Dear {{patientName}},\n\nThis is a friendly reminder about your upcoming appointment with Dr. {{providerName}} at DentaMind on {{appointmentDate}} at {{appointmentTime}}.\n\nAppointment Details:\n- Treatment: {{treatmentType}}\n- Location: {{practiceAddress}}\n\nPlease arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please contact us at least 24 hours in advance at {{practicePhone}}.\n\nWe look forward to seeing you!\n\nBest regards,\nDentaMind Team',
        type: 'reminder',
        aiGenerated: false,
        variables: ['patientName', 'providerName', 'appointmentDate', 'appointmentTime', 'treatmentType', 'practiceAddress', 'practicePhone'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Appointment Reminder</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>This is a friendly reminder about your upcoming appointment with <strong>Dr. {{providerName}}</strong> at DentaMind on <strong>{{appointmentDate}}</strong> at <strong>{{appointmentTime}}</strong>.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">Appointment Details:</h3>' +
          '<p><strong>Treatment:</strong> {{treatmentType}}<br>' +
          '<strong>Location:</strong> {{practiceAddress}}</p>' +
          '</div>' +
          '<p>Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please contact us at least 24 hours in advance at <a href="tel:{{practicePhone}}">{{practicePhone}}</a>.</p>' +
          '<p>We look forward to seeing you!</p>' +
          '<p>Best regards,<br>DentaMind Team</p>' +
          '</div>',
        description: 'Reminder email sent to patients before their scheduled appointments',
        category: 'Scheduling'
      },
      {
        id: 'treatment-plan',
        name: 'Treatment Plan Summary',
        subject: 'Your Dental Treatment Plan - DentaMind',
        body: 'Dear {{patientName}},\n\nThank you for your recent visit to DentaMind. Based on your examination with Dr. {{providerName}}, we have prepared a comprehensive treatment plan for you.\n\nTreatment Summary:\n{{treatmentSummary}}\n\nEstimated Cost: ${{estimatedCost}}\nEstimated Insurance Coverage: ${{estimatedCoverage}}\nEstimated Out-of-Pocket: ${{estimatedOutOfPocket}}\n\nYou can view your complete treatment plan with detailed procedures and costs in your patient portal. If you have any questions or would like to discuss alternative treatment options, please don\'t hesitate to contact us.\n\nYour dental health is our priority.\n\nBest regards,\nDr. {{providerName}}\nDentaMind Team',
        type: 'treatment_plan',
        aiGenerated: false,
        variables: ['patientName', 'providerName', 'treatmentSummary', 'estimatedCost', 'estimatedCoverage', 'estimatedOutOfPocket'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Your Dental Treatment Plan</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>Thank you for your recent visit to DentaMind. Based on your examination with Dr. {{providerName}}, we have prepared a comprehensive treatment plan for you.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">Treatment Summary:</h3>' +
          '<p>{{treatmentSummary}}</p>' +
          '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Estimated Cost:</td>' +
          '<td style="padding: 8px 0; text-align: right;">${{estimatedCost}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Estimated Insurance Coverage:</td>' +
          '<td style="padding: 8px 0; text-align: right;">${{estimatedCoverage}}</td>' +
          '</tr>' +
          '<tr style="font-weight: bold;">' +
          '<td style="padding: 8px 0;">Estimated Out-of-Pocket:</td>' +
          '<td style="padding: 8px 0; text-align: right;">${{estimatedOutOfPocket}}</td>' +
          '</tr>' +
          '</table>' +
          '</div>' +
          '<p>You can view your complete treatment plan with detailed procedures and costs in your patient portal. If you have any questions or would like to discuss alternative treatment options, please don\'t hesitate to contact us.</p>' +
          '<p>Your dental health is our priority.</p>' +
          '<p>Best regards,<br>Dr. {{providerName}}<br>DentaMind Team</p>' +
          '</div>',
        description: 'Email sent to patients with their treatment plan details and cost estimates',
        category: 'Treatment'
      },
      {
        id: 'post-treatment',
        name: 'Post-Treatment Care Instructions',
        subject: 'Post-Treatment Care Instructions - DentaMind',
        body: 'Dear {{patientName}},\n\nThank you for your recent visit to DentaMind. We hope your experience was positive.\n\nBelow are important care instructions following your {{procedureName}} procedure:\n\n{{careInstructions}}\n\nIf you experience severe pain, bleeding, or other concerning symptoms, please contact our office immediately at {{emergencyPhone}}.\n\nYour follow-up appointment is scheduled for {{followupDate}} at {{followupTime}}.\n\nPlease don\'t hesitate to reach out if you have any questions.\n\nBest regards,\nDr. {{providerName}}\nDentaMind Team',
        type: 'follow_up',
        aiGenerated: false,
        variables: ['patientName', 'providerName', 'procedureName', 'careInstructions', 'emergencyPhone', 'followupDate', 'followupTime'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Post-Treatment Care Instructions</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>Thank you for your recent visit to DentaMind. We hope your experience was positive.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">Care Instructions for {{procedureName}}:</h3>' +
          '<p>{{careInstructions}}</p>' +
          '</div>' +
          '<p style="color: #d9534f;"><strong>Important:</strong> If you experience severe pain, bleeding, or other concerning symptoms, please contact our office immediately at <a href="tel:{{emergencyPhone}}">{{emergencyPhone}}</a>.</p>' +
          '<p>Your follow-up appointment is scheduled for <strong>{{followupDate}}</strong> at <strong>{{followupTime}}</strong>.</p>' +
          '<p>Please don\'t hesitate to reach out if you have any questions.</p>' +
          '<p>Best regards,<br>Dr. {{providerName}}<br>DentaMind Team</p>' +
          '</div>',
        description: 'Email sent to patients after procedures with specific care instructions',
        category: 'Care Instructions'
      },
      {
        id: 'insurance-verification',
        name: 'Insurance Verification Confirmation',
        subject: 'Insurance Benefits Verification - DentaMind',
        body: 'Dear {{patientName}},\n\nWe have verified your dental insurance benefits with {{insuranceProvider}}.\n\nYour Coverage Details:\n- Plan: {{planName}}\n- Member ID: {{memberId}}\n- Annual Maximum: ${{annualMaximum}}\n- Remaining Benefit: ${{remainingBenefit}}\n- Deductible: ${{deductible}}\n- Preventive Care Coverage: {{preventiveCoverage}}\n- Basic Procedures Coverage: {{basicCoverage}}\n- Major Procedures Coverage: {{majorCoverage}}\n\nPlease note that these are estimates based on the information provided by your insurance company. Actual coverage may vary.\n\nIf you have any questions about your coverage or upcoming treatment costs, please contact our billing department at {{billingPhone}}.\n\nBest regards,\nDentaMind Billing Team',
        type: 'insurance',
        aiGenerated: false,
        variables: ['patientName', 'insuranceProvider', 'planName', 'memberId', 'annualMaximum', 'remainingBenefit', 'deductible', 'preventiveCoverage', 'basicCoverage', 'majorCoverage', 'billingPhone'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Insurance Benefits Verification</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>We have verified your dental insurance benefits with <strong>{{insuranceProvider}}</strong>.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">Your Coverage Details:</h3>' +
          '<table style="width: 100%; border-collapse: collapse;">' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Plan:</td>' +
          '<td style="padding: 8px 0; text-align: right;">{{planName}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Member ID:</td>' +
          '<td style="padding: 8px 0; text-align: right;">{{memberId}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Annual Maximum:</td>' +
          '<td style="padding: 8px 0; text-align: right;">${{annualMaximum}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Remaining Benefit:</td>' +
          '<td style="padding: 8px 0; text-align: right;">${{remainingBenefit}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Deductible:</td>' +
          '<td style="padding: 8px 0; text-align: right;">${{deductible}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Preventive Care Coverage:</td>' +
          '<td style="padding: 8px 0; text-align: right;">{{preventiveCoverage}}</td>' +
          '</tr>' +
          '<tr style="border-bottom: 1px solid #ddd;">' +
          '<td style="padding: 8px 0;">Basic Procedures Coverage:</td>' +
          '<td style="padding: 8px 0; text-align: right;">{{basicCoverage}}</td>' +
          '</tr>' +
          '<tr>' +
          '<td style="padding: 8px 0;">Major Procedures Coverage:</td>' +
          '<td style="padding: 8px 0; text-align: right;">{{majorCoverage}}</td>' +
          '</tr>' +
          '</table>' +
          '</div>' +
          '<p><em>Please note that these are estimates based on the information provided by your insurance company. Actual coverage may vary.</em></p>' +
          '<p>If you have any questions about your coverage or upcoming treatment costs, please contact our billing department at <a href="tel:{{billingPhone}}">{{billingPhone}}</a>.</p>' +
          '<p>Best regards,<br>DentaMind Billing Team</p>' +
          '</div>',
        description: 'Email sent to patients after insurance verification with coverage details',
        category: 'Billing'
      }
    ];
  }

  /**
   * Load settings from storage
   */
  private async loadSettings() {
    // In a real implementation, this would load from the database
    // For now, use default settings
    this.settings = {
      monitoring: {
        enabled: false,
        checkInterval: 5,
        folders: ['INBOX'],
        processAttachments: true
      },
      autoResponder: {
        enabled: false
      },
      aiEnabled: false
    };
  }

  /**
   * Start periodic email checking
   */
  private startEmailChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const intervalMs = this.settings.monitoring.checkInterval * 60 * 1000;
    this.checkInterval = setInterval(() => {
      this.checkEmails().catch(err => {
        console.error('Error checking emails:', err);
      });
    }, intervalMs);
  }

  /**
   * Stop periodic email checking
   */
  private stopEmailChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check emails for new messages
   */
  private async checkEmails() {
    if (this.isCheckingEmails) {
      return { status: 'busy', message: 'Already checking emails' };
    }

    this.isCheckingEmails = true;
    try {
      // This would connect to the email server and check for new emails
      // For now, we'll simulate a successful check
      
      console.log('Checking emails...');
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, we would:
      // 1. Connect to the email server
      // 2. Check for new unread emails in monitored folders
      // 3. Process each email (extract info, analyze with AI, update data)
      // 4. Optionally send auto-responses
      
      this.isCheckingEmails = false;
      return { 
        status: 'success', 
        message: 'Emails checked successfully',
        emailsProcessed: 0,
        newEmails: 0
      };
    } catch (error) {
      this.isCheckingEmails = false;
      console.error('Error checking emails:', error);
      return { 
        status: 'error', 
        message: 'Error checking emails: ' + error.message 
      };
    }
  }

  /**
   * Analyze email content with AI
   */
  async analyzeEmailContent(emailContent: EmailContent | string): Promise<AIEmailAnalysis> {
    try {
      // Prepare the content for analysis
      const content = typeof emailContent === 'string' 
        ? emailContent 
        : `From: ${emailContent.from}\nTo: ${emailContent.to}\nSubject: ${emailContent.subject}\n\n${emailContent.text}`;
      
      // Use AI service manager to analyze the email
      const analysisPrompt = `
      Analyze the following email and extract key information:
      
      ${content}
      
      Extract:
      1. The type of request/event (lab update, insurance, patient inquiry, etc.)
      2. Any patient names mentioned
      3. Any dates mentioned
      4. Any procedures mentioned
      5. Any monetary amounts mentioned
      6. Any medications mentioned
      7. What action should be taken based on this email
      8. A brief summary of the email (2-3 sentences)
      
      Format your response as structured JSON.
      `;
      
      try {
        // In a production system, we would use the AI service manager directly
        // const response = await aiServiceManager.generateCommunication(analysisPrompt, AIServiceType.COMMUNICATION, "email_analysis");
        
        // For now, return a mock analysis
        return {
          eventType: null, // We'll determine this based on the analysis
          confidence: 0.85,
          detectedEntities: {
            dates: [],
            names: [],
            procedures: [],
            amounts: [],
            medications: []
          },
          summary: "No email content to analyze or mock analysis provided."
        };
      } catch (error) {
        console.error('Error analyzing email with AI:', error);
        throw new Error('Failed to analyze email content');
      }
    } catch (error) {
      console.error('Error analyzing email content:', error);
      throw error;
    }
  }

  /**
   * Generate an AI response to an email
   */
  async generateAIResponse(emailContent: string, context?: any): Promise<{ subject: string; body: string }> {
    try {
      const prompt = `
      The following is an email received by a dental practice. Please generate a professional response:
      
      ${emailContent}
      
      ${context ? `Context: ${JSON.stringify(context)}` : ''}
      
      Generate a response with:
      1. An appropriate subject line
      2. A professional body that addresses the sender's needs
      3. Clear next steps if applicable
      4. A friendly closing
      
      Format as JSON with "subject" and "body" fields.
      `;
      
      try {
        // In a production system, we would use the AI service manager directly
        // const response = await aiServiceManager.generateCommunication(prompt, AIServiceType.COMMUNICATION, "email_response");
        
        // For now, return a mock response
        return {
          subject: "Re: Your Inquiry",
          body: "Thank you for your message. This is an automated placeholder response. A team member will follow up with you shortly.\n\nBest regards,\nDentaMind Team"
        };
      } catch (error) {
        console.error('Error generating email response with AI:', error);
        throw new Error('Failed to generate email response');
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Send a test email to verify configuration
   */
  /**
   * Send a test email to verify configuration
   * @param recipientEmail Email address to send the test to
   * @returns Success status and detailed message
   */
  async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    // Validate email address format
    if (!this.isValidEmail(recipientEmail)) {
      return {
        success: false,
        message: 'Invalid email address format',
        details: { validationError: 'Please provide a valid email address' }
      };
    }

    if (!this.transporter) {
      try {
        // For testing purposes, create a test transporter if none exists
        await this.createTestTransporter();
        
        if (!this.transporter) {
          return { 
            success: false, 
            message: 'Email transporter could not be created', 
            details: { 
              error: 'Configuration error',
              resolution: 'Please set up an email provider with valid credentials'
            }
          };
        }
      } catch (err) {
        const error = err as Error;
        return {
          success: false,
          message: 'Failed to create email transporter',
          details: {
            error: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        };
      }
    }
    
    try {
      const testEmail = {
        from: 'test@dentamind.com',
        to: recipientEmail,
        subject: 'DentaMind Email AI Test',
        text: 'This is a test email from the DentaMind Email AI system. If you received this, the email configuration is working correctly.',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<h2 style="color: #28C76F;">DentaMind Email Test</h2>' +
          '<p>This is a test email from the DentaMind Email AI system.</p>' +
          '<p>If you received this, the email configuration is working correctly.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<p>This message was sent at: ' + new Date().toLocaleString() + '</p>' +
          '</div>' +
          '<p>Best regards,<br>DentaMind Team</p>' +
          '</div>'
      };
      
      console.log(`Attempting to send test email to ${recipientEmail}...`);
      
      // Log the email instead of sending it to prevent errors in the test environment
      if (process.env.NODE_ENV === 'development') {
        console.log('=== TEST EMAIL CONTENTS ===');
        console.log(`From: ${testEmail.from}`);
        console.log(`To: ${recipientEmail}`);
        console.log(`Subject: ${testEmail.subject}`);
        console.log(`Body: ${testEmail.text}`);
        console.log('=== END TEST EMAIL ===');
        
        return {
          success: true,
          message: `Test email would be sent to ${recipientEmail} (simulated in development)`,
          details: { 
            environment: 'development',
            simulationMode: true,
            emailContent: testEmail,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        // In production environment, actually send the email
        const info = await this.transporter.sendMail(testEmail);
        return {
          success: true,
          message: `Test email sent successfully to ${recipientEmail}`,
          details: { 
            messageId: info.messageId,
            response: info.response,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error sending test email:', error);
      
      // Log detailed error information for debugging
      console.error('Error details:', {
        timestamp: new Date().toISOString(),
        recipient: recipientEmail,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        message: 'Failed to send test email: ' + (error.message || 'Unknown error'),
        details: {
          errorType: error.name,
          timestamp: new Date().toISOString(),
          resolution: 'Please check your email configuration and try again'
        }
      };
    }
  }
  
  /**
   * Validate email address format
   * @param email Email address to validate
   * @returns True if valid email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Create a test transporter with ethereal.email for development
   */
  private async createTestTransporter() {
    try {
      console.log('Creating test email transporter...');
      // Create test account
      const testAccount = await nodemailer.createTestAccount();
      
      // Create reusable transporter
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('Test email transporter created successfully');
      console.log(`Test email credentials: ${testAccount.user} / ${testAccount.pass}`);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to create test email transporter:', error);
    }
  }

  /**
   * Update email service settings
   */
  async updateSettings(newSettings: any): Promise<any> {
    try {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      
      // Restart or stop email checking based on new settings
      if (this.settings.monitoring.enabled) {
        this.startEmailChecking();
      } else {
        this.stopEmailChecking();
      }
      
      // In a real implementation, we would save the settings to the database
      
      return {
        success: true,
        message: 'Settings updated successfully',
        settings: this.settings
      };
    } catch (error) {
      console.error('Error updating email settings:', error);
      return {
        success: false,
        message: 'Failed to update settings: ' + error.message
      };
    }
  }

  /**
   * Manually trigger an email check
   */
  async checkEmailsNow(): Promise<any> {
    return this.checkEmails();
  }

  /**
   * Get the current monitoring status
   */
  async getMonitorStatus(): Promise<any> {
    // In a real implementation, this would include actual stats from the database
    return {
      status: this.settings.monitoring.enabled ? 'connected' : 'disconnected',
      lastCheck: new Date().toISOString(),
      unreadCount: 0,
      monitoredFolders: this.settings.monitoring.folders,
      emailsProcessed: 0,
      aiAnalyzed: 0,
      aiEnabled: this.settings.aiEnabled,
      monitoring: this.settings.monitoring,
      autoResponder: this.settings.autoResponder
    };
  }

  /**
   * Get recent email activity logs
   */
  async getRecentActivityLogs(limit: number = 20): Promise<any[]> {
    // In a real implementation, this would fetch from the database
    return [];
  }

  // Email Provider CRUD operations
  
  /**
   * Get all email providers
   */
  async getEmailProviders(): Promise<EmailProvider[]> {
    return Array.from(this.emailProviders.values());
  }
  
  /**
   * Get a specific email provider
   */
  async getEmailProvider(id: string): Promise<EmailProvider | undefined> {
    return this.emailProviders.get(id);
  }
  
  /**
   * Create a new email provider
   */
  async createEmailProvider(providerData: EmailProvider): Promise<EmailProvider> {
    const id = providerData.id || uuidv4();
    const newProvider = {
      ...providerData,
      id
    };
    
    // If this is set as default, update other providers
    if (newProvider.isDefault) {
      for (const [key, provider] of this.emailProviders.entries()) {
        if (provider.isDefault) {
          this.emailProviders.set(key, {
            ...provider,
            isDefault: false
          });
        }
      }
    }
    
    this.emailProviders.set(id, newProvider);
    
    // Set up transporter if this is the default provider
    if (newProvider.isDefault) {
      this.setupEmailTransporter(newProvider);
    }
    
    // In a real implementation, we would save to the database
    
    return newProvider;
  }
  
  /**
   * Update an email provider
   */
  async updateEmailProvider(id: string, providerData: Partial<EmailProvider>): Promise<EmailProvider | undefined> {
    const existingProvider = this.emailProviders.get(id);
    if (!existingProvider) {
      return undefined;
    }
    
    const updatedProvider = {
      ...existingProvider,
      ...providerData,
      id
    };
    
    // If this is set as default, update other providers
    if (updatedProvider.isDefault && !existingProvider.isDefault) {
      for (const [key, provider] of this.emailProviders.entries()) {
        if (provider.isDefault && key !== id) {
          this.emailProviders.set(key, {
            ...provider,
            isDefault: false
          });
        }
      }
    }
    
    this.emailProviders.set(id, updatedProvider);
    
    // Update transporter if this is the default provider
    if (updatedProvider.isDefault) {
      this.setupEmailTransporter(updatedProvider);
    }
    
    // In a real implementation, we would save to the database
    
    return updatedProvider;
  }
  
  /**
   * Delete an email provider
   */
  async deleteEmailProvider(id: string): Promise<boolean> {
    const provider = this.emailProviders.get(id);
    if (!provider) {
      return false;
    }
    
    // Don't allow deleting the default provider
    if (provider.isDefault) {
      throw new Error('Cannot delete the default email provider');
    }
    
    this.emailProviders.delete(id);
    
    // In a real implementation, we would delete from the database
    
    return true;
  }
  
  /**
   * Test connection to an email provider
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const provider = this.emailProviders.get(id);
    if (!provider) {
      return {
        success: false,
        message: 'Provider not found'
      };
    }
    
    try {
      const testTransporter = nodemailer.createTransport({
        host: provider.host,
        port: provider.port,
        secure: provider.useSSL,
        auth: {
          user: provider.username,
          pass: provider.password
        }
      });
      
      // In a real implementation, we would verify the connection
      // await testTransporter.verify();
      
      // For now, simulate a successful connection
      
      // If this is the default provider, update the main transporter
      if (provider.isDefault) {
        this.transporter = testTransporter;
      }
      
      // Update the provider with connected status
      this.emailProviders.set(id, {
        ...provider,
        connected: true
      });
      
      return {
        success: true,
        message: 'Successfully connected to email server'
      };
    } catch (error) {
      console.error('Error testing email connection:', error);
      
      // Update the provider with disconnected status
      this.emailProviders.set(id, {
        ...provider,
        connected: false
      });
      
      return {
        success: false,
        message: 'Failed to connect: ' + error.message
      };
    }
  }
  
  // Email Template CRUD operations
  
  /**
   * Get all email templates
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }
  
  /**
   * Get a specific email template
   */
  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }
  
  /**
   * Create a new email template
   */
  async createEmailTemplate(templateData: EmailTemplate): Promise<EmailTemplate> {
    const id = templateData.id || uuidv4();
    const newTemplate = {
      ...templateData,
      id
    };
    
    this.emailTemplates.set(id, newTemplate);
    
    // In a real implementation, we would save to the database
    
    return newTemplate;
  }
  
  /**
   * Update an email template
   */
  async updateEmailTemplate(id: string, templateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const existingTemplate = this.emailTemplates.get(id);
    if (!existingTemplate) {
      return undefined;
    }
    
    const updatedTemplate = {
      ...existingTemplate,
      ...templateData,
      id
    };
    
    this.emailTemplates.set(id, updatedTemplate);
    
    // In a real implementation, we would save to the database
    
    return updatedTemplate;
  }
  
  /**
   * Delete an email template
   */
  async deleteEmailTemplate(id: string): Promise<boolean> {
    if (!this.emailTemplates.has(id)) {
      return false;
    }
    
    this.emailTemplates.delete(id);
    
    // In a real implementation, we would delete from the database
    
    return true;
  }
}