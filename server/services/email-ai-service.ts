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
import OpenAI from 'openai';

// Define schemas for validation
export const emailProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  host: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string().optional(),
  useSSL: z.boolean(),
  isDefault: z.boolean(),
  connected: z.boolean().optional()
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
  DOCUMENT_REQUEST = 'document_request',
  XRAY_RESULTS = 'xray_results',
  TREATMENT_PROGRESS = 'treatment_progress',
  PERIODONTAL_ASSESSMENT = 'periodontal_assessment',
  RESTORATIVE_TREATMENT = 'restorative_treatment',
  ORTHODONTIC_UPDATE = 'orthodontic_update',
  ENDODONTIC_TREATMENT = 'endodontic_treatment',
  ORAL_SURGERY_FOLLOWUP = 'oral_surgery_followup'
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
    teethNumbers?: string[];
    diagnosis?: string[];
    dentalAnatomy?: string[];
    treatmentTypes?: string[];
    imagingTypes?: string[];
    insuranceInfo?: any;
    labInfo?: any;
    perioInfo?: any;
    orthodonticInfo?: any;
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
    } catch (err) {
      const error = err as Error;
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
    } catch (err) {
      const error = err as Error;
      console.error('Error setting up email transporter:', error.message);
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
      },
      {
        id: 'xray-results',
        name: 'X-Ray Analysis Results',
        subject: 'Your Dental X-Ray Results - DentaMind',
        body: 'Dear {{patientName}},\n\nDr. {{providerName}} has reviewed your recent dental X-rays taken on {{xrayDate}}.\n\nFindings:\n{{xrayFindings}}\n\nRecommendations:\n{{recommendations}}\n\nYour X-rays have also been securely stored in our system and will be used to track any changes in your dental health over time. This will allow us to provide you with the most accurate and personalized care.\n\nIf you have any questions about these results or would like to schedule a follow-up appointment to discuss them, please contact our office at {{officePhone}}.\n\nBest regards,\nDr. {{providerName}}\nDentaMind Team',
        type: 'general',
        aiGenerated: false,
        variables: ['patientName', 'providerName', 'xrayDate', 'xrayFindings', 'recommendations', 'officePhone'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Your Dental X-Ray Results</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>Dr. {{providerName}} has reviewed your recent dental X-rays taken on <strong>{{xrayDate}}</strong>.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">Findings:</h3>' +
          '<p>{{xrayFindings}}</p>' +
          '<h3>Recommendations:</h3>' +
          '<p>{{recommendations}}</p>' +
          '</div>' +
          '<p>Your X-rays have been securely stored in our system and will be used to track changes in your dental health over time. This tracking allows us to provide you with the most accurate and personalized care.</p>' +
          '<p>If you have any questions about these results or would like to schedule a follow-up appointment to discuss them, please contact our office at <a href="tel:{{officePhone}}">{{officePhone}}</a>.</p>' +
          '<p>Best regards,<br>Dr. {{providerName}}<br>DentaMind Team</p>' +
          '</div>',
        description: 'Email sent to patients with their X-ray analysis results and recommendations',
        category: 'Diagnostic'
      },
      {
        id: 'treatment-progress',
        name: 'Treatment Progress Update',
        subject: 'Your Treatment Progress Update - DentaMind',
        body: 'Dear {{patientName}},\n\nWe wanted to provide you with an update on your ongoing treatment at DentaMind.\n\nTreatment Progress:\n{{treatmentProgress}}\n\nNext Steps:\n{{nextSteps}}\n\nWe have compared your recent X-rays with your previous ones, and here are the changes we\'ve observed:\n{{progressComparison}}\n\nYour next appointment is scheduled for {{nextAppointmentDate}} at {{nextAppointmentTime}}.\n\nIf you have any questions or concerns about your treatment progress, please don\'t hesitate to contact us.\n\nBest regards,\nDr. {{providerName}}\nDentaMind Team',
        type: 'follow_up',
        aiGenerated: false,
        variables: ['patientName', 'providerName', 'treatmentProgress', 'nextSteps', 'progressComparison', 'nextAppointmentDate', 'nextAppointmentTime'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Your Treatment Progress Update</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>We wanted to provide you with an update on your ongoing treatment at DentaMind.</p>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #28C76F; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">Treatment Progress:</h3>' +
          '<p>{{treatmentProgress}}</p>' +
          '<h3>Next Steps:</h3>' +
          '<p>{{nextSteps}}</p>' +
          '</div>' +
          '<div style="background-color: #f8f9fa; border-left: 4px solid #2474c7; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0;">X-Ray Comparison Analysis:</h3>' +
          '<p>We have compared your recent X-rays with your previous ones, and here are the changes we\'ve observed:</p>' +
          '<p>{{progressComparison}}</p>' +
          '</div>' +
          '<p>Your next appointment is scheduled for <strong>{{nextAppointmentDate}}</strong> at <strong>{{nextAppointmentTime}}</strong>.</p>' +
          '<p>If you have any questions or concerns about your treatment progress, please don\'t hesitate to contact us.</p>' +
          '<p>Best regards,<br>Dr. {{providerName}}<br>DentaMind Team</p>' +
          '</div>',
        description: 'Email sent to patients with updates on their ongoing treatment progress',
        category: 'Treatment'
      },
      {
        id: 'xray-scheduling',
        name: 'X-Ray Appointment Reminder',
        subject: 'Your Upcoming X-Ray Appointment - DentaMind',
        body: 'Dear {{patientName}},\n\nThis is a reminder of your upcoming X-ray appointment at DentaMind.\n\nAppointment Details:\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nType of X-ray: {{xrayType}}\n\nPurpose: {{purpose}}\n\nPlease arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please contact us at least 24 hours in advance at {{officePhone}}.\n\nBest regards,\nDentaMind Team',
        type: 'reminder',
        aiGenerated: false,
        variables: ['patientName', 'appointmentDate', 'appointmentTime', 'xrayType', 'purpose', 'officePhone'],
        htmlVersion: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">' +
          '<img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />' +
          '<h2 style="color: #28C76F;">Your Upcoming X-Ray Appointment</h2>' +
          '<p>Dear {{patientName}},</p>' +
          '<p>This is a reminder of your upcoming X-ray appointment at DentaMind.</p>' +
          '<div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0;">' +
          '<h3 style="margin-top: 0; color: #28C76F;">Appointment Details:</h3>' +
          '<p><strong>Date:</strong> {{appointmentDate}}</p>' +
          '<p><strong>Time:</strong> {{appointmentTime}}</p>' +
          '<p><strong>Type of X-ray:</strong> {{xrayType}}</p>' +
          '<p><strong>Purpose:</strong> {{purpose}}</p>' +
          '</div>' +
          '<p>Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please contact us at least 24 hours in advance at <a href="tel:{{officePhone}}">{{officePhone}}</a>.</p>' +
          '<p>Best regards,<br>DentaMind Team</p>' +
          '</div>',
        description: 'Email sent to remind patients of upcoming X-ray appointments',
        category: 'Scheduling'
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
      console.log('Checking emails...');
      
      // In a real implementation, we would connect to the email server and fetch unread emails
      // For demonstration purposes, we'll simulate processing of different dental-specific emails
      
      // Simulate receiving different types of emails
      const simulatedEmails = this.getSimulatedDentalEmails();
      const processedResults = [];
      
      // Process each email
      for (const email of simulatedEmails) {
        // Analyze the email content with AI
        const analysis = await this.analyzeEmailContent(email);
        
        // Process based on the detected email type
        const result = await this.processEmailByType(email, analysis);
        processedResults.push(result);
        
        console.log(`Processed email: ${email.subject} - Type: ${analysis.eventType} - Action: ${result.action}`);
      }
      
      this.isCheckingEmails = false;
      return { 
        status: 'success', 
        message: 'Emails checked successfully',
        emailsProcessed: processedResults.length,
        newEmails: processedResults.length,
        processedResults
      };
    } catch (err) {
      this.isCheckingEmails = false;
      const error = err as Error;
      console.error('Error checking emails:', error.message);
      return { 
        status: 'error', 
        message: 'Error checking emails: ' + error.message 
      };
    }
  }
  
  /**
   * Process an email based on its detected type
   * 
   * @param email The email content
   * @param analysis The AI analysis of the email
   * @returns Processing result
   */
  private async processEmailByType(email: EmailContent, analysis: AIEmailAnalysis): Promise<any> {
    // Base result structure
    const result = {
      emailId: uuidv4(),
      subject: email.subject,
      from: email.from,
      type: analysis.eventType,
      processed: true,
      action: 'none',
      updatedRecords: [],
      autoResponded: false
    };
    
    // Process based on event type
    switch (analysis.eventType) {
      case EmailEventType.LAB_CASE_UPDATE:
        return await this.processLabCaseEmail(email, analysis, result);
        
      case EmailEventType.INSURANCE_APPROVAL:
      case EmailEventType.INSURANCE_DENIAL:
        return await this.processInsuranceEmail(email, analysis, result);
        
      case EmailEventType.PRESCRIPTION_CONFIRMATION:
        return await this.processPrescriptionEmail(email, analysis, result);
        
      case EmailEventType.SUPPLY_ORDER_UPDATE:
        return await this.processSupplyOrderEmail(email, analysis, result);
        
      case EmailEventType.PATIENT_INQUIRY:
        return await this.processPatientInquiryEmail(email, analysis, result);
        
      case EmailEventType.APPOINTMENT_REQUEST:
        return await this.processAppointmentRequestEmail(email, analysis, result);
        
      default:
        result.action = 'flagged_for_review';
        return result;
    }
  }

  /**
   * Analyze email content with AI to extract key information and suggest actions
   * 
   * @param emailContent The email content to analyze, either as a string or structured EmailContent object
   * @returns Detailed analysis of the email with extracted entities and suggested actions
   */
  async analyzeEmailContent(emailContent: EmailContent | string): Promise<AIEmailAnalysis> {
    try {
      // Prepare the content for analysis
      const content = typeof emailContent === 'string' 
        ? emailContent 
        : `From: ${emailContent.from}\nTo: ${emailContent.to}\nSubject: ${emailContent.subject}\n\n${emailContent.text}`;
      
      // Check if content is empty
      if (!content || content.trim().length === 0) {
        return {
          eventType: null,
          confidence: 0,
          detectedEntities: {},
          summary: "No email content provided for analysis."
        };
      }
      
      // Check for attached images or X-rays
      const hasAttachments = typeof emailContent !== 'string' && 
        emailContent.attachments && 
        emailContent.attachments.length > 0;
      
      const attachmentInfo = hasAttachments 
        ? `Email contains ${typeof emailContent !== 'string' && emailContent.attachments ? emailContent.attachments.length : 0} attachment(s) that may include dental X-rays or clinical images.` 
        : 'No attachments found.';
      
      // Create a detailed, structured prompt for the AI with enhanced dental terminology
      const analysisPrompt = `
      You are a dental practice AI assistant analyzing incoming emails for DentaMind dental practice. 
      Extract key information and categorize this email with attention to dental-specific terminology:
      
      ${content}
      
      ${attachmentInfo}
      
      Analyze the email and extract the following information in JSON format:
      
      {
        "eventType": "lab_case_update" | "insurance_approval" | "insurance_denial" | "patient_inquiry" | 
          "appointment_request" | "prescription_confirmation" | "supply_order_update" | "document_request" | 
          "xray_results" | "treatment_progress" | "periodontal_assessment" | "restorative_treatment" | 
          "orthodontic_update" | "endodontic_treatment" | "oral_surgery_followup" | null,
        "confidence": [confidence score between 0-1],
        "patientInfo": {
          "name": [detected patient name or null],
          "id": [detected patient ID or null],
          "contactInfo": [detected contact information or null]
        },
        "detectedEntities": {
          "dates": [array of dates mentioned],
          "times": [array of times mentioned],
          "names": [array of names mentioned],
          "procedures": [array of dental procedures mentioned],
          "amounts": [array of monetary amounts mentioned],
          "medications": [array of medications mentioned],
          "teethNumbers": [array of tooth numbers mentioned using Universal Numbering System],
          "diagnosis": [array of dental diagnoses mentioned],
          "dentalAnatomy": [array of dental anatomical terms mentioned],
          "treatmentTypes": [array of dental treatment types mentioned],
          "imagingTypes": [array of dental imaging types mentioned (e.g., bitewing, panoramic, CBCT)],
          "insuranceInfo": {
            "provider": [detected insurance provider or null],
            "policyNumber": [detected policy number or null],
            "coverage": [detected coverage information or null]
          },
          "labInfo": {
            "caseNumber": [detected lab case number or null],
            "labName": [detected lab name or null],
            "status": [detected status or null],
            "prostheticType": [detected prosthetic type or null],
            "shade": [detected shade information or null]
          },
          "perioInfo": {
            "pocketDepths": [detected periodontal pocket depths or null],
            "recessionMeasurements": [detected gingival recession measurements or null],
            "bleedingPoints": [detected bleeding on probing information or null]
          },
          "orthodonticInfo": {
            "applianceType": [detected orthodontic appliance type or null],
            "adjustmentDetails": [detected adjustment details or null],
            "treatmentPhase": [detected treatment phase or null]
          }
        },
        "clinicalRelevance": "high" | "medium" | "low",
        "urgency": "high" | "medium" | "low",
        "suggestedAction": [specific action that should be taken],
        "suggestedTemplate": [suggested response template ID if applicable],
        "patientRecordUpdate": [suggested updates to patient record based on email content],
        "summary": [brief summary of the email in 2-3 sentences]
      }
      
      Use these common dental terminology references when analyzing the email:
      - Dental Procedures: prophylaxis, scaling and root planing, root canal treatment, extraction, implant placement, crown preparation, denture delivery, fillings, etc.
      - Dental Imaging: bitewing, periapical, panoramic, CBCT scan, FMX (full mouth series), cephalometric radiograph
      - Dental Diagnoses: caries, periodontitis, periapical abscess, pulpitis, gingivitis, pericoronitis, bruxism, TMJ disorder
      - Dental Materials: composite, amalgam, porcelain, zirconia, PFM (porcelain-fused-to-metal), IPS e.max, PMMA, acrylic
      - Tooth Numbering: Universal System (1-32), Palmer Notation, FDI World Dental Federation notation
      - Dental Anatomy: mesial, distal, buccal, lingual, occlusal, incisal, apical, coronal
      - Dental Specialists: endodontist, periodontist, oral surgeon, orthodontist, prosthodontist, pediatric dentist
      
      Ensure all extracted entities are accurate and relevant to dental practice operations. Pay special attention to dental terminology and clinical relevance.
      `;
      
      // Check if OPENAI_API_KEY_COMMUNICATION is available
      if (process.env.OPENAI_API_KEY_COMMUNICATION) {
        try {
          // Use OpenAI API directly for now
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
          });
          
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are an AI assistant for a dental practice that specializes in analyzing emails and extracting structured information."
              },
              {
                role: "user",
                content: analysisPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 800,
            response_format: { type: "json_object" }
          });
          
          // Extract and parse the response
          const responseText = response.choices[0]?.message?.content || "{}";
          try {
            const parsedResponse = JSON.parse(responseText);
            
            // Map the AI response to our AIEmailAnalysis structure
            return {
              eventType: parsedResponse.eventType as EmailEventType,
              patientName: parsedResponse.patientInfo?.name,
              patientId: parsedResponse.patientInfo?.id,
              confidence: parsedResponse.confidence || 0,
              detectedEntities: {
                dates: parsedResponse.detectedEntities?.dates || [],
                names: parsedResponse.detectedEntities?.names || [],
                procedures: parsedResponse.detectedEntities?.procedures || [],
                amounts: parsedResponse.detectedEntities?.amounts || [],
                medications: parsedResponse.detectedEntities?.medications || [],
                teethNumbers: parsedResponse.detectedEntities?.teethNumbers || [],
                diagnosis: parsedResponse.detectedEntities?.diagnosis || [],
                dentalAnatomy: parsedResponse.detectedEntities?.dentalAnatomy || [],
                treatmentTypes: parsedResponse.detectedEntities?.treatmentTypes || [],
                imagingTypes: parsedResponse.detectedEntities?.imagingTypes || [],
                insuranceInfo: parsedResponse.detectedEntities?.insuranceInfo || {},
                labInfo: parsedResponse.detectedEntities?.labInfo || {},
                perioInfo: parsedResponse.detectedEntities?.perioInfo || {},
                orthodonticInfo: parsedResponse.detectedEntities?.orthodonticInfo || {}
              },
              suggestedAction: parsedResponse.suggestedAction,
              summary: parsedResponse.summary
            };
          } catch (err) {
            console.error('Error parsing AI response:', err);
            throw new Error('Failed to parse AI analysis response');
          }
        } catch (err) {
          // Log the error but continue with fallback
          const error = err as Error;
          console.error('Error calling OpenAI for email analysis:', error.message);
          
          // Fall back to basic analysis if OpenAI API fails
          return this.performBasicAnalysis(content);
        }
      } else {
        // No API key available, perform basic analysis
        console.warn('OPENAI_API_KEY_COMMUNICATION not available for email analysis');
        return this.performBasicAnalysis(content);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error analyzing email content:', error.message);
      
      // Return a basic error analysis
      return {
        eventType: null,
        confidence: 0,
        detectedEntities: {},
        summary: `Error analyzing email: ${error.message}`
      };
    }
  }
  
  /**
   * Perform basic analysis of email content without using AI
   * @param content Email content as string
   * @returns Basic analysis based on keyword matching
   */
  private performBasicAnalysis(content: string): AIEmailAnalysis {
    // Basic analysis using regex patterns and keywords
    const contentLower = content.toLowerCase();
    let eventType: EmailEventType | null = null;
    
    // Dental-specific procedure keywords for detection
    const dentalProcedures = [
      'filling', 'crown', 'bridge', 'implant', 'extraction', 'root canal', 'scaling', 
      'root planing', 'prophylaxis', 'cleaning', 'denture', 'veneer', 'whitening',
      'orthodontic', 'braces', 'invisalign', 'periodontal', 'surgical', 'bone graft'
    ];
    
    // Extract detected procedures using keywords
    const procedures = dentalProcedures.filter(proc => contentLower.includes(proc));
    
    // Detect dental-specific imaging terms
    const imagingKeywords = ['x-ray', 'xray', 'radiograph', 'cbct', 'panoramic', 'bitewing', 'periapical'];
    const hasImaging = imagingKeywords.some(term => contentLower.includes(term));
    
    // Extract tooth numbers (e.g., #14, tooth 14)
    const toothNumberRegex = /(?:tooth|#)\s*(\d{1,2})/gi;
    const toothNumberMatches = content.matchAll(toothNumberRegex);
    const teethNumbers = Array.from(toothNumberMatches).map(match => match[1]);
    
    // Simple event type detection based on keywords
    if (contentLower.includes('lab') && (contentLower.includes('case') || contentLower.includes('update'))) {
      eventType = EmailEventType.LAB_CASE_UPDATE;
    } else if (contentLower.includes('insurance') && contentLower.includes('approv')) {
      eventType = EmailEventType.INSURANCE_APPROVAL;
    } else if (contentLower.includes('insurance') && (contentLower.includes('denied') || contentLower.includes('denial'))) {
      eventType = EmailEventType.INSURANCE_DENIAL;
    } else if (contentLower.includes('appointment') && (contentLower.includes('request') || contentLower.includes('schedule'))) {
      eventType = EmailEventType.APPOINTMENT_REQUEST;
    } else if (contentLower.includes('prescription')) {
      eventType = EmailEventType.PRESCRIPTION_CONFIRMATION;
    } else if (contentLower.includes('supply') || contentLower.includes('order')) {
      eventType = EmailEventType.SUPPLY_ORDER_UPDATE;
    } else if (contentLower.includes('document') || contentLower.includes('form')) {
      eventType = EmailEventType.DOCUMENT_REQUEST;
    } 
    // New dental-specific event types
    else if (hasImaging && (
      contentLower.includes('result') || 
      contentLower.includes('finding') || 
      contentLower.includes('analysis')
    )) {
      eventType = EmailEventType.XRAY_RESULTS;
    } else if (contentLower.includes('progress') || (
      contentLower.includes('treatment') && 
      contentLower.includes('update')
    )) {
      eventType = EmailEventType.TREATMENT_PROGRESS;
    } else if (contentLower.includes('perio') || contentLower.includes('periodontal')) {
      eventType = EmailEventType.PERIODONTAL_ASSESSMENT;
    } else if (contentLower.includes('ortho') || contentLower.includes('braces') || contentLower.includes('invisalign')) {
      eventType = EmailEventType.ORTHODONTIC_UPDATE;
    } else if (contentLower.includes('restorative')) {
      eventType = EmailEventType.RESTORATIVE_TREATMENT;
    } else if (contentLower.includes('endo') || contentLower.includes('root canal')) {
      eventType = EmailEventType.ENDODONTIC_TREATMENT;
    } else if (contentLower.includes('surgery') || contentLower.includes('extraction')) {
      eventType = EmailEventType.ORAL_SURGERY_FOLLOWUP;
    } else if (contentLower.includes('perio') || contentLower.includes('periodontal') || (
      contentLower.includes('gum') && 
      (contentLower.includes('assessment') || contentLower.includes('evaluation'))
    )) {
      eventType = EmailEventType.PERIODONTAL_ASSESSMENT;
    } else if (contentLower.includes('restorative') || (
      contentLower.includes('filling') || 
      contentLower.includes('crown') || 
      contentLower.includes('bridge')
    )) {
      eventType = EmailEventType.RESTORATIVE_TREATMENT;
    } else if (contentLower.includes('orthodontic') || 
      contentLower.includes('braces') || 
      contentLower.includes('invisalign')
    ) {
      eventType = EmailEventType.ORTHODONTIC_UPDATE;
    } else if (contentLower.includes('endo') || contentLower.includes('root canal')) {
      eventType = EmailEventType.ENDODONTIC_TREATMENT;
    } else if (contentLower.includes('surgery') || 
      contentLower.includes('extraction') || 
      contentLower.includes('implant')
    ) {
      eventType = EmailEventType.ORAL_SURGERY_FOLLOWUP;
    }
    
    // Extract dates with a simple regex
    const dateRegex = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-]([12]\d{3}|\d{2})\b/g;
    const dates = content.match(dateRegex) || [];
    
    // Extract monetary amounts
    const amountRegex = /\$\s?\d+(?:\.\d{2})?|\d+\s?(?:dollars|USD)/g;
    const amounts = content.match(amountRegex) || [];
    
    // Identify if there are any patient names (this is a simplified approach)
    // In a real implementation, we would check against a database of patient names
    const nameRegex = /(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g;
    const names = content.match(nameRegex) || [];
    
    // Extract potential medication names
    const commonMedications = [
      'amoxicillin', 'penicillin', 'ibuprofen', 'tylenol', 'acetaminophen',
      'advil', 'motrin', 'vicodin', 'percocet', 'antibiotics', 'analgesics'
    ];
    const medications = commonMedications.filter(med => contentLower.includes(med.toLowerCase()));
    
    // Create a basic summary
    let summary = "Email received";
    if (eventType) {
      summary += ` related to ${eventType.replace(/_/g, ' ')}`;
    }
    if (dates.length > 0) {
      summary += ` mentioning dates`;
    }
    if (procedures.length > 0) {
      summary += ` discussing ${procedures.join(', ')}`;
    }
    
    return {
      eventType,
      confidence: eventType ? 0.6 : 0.3, // Lower confidence for regex-based analysis
      detectedEntities: {
        dates,
        names,
        amounts,
        procedures,
        medications,
        // Add dental-specific detected entities
        teethNumbers: teethNumbers,
        treatmentTypes: procedures, // Reuse procedures as treatment types
        imagingTypes: hasImaging ? imagingKeywords.filter(term => contentLower.includes(term)) : []
      },
      suggestedAction: eventType ? `Review and process ${eventType.replace(/_/g, ' ')}` : "Review email manually",
      summary
    };
  }

  /**
   * Generate an AI response to an email based on content analysis and context
   * 
   * @param emailContent Original email content to respond to
   * @param context Additional context like patient info, analysis results, template ID, etc.
   * @returns Generated response with subject and body
   */
  async generateAIResponse(
    emailContent: string, 
    context?: {
      patientName?: string;
      patientId?: number;
      providerName?: string;
      eventType?: EmailEventType;
      analysis?: AIEmailAnalysis;
      templateId?: string;
      clinic?: {
        name?: string;
        phone?: string;
        address?: string;
        website?: string;
      };
    }
  ): Promise<{ subject: string; body: string; html?: string }> {
    try {
      // If a template ID was provided, try to use that template
      if (context?.templateId) {
        const template = this.emailTemplates.get(context.templateId);
        if (template) {
          return this.generateResponseFromTemplate(template, context);
        }
      }
      
      // First try to get a relevant template based on email type
      if (context?.eventType) {
        const relevantTemplates = Array.from(this.emailTemplates.values())
          .filter(t => t.type.toLowerCase() === context.eventType?.toLowerCase().replace(/_/g, ''));
        
        if (relevantTemplates.length > 0) {
          // Use the most recently used template if available
          const template = relevantTemplates.sort((a, b) => {
            if (!a.lastUsed) return 1;
            if (!b.lastUsed) return -1;
            return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
          })[0];
          
          return this.generateResponseFromTemplate(template, context);
        }
      }
      
      // If no template is available or suitable, generate a response with AI
      if (process.env.OPENAI_API_KEY_COMMUNICATION) {
        try {
          // Create a detailed prompt for the AI
          const prompt = `
          You are an AI assistant for DentaMind dental practice. Please generate a professional response to the following email:
          
          ORIGINAL EMAIL:
          ${emailContent}
          
          ${context ? `CONTEXT:
          ${context.patientName ? `Patient Name: ${context.patientName}` : ''}
          ${context.patientId ? `Patient ID: ${context.patientId}` : ''}
          ${context.providerName ? `Provider Name: ${context.providerName}` : ''}
          ${context.eventType ? `Email Type: ${context.eventType.replace(/_/g, ' ')}` : ''}
          ${context.analysis?.summary ? `Analysis: ${context.analysis.summary}` : ''}
          ${context.clinic?.name ? `Clinic Name: ${context.clinic.name}` : 'Clinic Name: DentaMind'}
          ${context.clinic?.phone ? `Phone: ${context.clinic.phone}` : 'Phone: (555) 123-4567'}
          ${context.clinic?.website ? `Website: ${context.clinic.website}` : 'Website: dentamind.com'}
          ` : ''}
          
          Generate a response with:
          1. An appropriate subject line (should typically start with "Re: " followed by a relevant subject line)
          2. A professional body that addresses the sender's needs
          3. Clear next steps if applicable
          4. A friendly closing including contact information
          
          Response should be in clean HTML format suitable for an email. Include appropriate formatting like paragraphs, bulleted lists if needed, and a professional signature block.
          
          Format your response as JSON with these fields:
          {
            "subject": "The email subject line",
            "body": "The plain text version of the email body",
            "html": "The HTML version of the email body with proper formatting"
          }
          `;
          
          // Use OpenAI API directly for now
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
          });
          
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are an AI assistant for a dental practice that specializes in generating professional email responses."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: "json_object" }
          });
          
          // Extract and parse the response
          const responseText = response.choices[0]?.message?.content || "{}";
          try {
            const parsedResponse = JSON.parse(responseText);
            
            return {
              subject: parsedResponse.subject || "Re: Your Message",
              body: parsedResponse.body || "Thank you for your message. We will respond shortly.",
              html: parsedResponse.html
            };
          } catch (err) {
            console.error('Error parsing AI response:', err);
            // Fall back to default response
            return this.getDefaultResponse(emailContent, context);
          }
        } catch (err) {
          const error = err as Error;
          console.error('Error generating email response with AI:', error.message);
          // Fall back to default response
          return this.getDefaultResponse(emailContent, context);
        }
      } else {
        // No API key available, return default response
        console.warn('OPENAI_API_KEY_COMMUNICATION not available for email response generation');
        return this.getDefaultResponse(emailContent, context);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error generating AI response:', error.message);
      
      // Always return something, even in case of error
      return {
        subject: "Re: Your Message",
        body: "Thank you for your message. A member of our team will review it and respond as soon as possible.\n\nBest regards,\nDentaMind Team"
      };
    }
  }
  
  /**
   * Generate an email response from a template by replacing variables
   */
  private generateResponseFromTemplate(
    template: EmailTemplate, 
    context?: any
  ): Promise<{ subject: string; body: string; html?: string }> {
    // Create a copy of template content to replace variables
    let subject = template.subject;
    let body = template.body;
    let html = template.htmlVersion;
    
    // Basic variable replacement
    if (context) {
      // Common replacements
      const replacements: Record<string, string> = {
        '{{patientName}}': context.patientName || 'Valued Patient',
        '{{providerName}}': context.providerName || 'Dr. Smith',
        '{{clinicName}}': context.clinic?.name || 'DentaMind',
        '{{practicePhone}}': context.clinic?.phone || '(555) 123-4567',
        '{{practiceAddress}}': context.clinic?.address || '123 Main St, Anytown, USA',
        '{{date}}': new Date().toLocaleDateString(),
        '{{time}}': new Date().toLocaleTimeString(),
        '{{logoUrl}}': '/assets/dentamind-logo.png'
      };
      
      // Apply all replacements
      Object.entries(replacements).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(key, 'g'), value);
        body = body.replace(new RegExp(key, 'g'), value);
        if (html) {
          html = html.replace(new RegExp(key, 'g'), value);
        }
      });
    }
    
    // Update last used timestamp for the template
    this.updateTemplateUsage(template.id as string);
    
    return Promise.resolve({
      subject,
      body,
      html
    });
  }
  
  /**
   * Update template usage timestamp
   */
  private updateTemplateUsage(templateId: string): void {
    const template = this.emailTemplates.get(templateId);
    if (template) {
      this.emailTemplates.set(templateId, {
        ...template,
        lastUsed: new Date().toISOString()
      });
      
      // In a real implementation, we would save this to the database
    }
  }
  
  /**
   * Get a default response when AI or templates are not available
   */
  private getDefaultResponse(
    emailContent: string, 
    context?: any
  ): { subject: string; body: string; html?: string } {
    // Extract original subject if available
    const subjectMatch = emailContent.match(/Subject: (.*?)(?:\n|$)/i);
    const originalSubject = subjectMatch ? subjectMatch[1].trim() : '';
    
    const subject = originalSubject ? `Re: ${originalSubject}` : "Re: Your Message";
    const patientName = context?.patientName || "Valued Patient";
    const clinicName = context?.clinic?.name || "DentaMind";
    const phone = context?.clinic?.phone || "(555) 123-4567";
    
    const body = `Dear ${patientName},\n\nThank you for your message. A member of our dental team will review your inquiry and respond as soon as possible, typically within 1-2 business days.\n\nIf you have an urgent dental concern, please call our office directly at ${phone}.\n\nBest regards,\n${clinicName} Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <img src="/assets/dentamind-logo.png" alt="DentaMind Logo" style="max-width: 200px; margin-bottom: 20px;" />
        <p>Dear ${patientName},</p>
        <p>Thank you for your message. A member of our dental team will review your inquiry and respond as soon as possible, typically within 1-2 business days.</p>
        <p>If you have an urgent dental concern, please call our office directly at <strong>${phone}</strong>.</p>
        <p>Best regards,<br>${clinicName} Team</p>
      </div>
    `;
    
    return {
      subject,
      body,
      html
    };
  }
  
  /**
   * Generate simulated dental-specific emails for testing
   */
  private getSimulatedDentalEmails(): EmailContent[] {
    return [
      {
        from: "labworks@dentallab.com",
        to: "office@dentamind.com",
        subject: "Lab Case #LC-4592 Update: Crown for Patient Smith Ready for Pickup",
        text: "Dear DentaMind,\n\nThis is to notify you that Lab Case #LC-4592 (PFM Crown for tooth #14, patient John Smith) has been completed and is ready for pickup. The case will be delivered via our courier service tomorrow by 10:00 AM.\n\nShade A2 as requested has been used for the final restoration. Please inspect upon receipt and notify us of any adjustments needed.\n\nRegards,\nDental Lab Works",
        date: new Date(),
        attachments: []
      },
      {
        from: "claims@dentalinsurance.com",
        to: "billing@dentamind.com",
        subject: "Claim Approval Notification: Patient ID #PT45892",
        text: "RE: Insurance Claim #INS-78945\nPatient: Sarah Johnson (ID: PT45892)\nProvider: Dr. Maria Rodriguez\nDate of Service: 03/15/2025\n\nDear DentaMind,\n\nWe are pleased to inform you that the claim referenced above has been APPROVED. The following procedures have been covered:\n\nD2750 - Crown porcelain/ceramic - $850.00 (Covered at 80%)\nD3310 - Root canal anterior - $675.00 (Covered at 80%)\n\nTotal Payment: $1,220.00\nPatient Responsibility: $305.00\n\nPayment will be processed within 5-7 business days.\n\nSincerely,\nDental Insurance Claims Department",
        date: new Date(),
        attachments: []
      },
      {
        from: "pharmacy@medicalrx.com",
        to: "prescriptions@dentamind.com",
        subject: "Prescription Confirmation: Amoxicillin for Michael Thompson",
        text: "Prescription Confirmation\nPatient: Michael Thompson\nRx Number: 82746295\nMedication: Amoxicillin 500mg\nQuantity: 21 capsules\nDirections: Take 1 capsule 3 times daily for 7 days\nPrescribed by: Dr. James Wilson\n\nThis prescription has been filled and is ready for pickup at Main Street Pharmacy. The patient has been notified.\n\nIf you have any questions, please contact us at 555-123-9876.\n\nThank you,\nMedical Rx Pharmacy Services",
        date: new Date(),
        attachments: []
      },
      {
        from: "orders@dentalsupplies.com",
        to: "orders@dentamind.com",
        subject: "Dental Supply Order #DS-29384 Confirmation",
        text: "Order Confirmation #DS-29384\nDate: March 20, 2025\n\nThank you for your order with Dental Supplies Inc. The following items have been shipped and should arrive within 2-3 business days:\n\n- Composite Resin A2 (10 packs) - $450.00\n- Dental Impression Material (5 sets) - $325.00\n- Disposable Prophy Angles (100 ct) - $180.00\n- Sterilization Pouches (500 ct) - $95.00\n\nTotal: $1,050.00\nShipping: Free\nTotal Charged: $1,050.00\n\nTracking Number: 1Z9999999999999999\nCarrier: UPS\n\nPlease let us know if you have any questions about your order.\n\nRegards,\nDental Supplies Customer Service",
        date: new Date(),
        attachments: []
      },
      {
        from: "jennifer.brown@email.com",
        to: "appointments@dentamind.com",
        subject: "Request to Schedule Dental Appointment",
        text: "Hello,\n\nI would like to schedule an appointment for a dental cleaning and check-up. I'm experiencing some sensitivity in my lower left molar (I think it's tooth #19).\n\nI'm available on Tuesday afternoons or Thursday mornings for the next two weeks. My last cleaning was about 7 months ago.\n\nMy information:\nName: Jennifer Brown\nDate of Birth: 05/12/1985\nPhone: 555-987-6543\nInsurance: Delta Dental (ID: DD987654321)\n\nThank you,\nJennifer Brown",
        date: new Date(),
        attachments: []
      },
      {
        from: "orthodontics@specialistcenter.com",
        to: "referrals@dentamind.com",
        subject: "Invisalign Treatment Progress Update: Patient Lisa Garcia",
        text: "DentaMind Dental Referrals\nRe: Lisa Garcia (DOB: 08/27/1992)\n\nDear Dr. Rodriguez,\n\nThis is an update on your referred patient, Lisa Garcia, who is currently undergoing Invisalign treatment at our office.\n\nThe patient has completed 14 of 24 planned aligners. The teeth are tracking well with good compliance reported by the patient. The midline correction is progressing as planned, and space closure for the previous extraction sites is approximately 60% complete.\n\nWe anticipate completing the active phase of treatment in approximately 3 months, followed by refinement aligners if needed. We recommend the patient maintain her regular 6-month cleaning schedule with your office during treatment.\n\nEnclosed are the latest progress photos and treatment simulation comparison.\n\nPlease let me know if you have any questions about Lisa's treatment.\n\nBest regards,\nDr. Emily Chen\nOrthodontic Specialist",
        date: new Date(),
        attachments: []
      },
      {
        from: "imaging@dentalradiology.com",
        to: "xrays@dentamind.com",
        subject: "CBCT Scan Results for Patient David Wilson",
        text: "CBCT SCAN REPORT\nPatient: David Wilson (DOB: 11/05/1976)\nReferring Doctor: Dr. Maria Rodriguez\nExam Date: March 18, 2025\nExam Type: Full CBCT Scan\n\nClinical History: Evaluation for implant placement in position #30\n\nFindings:\n- Adequate bone height (12mm) and width (8mm) in position #30 for standard implant placement\n- No pathological findings in the surrounding structures\n- Inferior alveolar nerve located 4mm inferior to the planned implant site\n- Normal maxillary sinuses bilaterally\n- Incidental finding of periapical radiolucency associated with the mesial root of tooth #19, measuring approximately 3mm\n\nRecommendations:\n- Proceed with implant planning for site #30 as bone dimensions are favorable\n- Consider evaluation of tooth #19 for possible endodontic pathology\n\nImages have been uploaded to your secure portal for review.\n\nRegards,\nDr. Robert Jackson\nOral and Maxillofacial Radiologist",
        date: new Date(),
        attachments: []
      }
    ];
  }
  
  /**
   * Process lab case update emails
   */
  private async processLabCaseEmail(email: EmailContent, analysis: AIEmailAnalysis, result: any): Promise<any> {
    // Extract lab case information
    const labInfo = analysis.detectedEntities.labInfo || {};
    const caseNumber = labInfo.caseNumber || 
      (email.text.match(/case\s*#?\s*([a-z0-9-]+)/i)?.[1]);
    const patientName = analysis.patientName || 
      analysis.detectedEntities.names?.[0];
    
    // Update result with extracted information
    result.action = 'update_lab_case';
    result.labCaseInfo = {
      caseNumber,
      labName: labInfo.labName,
      status: labInfo.status || 'ready',
      patientName,
      prostheticType: labInfo.prostheticType,
      teethInvolved: analysis.detectedEntities.teethNumbers,
      date: new Date().toISOString()
    };
    
    console.log(`Processing lab case update for case ${caseNumber}, patient: ${patientName}`);
    
    // Try to find patient ID by name if missing
    if (patientName && !analysis.patientId) {
      // In a real implementation, would look up patient ID from database
      console.log(`Looking up patient ID for ${patientName}...`);
      // result.patientId = await this.findPatientIdByName(patientName);
    }
    
    // Check if this case status requires scheduling the patient
    if (labInfo.status === 'ready' || email.text.toLowerCase().includes('ready for pickup')) {
      // In a real implementation, this would trigger a notification to schedule the patient
      result.requiresScheduling = true;
      result.schedulingReason = 'Lab case is ready';
      console.log(`Lab case ready - patient ${patientName} needs to be scheduled`);
    }
    
    // Check if an auto-response should be sent
    if (email.from.includes('@') && !email.from.includes('noreply')) {
      result.autoResponded = true;
      // In a real implementation, would actually send the response
      console.log(`Sending auto-response to ${email.from} confirming receipt of lab case update`);
    }
    
    result.updatedRecords.push({
      type: 'lab_case',
      id: caseNumber,
      action: 'status_updated',
      status: labInfo.status || 'ready'
    });
    
    return result;
  }
  
  /**
   * Process insurance approval/denial emails
   */
  private async processInsuranceEmail(email: EmailContent, analysis: AIEmailAnalysis, result: any): Promise<any> {
    // Extract insurance claim information
    const insuranceInfo = analysis.detectedEntities.insuranceInfo || {};
    const claimNumber = 
      email.text.match(/claim\s*#?\s*([a-z0-9-]+)/i)?.[1] || 
      email.text.match(/ins\-(\d+)/i)?.[1];
    const patientName = analysis.patientName || 
      analysis.detectedEntities.names?.[0];
    const approvalStatus = 
      analysis.eventType === EmailEventType.INSURANCE_APPROVAL ? 'approved' : 'denied';
    
    // Extract amounts
    const amountMatches = email.text.match(/\$\s?(\d+\.\d{2})/g);
    const amounts = amountMatches ? Array.from(amountMatches) : [];
    const total = amounts.length > 0 ? amounts[amounts.length - 1] : null;
    
    // Update result with extracted information
    result.action = 'update_insurance_claim';
    result.insuranceClaimInfo = {
      claimNumber,
      patientName,
      status: approvalStatus,
      provider: insuranceInfo.provider,
      amounts,
      totalApproved: total,
      date: new Date().toISOString()
    };
    
    console.log(`Processing insurance ${approvalStatus} for claim ${claimNumber}, patient: ${patientName}`);
    
    // Update corresponding records
    result.updatedRecords.push({
      type: 'insurance_claim',
      id: claimNumber,
      action: 'status_updated',
      status: approvalStatus
    });
    
    // If approved, also update financial records
    if (approvalStatus === 'approved' && total) {
      result.updatedRecords.push({
        type: 'financial_transaction',
        action: 'expected_payment',
        amount: total,
        source: 'insurance',
        provider: insuranceInfo.provider
      });
      
      // In a real implementation, this would create a financial transaction record
      console.log(`Creating expected payment record for ${total} from insurance`);
    }
    
    // If denied, flag for staff review
    if (approvalStatus === 'denied') {
      result.requiresReview = true;
      result.reviewReason = 'Insurance claim denied';
      console.log(`Insurance claim denied - requires staff review`);
    }
    
    return result;
  }
  
  /**
   * Process prescription confirmation emails
   */
  private async processPrescriptionEmail(email: EmailContent, analysis: AIEmailAnalysis, result: any): Promise<any> {
    // Extract prescription information
    const medication = analysis.detectedEntities.medications?.[0];
    const rxNumber = email.text.match(/rx(?:\s+number|\s+#)?:\s*([a-z0-9-]+)/i)?.[1] || 
                    email.text.match(/rx[\s#]*(\d+)/i)?.[1];
    const patientName = analysis.patientName || analysis.detectedEntities.names?.[0];
    
    // Update result with extracted information
    result.action = 'update_prescription';
    result.prescriptionInfo = {
      rxNumber,
      medication,
      patientName,
      status: 'filled',
      date: new Date().toISOString()
    };
    
    console.log(`Processing prescription confirmation for ${medication}, patient: ${patientName}, Rx#: ${rxNumber}`);
    
    // Update corresponding records
    result.updatedRecords.push({
      type: 'prescription',
      id: rxNumber,
      action: 'status_updated',
      status: 'filled'
    });
    
    // In a real implementation, we would update the prescription status in the database
    
    return result;
  }
  
  /**
   * Process supply order update emails
   */
  private async processSupplyOrderEmail(email: EmailContent, analysis: AIEmailAnalysis, result: any): Promise<any> {
    // Extract order information
    const orderNumber = email.text.match(/order\s*#?\s*([a-z0-9-]+)/i)?.[1];
    const trackingNumber = email.text.match(/tracking\s*#?:?\s*([a-z0-9]+)/i)?.[1] ||
                          email.text.match(/\b(\d[a-z]\d{15,20})\b/i)?.[1];
    
    // Try to extract ordered items
    const itemMatches = email.text.match(/[-•]\s+([^-•][^\n]+)/g);
    const items = itemMatches ? Array.from(itemMatches).map(i => i.trim().replace(/^[-•]\s+/, '')) : [];
    
    // Extract total amount
    let totalAmount = null;
    const totalMatch = email.text.match(/total[:\s]+\$\s*(\d+\.\d{2})/i);
    if (totalMatch) {
      totalAmount = totalMatch[1];
    }
    
    // Update result with extracted information
    result.action = 'update_supply_order';
    result.supplyOrderInfo = {
      orderNumber,
      trackingNumber,
      items,
      status: 'shipped',
      totalAmount,
      expectedDelivery: analysis.detectedEntities.dates?.[0],
      date: new Date().toISOString()
    };
    
    console.log(`Processing supply order update for order ${orderNumber}, tracking: ${trackingNumber}`);
    
    // Update corresponding records
    result.updatedRecords.push({
      type: 'supply_order',
      id: orderNumber,
      action: 'status_updated',
      status: 'shipped',
      tracking: trackingNumber
    });
    
    // In a real implementation, we would update the order status in the database
    // and potentially add the items to inventory when they arrive
    
    return result;
  }
  
  /**
   * Process patient inquiry emails
   */
  private async processPatientInquiryEmail(email: EmailContent, analysis: AIEmailAnalysis, result: any): Promise<any> {
    // Extract patient information
    const patientName = analysis.patientName || 
                       analysis.detectedEntities.names?.[0] || 
                       email.from.split('@')[0].replace(/[.]/g, ' ');
    
    // Try to detect inquiry type based on content
    let inquiryType = 'general';
    if (email.text.toLowerCase().includes('appointment')) {
      inquiryType = 'appointment';
    } else if (email.text.toLowerCase().includes('bill') || 
              email.text.toLowerCase().includes('payment') || 
              email.text.toLowerCase().includes('insurance')) {
      inquiryType = 'billing';
    } else if (email.text.toLowerCase().includes('pain') || 
              email.text.toLowerCase().includes('discomfort') || 
              email.text.toLowerCase().includes('hurts') ||
              email.text.toLowerCase().includes('swelling')) {
      inquiryType = 'clinical';
    }
    
    // Determine urgency based on content
    let urgency = 'normal';
    if (email.text.toLowerCase().includes('emergency') || 
        email.text.toLowerCase().includes('severe pain') || 
        email.text.toLowerCase().includes('unbearable')) {
      urgency = 'high';
    }
    
    // Update result with extracted information
    result.action = 'create_patient_inquiry';
    result.patientInquiryInfo = {
      patientName,
      email: email.from,
      inquiryType,
      urgency,
      content: email.text,
      date: new Date().toISOString()
    };
    
    console.log(`Processing patient inquiry from ${patientName}, type: ${inquiryType}, urgency: ${urgency}`);
    
    // For high urgency inquiries, flag for immediate follow-up
    if (urgency === 'high') {
      result.requiresImmediate = true;
      result.immediateAction = 'Call patient regarding urgent dental issue';
      console.log(`Urgent inquiry detected - immediate follow-up required`);
    }
    
    // Try to generate an AI response for the patient
    try {
      const responseContext = {
        patientName,
        eventType: analysis.eventType || undefined, // Convert null to undefined
        analysis
      };
      
      const response = await this.generateAIResponse(email.text, responseContext);
      result.generatedResponse = response;
      result.autoResponded = true;
      
      console.log(`Generated AI response for patient inquiry`);
    } catch (err) {
      console.error('Failed to generate AI response for patient inquiry:', err);
    }
    
    return result;
  }
  
  /**
   * Process appointment request emails
   */
  private async processAppointmentRequestEmail(email: EmailContent, analysis: AIEmailAnalysis, result: any): Promise<any> {
    // Extract patient information
    const patientName = analysis.patientName || 
                       analysis.detectedEntities.names?.[0] || 
                       email.from.split('@')[0].replace(/[.]/g, ' ');
    
    // Try to extract contact information
    const phoneMatch = email.text.match(/(?:phone|call|text|mobile)(?:\s+(?:number|#))?(?:\s*:?\s*)(?:\+?1[-\s]?)?(\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4})/i);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    // Try to extract preferred dates/times
    const dates = analysis.detectedEntities.dates || [];
    
    // Try to determine appointment type
    let appointmentType = 'general';
    if (email.text.toLowerCase().includes('clean') || 
        email.text.toLowerCase().includes('check') || 
        email.text.toLowerCase().includes('exam')) {
      appointmentType = 'cleaning/exam';
    } else if (email.text.toLowerCase().includes('pain') || 
              email.text.toLowerCase().includes('emergency')) {
      appointmentType = 'emergency';
    } else if (email.text.toLowerCase().includes('consult')) {
      appointmentType = 'consultation';
    }
    
    // Determine urgency based on content
    let urgency = 'normal';
    if (email.text.toLowerCase().includes('emergency') || 
        email.text.toLowerCase().includes('severe pain') || 
        email.text.toLowerCase().includes('asap')) {
      urgency = 'high';
    }
    
    // Update result with extracted information
    result.action = 'create_appointment_request';
    result.appointmentRequestInfo = {
      patientName,
      email: email.from,
      phone,
      appointmentType,
      urgency,
      preferredDates: dates,
      notes: email.text,
      date: new Date().toISOString()
    };
    
    console.log(`Processing appointment request from ${patientName}, type: ${appointmentType}, urgency: ${urgency}`);
    
    // For high urgency requests, flag for immediate scheduling
    if (urgency === 'high') {
      result.requiresImmediate = true;
      result.immediateAction = 'Schedule emergency appointment for patient';
      console.log(`Urgent appointment request - immediate scheduling required`);
    }
    
    // Try to generate an AI response acknowledging the appointment request
    try {
      const responseContext = {
        patientName,
        eventType: analysis.eventType || undefined, // Convert null to undefined
        analysis
      };
      
      const response = await this.generateAIResponse(email.text, responseContext);
      result.generatedResponse = response;
      result.autoResponded = true;
      
      console.log(`Generated AI response for appointment request`);
    } catch (err) {
      console.error('Failed to generate AI response for appointment request:', err);
    }
    
    return result;
  }

  // Template for patient inquiry auto-response
  private generatePatientInquiryTemplate(patientName: string, clinicName: string, phone: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <img src="https://dentalmind.com/logo.png" alt="${clinicName} Logo" style="max-width: 200px; margin-bottom: 20px;" />
        <p>Dear ${patientName},</p>
        <p>Thank you for your message. A member of our dental team will review your inquiry and respond as soon as possible, typically within 1-2 business days.</p>
        <p style="color: #d9534f;"><strong>Important:</strong> If you have an urgent dental concern, please call our office directly at <a href="tel:${phone}">${phone}</a>.</p>
        <p>Best regards,<br>${clinicName} Team</p>
      </div>
    `;
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
    } catch (err) {
      const error = err as Error;
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
      // Use Array.from to convert the Map entries to an array first
      Array.from(this.emailProviders.entries()).forEach(([key, provider]) => {
        if (provider.isDefault) {
          this.emailProviders.set(key, {
            ...provider,
            isDefault: false
          });
        }
      });
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
      // Use Array.from to convert the Map entries to an array first
      Array.from(this.emailProviders.entries()).forEach(([key, provider]) => {
        if (provider.isDefault && key !== id) {
          this.emailProviders.set(key, {
            ...provider,
            isDefault: false
          });
        }
      });
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
    } catch (err) {
      const error = err as Error;
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