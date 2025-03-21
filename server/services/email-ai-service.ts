import nodemailer from 'nodemailer';
import { OpenAI } from 'openai';
import { AIServiceType } from './ai-service-types';
import { aiRequestQueue } from './ai-request-queue';
import { v4 as uuidv4 } from 'uuid';

/**
 * Email AI Service
 * 
 * This service handles AI-enhanced email communication for DentaMind
 * including customized patient form emails, appointment reminders,
 * and automated follow-ups based on AI analysis of patient needs.
 */
export class EmailAIService {
  private transporter: nodemailer.Transporter;
  private emailTemplates: Map<string, string>;
  private emailTracking: Map<string, any>;
  private openAI: OpenAI;
  
  constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'dentamind27@gmail.com',
        pass: process.env.EMAIL_PASS || ''
      }
    });
    
    // Initialize email templates
    this.emailTemplates = new Map();
    this.loadEmailTemplates();
    
    // Initialize email tracking
    this.emailTracking = new Map();
    
    // Initialize OpenAI client for email content generation
    this.openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
    });
  }
  
  /**
   * Load email templates
   */
  private loadEmailTemplates() {
    // Patient intake form template
    this.emailTemplates.set('patient-form', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="{{logoUrl}}" alt="DentaMind Logo" style="max-width: 150px;">
          <h2 style="color: #28C76F;">DentaMind - Patient Form</h2>
        </div>
        
        <p>Dear {{patientName}},</p>
        
        <p>Thank you for choosing DentaMind for your dental care needs. To provide you with the best possible care, we need you to complete the following form:</p>
        
        <p><strong>{{formTypeName}}</strong></p>
        
        {{#if customMessage}}
        <p>{{customMessage}}</p>
        {{/if}}
        
        {{#if appointmentDate}}
        <p>This information is needed for your upcoming appointment on <strong>{{appointmentDate}}</strong>.</p>
        {{/if}}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{formUrl}}" style="background-color: #28C76F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Form</a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us at {{practiceEmail}} or call our office.</p>
        
        <p>Thank you for your cooperation!</p>
        
        <p>Best regards,<br>
        The DentaMind Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This email contains a secure link to complete your patient form. Your privacy is important to us, and all information is transmitted securely and protected in accordance with HIPAA regulations.</p>
        </div>
      </div>
    `);
    
    // Add more templates as needed
  }
  
  /**
   * Schedule an email to be sent at a specific time
   */
  async scheduleEmail(emailData: {
    to: string;
    subject: string;
    body: string;
    scheduledTime?: string;
    patientId?: number;
    senderId?: number;
    templateId?: string;
    variables?: Record<string, string>;
    priority?: 'low' | 'medium' | 'high';
    category?: 'appointment' | 'reminder' | 'follow-up' | 'marketing' | 'billing' | 'general';
  }): Promise<{ success: boolean; id: string; error?: string }> {
    try {
      const id = uuidv4();
      const scheduledTime = emailData.scheduledTime ? new Date(emailData.scheduledTime) : new Date();
      
      // Store scheduled email
      this.emailTracking.set(id, {
        id,
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        scheduledTime,
        status: 'scheduled',
        patientId: emailData.patientId,
        senderId: emailData.senderId,
        category: emailData.category || 'general',
        createdAt: new Date()
      });
      
      // If scheduled for now, send immediately
      if (scheduledTime <= new Date()) {
        await this.sendEmail({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.body
        });
        
        this.emailTracking.set(id, {
          ...this.emailTracking.get(id),
          status: 'sent',
          sentAt: new Date()
        });
      }
      
      return { success: true, id };
    } catch (error) {
      console.error('Error scheduling email:', error);
      return { 
        success: false, 
        id: '', 
        error: error instanceof Error ? error.message : 'Failed to schedule email' 
      };
    }
  }
  
  /**
   * Get list of scheduled emails
   */
  async getScheduledEmails(): Promise<any[]> {
    return Array.from(this.emailTracking.values());
  }
  
  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(id: string): Promise<boolean> {
    if (this.emailTracking.has(id)) {
      const emailData = this.emailTracking.get(id);
      
      if (emailData.status === 'scheduled') {
        this.emailTracking.set(id, {
          ...emailData,
          status: 'canceled',
          canceledAt: new Date()
        });
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Send an email using the configured transporter
   */
  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<any> {
    try {
      // Check if email sending is disabled (for testing)
      if (process.env.NODE_ENV === 'test' || process.env.DISABLE_EMAILS === 'true') {
        console.log('Email sending disabled. Would have sent:', mailOptions);
        return { accepted: [mailOptions.to], rejected: [] };
      }
      
      return await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'DentaMind <dentamind27@gmail.com>',
        ...mailOptions
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
  
  /**
   * Send a patient form via email
   */
  async sendPatientForm(options: {
    to: string;
    patientName: string;
    formType: string;
    formUrl: string;
    customMessage?: string;
    appointmentDate?: string;
    sendCopy?: boolean;
    practiceEmail?: string;
  }): Promise<{
    success: boolean;
    trackingId?: string;
    error?: string;
  }> {
    try {
      // Get the form template
      const template = this.emailTemplates.get('patient-form');
      if (!template) {
        throw new Error('Patient form email template not found');
      }
      
      // Map form type to user-friendly name
      const formTypeNames: Record<string, string> = {
        'intake': 'Patient Intake Form',
        'medical-history': 'Medical History Form',
        'consent': 'Treatment Consent Form',
        'hipaa': 'HIPAA Consent Form',
        'financial': 'Financial Agreement Form'
      };
      
      // Format the email content from the template
      let emailContent = template;
      
      // Replace template variables
      emailContent = emailContent.replace(/{{patientName}}/g, options.patientName);
      emailContent = emailContent.replace(/{{formTypeName}}/g, formTypeNames[options.formType] || 'Patient Form');
      emailContent = emailContent.replace(/{{formUrl}}/g, options.formUrl);
      emailContent = emailContent.replace(/{{logoUrl}}/g, 'https://dentamind.replit.app/assets/dentamind-logo.png');
      emailContent = emailContent.replace(/{{practiceEmail}}/g, options.practiceEmail || 'dentamind27@gmail.com');
      
      // Replace conditional blocks
      if (options.customMessage) {
        emailContent = emailContent.replace(/{{#if customMessage}}(.*?){{\/if}}/s, options.customMessage);
      } else {
        emailContent = emailContent.replace(/{{#if customMessage}}(.*?){{\/if}}/s, '');
      }
      
      if (options.appointmentDate) {
        emailContent = emailContent.replace(
          /{{#if appointmentDate}}(.*?){{\/if}}/s,
          `This information is needed for your upcoming appointment on <strong>${options.appointmentDate}</strong>.`
        );
      } else {
        emailContent = emailContent.replace(/{{#if appointmentDate}}(.*?){{\/if}}/s, '');
      }
      
      // Create the email subject based on form type
      const subject = `DentaMind - ${formTypeNames[options.formType] || 'Patient Form'}`;
      
      // Send the email
      await this.sendEmail({
        to: options.to,
        subject,
        html: emailContent
      });
      
      // If sendCopy is true, send a copy to the practice email
      if (options.sendCopy && options.practiceEmail) {
        await this.sendEmail({
          to: options.practiceEmail,
          subject: `COPY: ${subject} - Sent to ${options.patientName}`,
          html: emailContent,
          text: `This is a copy of the email sent to ${options.patientName} (${options.to})`
        });
      }
      
      // Generate tracking ID and store email data
      const trackingId = uuidv4();
      this.emailTracking.set(trackingId, {
        id: trackingId,
        to: options.to,
        subject,
        formType: options.formType,
        formUrl: options.formUrl,
        patientName: options.patientName,
        sentAt: new Date(),
        status: 'sent'
      });
      
      return { success: true, trackingId };
    } catch (error) {
      console.error('Error sending patient form email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send patient form email' 
      };
    }
  }
  
  /**
   * Generate personalized email content using AI
   */
  async generateEmailContent(options: {
    purpose: 'reminder' | 'follow-up' | 'welcome' | 'educational';
    patientName: string;
    patientHistory?: string;
    appointmentType?: string;
    appointmentDate?: string;
    lastVisitDate?: string;
    topics?: string[];
    tone?: 'formal' | 'friendly' | 'professional';
  }): Promise<string> {
    try {
      // Create prompt based on purpose and provided information
      let prompt = `Write a personalized email for a dental patient named ${options.patientName}.`;
      
      // Add context based on purpose
      switch (options.purpose) {
        case 'reminder':
          prompt += ` This is an appointment reminder for ${options.appointmentType || 'their dental appointment'} on ${options.appointmentDate || 'the scheduled date'}.`;
          break;
        case 'follow-up':
          prompt += ` This is a follow-up email after their recent dental visit${options.lastVisitDate ? ` on ${options.lastVisitDate}` : ''}.`;
          break;
        case 'welcome':
          prompt += ` This is a welcome email for a new patient who has just registered with our practice.`;
          break;
        case 'educational':
          prompt += ` This is an educational email about ${options.topics?.join(', ') || 'dental health topics'}.`;
          break;
      }
      
      // Add patient history if provided
      if (options.patientHistory) {
        prompt += ` Patient history context: ${options.patientHistory}`;
      }
      
      // Specify tone
      prompt += ` Use a ${options.tone || 'professional'} tone. Format the email in HTML with appropriate styling.`;
      
      // Queue the AI request
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an AI assistant specializing in dental practice communication. Your job is to create personalized patient emails that are engaging, informative, and follow healthcare communication best practices. Include appropriate HTML formatting.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1000
          });
          
          return completion.choices[0]?.message?.content || '';
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error generating email content with AI:', error);
      
      // Fallback content if AI generation fails
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello ${options.patientName},</h2>
          <p>Thank you for choosing DentaMind for your dental care needs.</p>
          <p>We look forward to seeing you soon.</p>
          <p>Best regards,<br>The DentaMind Team</p>
        </div>
      `;
    }
  }
  
  /**
   * Analyze an incoming email using AI
   */
  async analyzeEmail(emailContent: string): Promise<{
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    topics: string[];
    actionItems: string[];
  }> {
    try {
      // Create prompt for email analysis
      const prompt = `Analyze the following dental practice email and provide a structured analysis:

Email content:
${emailContent}

Provide your analysis in the following JSON format:
{
  "summary": "Brief 1-2 sentence summary of the email",
  "sentiment": "positive/neutral/negative",
  "urgency": "low/medium/high",
  "topics": ["topic1", "topic2"],
  "actionItems": ["action1", "action2"]
}`;
      
      // Queue the AI request
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an AI assistant specializing in email analysis for a dental practice. Provide concise, accurate analysis in the requested JSON format.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          });
          
          return completion.choices[0]?.message?.content || '';
        }
      );
      
      // Parse the JSON response
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing email with AI:', error);
      
      // Return default analysis if AI fails
      return {
        summary: 'Unable to analyze email content.',
        sentiment: 'neutral',
        urgency: 'medium',
        topics: ['general'],
        actionItems: ['Review email manually']
      };
    }
  }
}