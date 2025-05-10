/**
 * Email AI Service
 * 
 * This service handles AI-enhanced email communication for DentaMind
 * including customized patient form emails, appointment reminders,
 * and automated follow-ups based on AI analysis of patient needs.
 */
import * as nodemailer from 'nodemailer';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { AIServiceType } from '../config/ai-keys';
import { aiRequestQueue } from './ai-request-queue';

export class EmailAIService {
  private transporter: nodemailer.Transporter;
  private emailTemplates: Map<string, string>;
  private emailTracking: Map<string, any>;
  private openAI: OpenAI;
  private scheduledEmails: Map<string, {
    id: string;
    to: string;
    subject: string;
    content: string;
    sendAt: Date;
    timeoutId?: NodeJS.Timeout;
  }>;

  constructor() {
    // Initialize email transporter using environment variables
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dentamind27@gmail.com', // Replace with environment variable in production
        pass: process.env.EMAIL_PASS
      }
    });

    // Initialize AI client using the communication-specific API key
    this.openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
    });

    // Load email templates
    this.emailTemplates = new Map();
    this.loadEmailTemplates();

    // Initialize tracking map for opened/clicked emails
    this.emailTracking = new Map();
    
    // Initialize scheduled emails map
    this.scheduledEmails = new Map();
  }

  /**
   * Load email templates
   */
  private loadEmailTemplates() {
    // Define default templates
    const defaultTemplates = {
      'appointment-reminder': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="{{practice_logo}}" alt="{{practice_name}}" style="max-height: 80px;" />
          </div>
          <h2 style="color: #28C76F;">Appointment Reminder</h2>
          <p>Dear {{patient_name}},</p>
          <p>This is a friendly reminder about your upcoming dental appointment:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Date:</strong> {{appointment_date}}</p>
            <p><strong>Time:</strong> {{appointment_time}}</p>
            <p><strong>Provider:</strong> {{provider_name}}</p>
            <p><strong>Procedure:</strong> {{procedure_description}}</p>
          </div>
          <p>Please remember to arrive 10 minutes early to complete any necessary paperwork.</p>
          <p>If you need to reschedule, please call us at {{practice_phone}} at least 24 hours in advance.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p><strong>{{practice_name}}</strong><br>
            {{practice_address}}<br>
            {{practice_phone}}<br>
            {{practice_website}}</p>
            <p style="font-size: 10px; color: #999;">Powered by DentaMind</p>
          </div>
        </div>
      `,
      'patient-form': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="{{practice_logo}}" alt="{{practice_name}}" style="max-height: 80px;" />
          </div>
          <h2 style="color: #28C76F;">Welcome to {{practice_name}}</h2>
          <p>Dear {{patient_name}},</p>
          <p>Thank you for choosing {{practice_name}} for your dental care needs. To help us serve you better, please complete our patient intake form by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{form_link}}" style="background-color: #28C76F; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Patient Form</a>
          </div>
          <p>This form will help us understand your medical history, current medications, dental concerns, and insurance information before your visit.</p>
          <p>If you have any questions or need assistance with the form, please contact our office at {{practice_phone}}.</p>
          <p>We look forward to seeing you!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p><strong>{{practice_name}}</strong><br>
            {{practice_address}}<br>
            {{practice_phone}}<br>
            {{practice_website}}</p>
            <p style="font-size: 10px; color: #999;">Powered by DentaMind</p>
          </div>
        </div>
      `,
      'treatment-followup': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="{{practice_logo}}" alt="{{practice_name}}" style="max-height: 80px;" />
          </div>
          <h2 style="color: #28C76F;">Treatment Follow-up</h2>
          <p>Dear {{patient_name}},</p>
          <p>We hope you're doing well following your recent dental treatment at {{practice_name}}.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Procedure:</strong> {{procedure_description}}</p>
            <p><strong>Date:</strong> {{procedure_date}}</p>
            <p><strong>Provider:</strong> {{provider_name}}</p>
          </div>
          <p>{{post_treatment_instructions}}</p>
          <p>If you're experiencing any unusual symptoms or have any questions about your recovery, please don't hesitate to contact our office at {{practice_phone}}.</p>
          <p>Your dental health is our top priority, and we're here to support you throughout your recovery process.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p><strong>{{practice_name}}</strong><br>
            {{practice_address}}<br>
            {{practice_phone}}<br>
            {{practice_website}}</p>
            <p style="font-size: 10px; color: #999;">Powered by DentaMind</p>
          </div>
        </div>
      `
    };

    // Load default templates into the map
    for (const [name, template] of Object.entries(defaultTemplates)) {
      this.emailTemplates.set(name, template);
    }

    // TODO: In production, load custom templates from database
    // Try to load templates from the file system if available
    try {
      const templateDir = path.join(__dirname, '../../templates/email');
      if (fs.existsSync(templateDir)) {
        const files = fs.readdirSync(templateDir);
        for (const file of files) {
          if (file.endsWith('.html')) {
            const templateName = file.replace('.html', '');
            const templateContent = fs.readFileSync(path.join(templateDir, file), 'utf8');
            this.emailTemplates.set(templateName, templateContent);
          }
        }
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  }

  /**
   * Schedule an email to be sent at a specific time
   */
  async scheduleEmail(emailData: {
    to: string;
    subject: string;
    content: string;
    templateName?: string;
    variables?: Record<string, string>;
    sendAt: Date;
  }): Promise<{ id: string; scheduledTime: Date }> {
    try {
      const now = new Date();
      const scheduledTime = emailData.sendAt;
      
      if (scheduledTime < now) {
        throw new Error('Cannot schedule email in the past');
      }
      
      // Generate unique ID
      const id = `email_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Process template if provided
      let finalContent = emailData.content;
      if (emailData.templateName && this.emailTemplates.has(emailData.templateName)) {
        finalContent = this.emailTemplates.get(emailData.templateName) || '';
        
        // Replace variables
        if (emailData.variables) {
          for (const [key, value] of Object.entries(emailData.variables)) {
            finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
          }
        }
      }
      
      // Calculate delay in milliseconds
      const delayMs = scheduledTime.getTime() - now.getTime();
      
      // Set timeout to send the email at the scheduled time
      const timeoutId = setTimeout(async () => {
        try {
          await this.sendEmail({
            to: emailData.to,
            subject: emailData.subject,
            html: finalContent
          });
          
          // Remove from scheduled emails after sending
          this.scheduledEmails.delete(id);
        } catch (error) {
          console.error('Error sending scheduled email:', error);
        }
      }, delayMs);
      
      // Store in scheduled emails map
      this.scheduledEmails.set(id, {
        id,
        to: emailData.to,
        subject: emailData.subject,
        content: finalContent,
        sendAt: scheduledTime,
        timeoutId
      });
      
      return {
        id,
        scheduledTime
      };
    } catch (error) {
      console.error('Error scheduling email:', error);
      throw error;
    }
  }

  /**
   * Get list of scheduled emails
   */
  async getScheduledEmails(): Promise<any[]> {
    const scheduledEmails = [];
    
    for (const [id, emailData] of this.scheduledEmails.entries()) {
      scheduledEmails.push({
        id: emailData.id,
        to: emailData.to,
        subject: emailData.subject,
        scheduledTime: emailData.sendAt
      });
    }
    
    return scheduledEmails;
  }

  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(id: string): Promise<boolean> {
    const scheduledEmail = this.scheduledEmails.get(id);
    
    if (!scheduledEmail) {
      return false;
    }
    
    if (scheduledEmail.timeoutId) {
      clearTimeout(scheduledEmail.timeoutId);
    }
    
    this.scheduledEmails.delete(id);
    return true;
  }

  /**
   * Send an email using the configured transporter
   */
  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail({
        from: '"DentaMind System" <dentamind27@gmail.com>',
        ...mailOptions
      }, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  }

  /**
   * Send a patient form via email
   */
  async sendPatientForm(options: {
    patientEmail: string;
    patientName: string;
    formToken: string;
    practiceInfo?: {
      name: string;
      logo?: string;
      address: string;
      phone: string;
      website?: string;
      tagline?: string;
    };
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Use default practice info if not provided
      const practiceInfo = options.practiceInfo || {
        name: 'DentaMind Dental Practice',
        logo: 'https://example.com/logo.png',
        address: '123 Dental Street, Tooth City, TC 12345',
        phone: '(555) 123-4567',
        website: 'https://dentamind.dental',
        tagline: 'Quality dental care for the whole family'
      };
      
      // Generate form link (using domain from request in a production environment)
      const formLink = `https://dentamind.replit.app/form/${options.formToken}`;
      
      // Prepare template variables
      const variables = {
        patient_name: options.patientName,
        form_link: formLink,
        practice_name: practiceInfo.name,
        practice_logo: practiceInfo.logo || 'https://example.com/logo.png',
        practice_address: practiceInfo.address,
        practice_phone: practiceInfo.phone,
        practice_website: practiceInfo.website || '',
        practice_tagline: practiceInfo.tagline || ''
      };
      
      // Send email using the patient-form template
      await this.sendEmail({
        to: options.patientEmail,
        subject: `Welcome to ${practiceInfo.name} - Patient Information Form`,
        html: await this.renderTemplate('patient-form', variables)
      });
      
      return {
        success: true,
        message: `Patient form sent successfully to ${options.patientEmail}`
      };
    } catch (error) {
      console.error('Error sending patient form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error sending patient form'
      };
    }
  }

  /**
   * Generate personalized email content using AI
   */
  async generateEmailContent(options: {
    patientName: string;
    emailType: 'welcome' | 'reminder' | 'follow-up' | 'recall' | 'billing';
    patientHistory?: any;
    appointmentDetails?: any;
    treatmentDetails?: any;
  }): Promise<string> {
    try {
      // Create a prompt for the AI
      const prompt = `
        Create a personalized email for a dental patient.
        
        Patient name: ${options.patientName}
        Email type: ${options.emailType}
        ${options.appointmentDetails ? `Appointment: ${JSON.stringify(options.appointmentDetails)}` : ''}
        ${options.treatmentDetails ? `Treatment: ${JSON.stringify(options.treatmentDetails)}` : ''}
        
        The email should be warm, professional, and concise. Include a clear call to action. Format as HTML.
      `;
      
      // Generate content using AI
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.PATIENT_COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: 'You are an AI assistant for a dental practice, specialized in creating personalized email communications for patients.'
              },
              { role: 'user', content: prompt }
            ]
          });
          
          return completion.choices[0].message.content || '';
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error generating email content:', error);
      
      // If AI fails, return a basic template
      return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${options.patientName},</h2>
          <p>Thank you for choosing our dental practice. We're here to provide you with excellent dental care.</p>
          <p>Please contact our office if you have any questions or need assistance.</p>
          <p>Best regards,<br>Your Dental Team</p>
        </div>
      `;
    }
  }

  /**
   * Analyze an incoming email using AI
   */
  async analyzeEmail(emailContent: string): Promise<{
    intent: string;
    priority: 'high' | 'medium' | 'low';
    suggestedResponse?: string;
    requestedAppointment?: boolean;
    extractedData?: any;
  }> {
    try {
      // Create a prompt for the AI
      const prompt = `
        Analyze the following email received by a dental practice:
        
        ${emailContent.slice(0, 1500)} // Limiting to 1500 chars to avoid token limits
        
        Identify:
        1. The primary intent (e.g., appointment request, question, complaint, feedback)
        2. Priority level (high, medium, low)
        3. Whether an appointment is being requested
        4. Any important data that should be extracted (dates, times, contact info)
        5. A suggested brief response
        
        Format your response as a JSON object with these fields: intent, priority, requestedAppointment, extractedData, suggestedResponse
      `;
      
      // Analyze using AI
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.PATIENT_COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: 'You are an AI assistant for a dental practice. Your job is to analyze incoming emails and extract meaningful information to help staff respond appropriately.'
              },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          });
          
          return completion.choices[0].message.content || '';
        }
      );
      
      // Parse the JSON response
      const analysis = JSON.parse(response);
      
      return {
        intent: analysis.intent || 'unknown',
        priority: analysis.priority || 'medium',
        suggestedResponse: analysis.suggestedResponse,
        requestedAppointment: !!analysis.requestedAppointment,
        extractedData: analysis.extractedData || {}
      };
    } catch (error) {
      console.error('Error analyzing email:', error);
      
      // Return default analysis if AI fails
      return {
        intent: 'unknown',
        priority: 'medium',
        requestedAppointment: false
      };
    }
  }

  /**
   * Send an appointment reminder email
   */
  async sendAppointmentReminder(options: {
    patientEmail: string;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    providerName: string;
    procedureDescription: string;
    practiceInfo?: any;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Use default practice info if not provided
      const practiceInfo = options.practiceInfo || {
        name: 'DentaMind Dental Practice',
        logo: 'https://example.com/logo.png',
        address: '123 Dental Street, Tooth City, TC 12345',
        phone: '(555) 123-4567',
        website: 'https://dentamind.dental'
      };
      
      // Prepare template variables
      const variables = {
        patient_name: options.patientName,
        appointment_date: options.appointmentDate,
        appointment_time: options.appointmentTime,
        provider_name: options.providerName,
        procedure_description: options.procedureDescription,
        practice_name: practiceInfo.name,
        practice_logo: practiceInfo.logo || 'https://example.com/logo.png',
        practice_address: practiceInfo.address,
        practice_phone: practiceInfo.phone,
        practice_website: practiceInfo.website || ''
      };
      
      // Send email using the appointment-reminder template
      await this.sendEmail({
        to: options.patientEmail,
        subject: `Appointment Reminder: ${options.appointmentDate} at ${options.appointmentTime}`,
        html: await this.renderTemplate('appointment-reminder', variables)
      });
      
      return {
        success: true,
        message: `Appointment reminder sent successfully to ${options.patientEmail}`
      };
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error sending appointment reminder'
      };
    }
  }

  /**
   * Render an email template with variables
   */
  private async renderTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
    try {
      // Get the template content
      let template = this.emailTemplates.get(templateName);
      
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }
      
      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      }
      
      return template;
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  /**
   * Send a notification when a patient submits a form
   */
  async sendFormSubmissionNotification(options: {
    staffEmail: string;
    patientName: string;
    formType: string;
    submissionDate: string;
    practiceInfo?: any;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Use default practice info if not provided
      const practiceInfo = options.practiceInfo || {
        name: 'DentaMind Dental Practice',
        logo: 'https://example.com/logo.png'
      };
      
      // Create email content
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${practiceInfo.logo}" alt="${practiceInfo.name}" style="max-height: 80px;" />
          </div>
          <h2 style="color: #28C76F;">Form Submission Notification</h2>
          <p>A patient has submitted a form in DentaMind:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Patient:</strong> ${options.patientName}</p>
            <p><strong>Form Type:</strong> ${options.formType}</p>
            <p><strong>Submission Date:</strong> ${options.submissionDate}</p>
          </div>
          <p>Please log into DentaMind to review the submission.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p><strong>${practiceInfo.name}</strong></p>
            <p style="font-size: 10px; color: #999;">Powered by DentaMind</p>
          </div>
        </div>
      `;
      
      // Send the notification email
      await this.sendEmail({
        to: options.staffEmail,
        subject: `Form Submission: ${options.patientName} - ${options.formType}`,
        html
      });
      
      return {
        success: true,
        message: `Form submission notification sent successfully to ${options.staffEmail}`
      };
    } catch (error) {
      console.error('Error sending form submission notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error sending notification'
      };
    }
  }
}

// Create a singleton instance
export const emailAIService = new EmailAIService();