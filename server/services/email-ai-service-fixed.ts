import nodemailer from 'nodemailer';
import { OpenAI } from 'openai';
import { AIServiceType } from '../config/ai-keys';
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
    // Initialize the email templates
    this.emailTemplates = new Map();
    this.loadEmailTemplates();
    
    // Initialize email tracking
    this.emailTracking = new Map();
    
    // Initialize OpenAI client using the communication API key
    this.openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
    });
    
    // Initialize nodemailer transporter with email service credentials
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dentamind27@gmail.com', // Use practice email
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  /**
   * Load email templates
   */
  private loadEmailTemplates() {
    // Default patient form template
    this.emailTemplates.set('patientForm', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="{{practiceLogoUrl}}" alt="{{practiceName}}" style="max-width: 200px;">
          <h2 style="color: {{primaryColor}};">{{practiceName}}</h2>
        </div>
        
        <p>Dear {{patientName}},</p>
        
        <p>Thank you for choosing {{practiceName}} for your dental care. To help us provide you with the best possible care, please complete our patient intake form by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{formUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Patient Form</a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us at {{practicePhone}}.</p>
        
        <p>Best regards,<br>
        The team at {{practiceName}}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
          <p>{{practiceAddress}}<br>
          Phone: {{practicePhone}}<br>
          {{practiceWebsite}}</p>
          
          <p style="font-size: 10px;">Powered by DentaMind</p>
        </div>
      </div>
    `);
    
    // Add more templates as needed
    this.emailTemplates.set('appointmentReminder', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="{{practiceLogoUrl}}" alt="{{practiceName}}" style="max-width: 200px;">
          <h2 style="color: {{primaryColor}};">Appointment Reminder</h2>
        </div>
        
        <p>Dear {{patientName}},</p>
        
        <p>This is a friendly reminder about your upcoming dental appointment:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid {{primaryColor}}; margin: 20px 0;">
          <p><strong>Date:</strong> {{appointmentDate}}</p>
          <p><strong>Time:</strong> {{appointmentTime}}</p>
          <p><strong>Provider:</strong> {{providerName}}</p>
          <p><strong>Location:</strong> {{practiceAddress}}</p>
        </div>
        
        <p>If you need to reschedule, please call us at {{practicePhone}} at least 24 hours before your appointment.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{calendarUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Add to Calendar</a>
        </div>
        
        <p>Best regards,<br>
        The team at {{practiceName}}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
          <p>{{practiceAddress}}<br>
          Phone: {{practicePhone}}<br>
          {{practiceWebsite}}</p>
          
          <p style="font-size: 10px;">Powered by DentaMind</p>
        </div>
      </div>
    `);
  }
  
  /**
   * Schedule an email to be sent at a specific time
   */
  async scheduleEmail(emailData: {
    to: string;
    subject: string;
    template: string;
    variables: Record<string, string>;
    sendAt: Date;
  }): Promise<{ id: string; scheduledTime: Date }> {
    const id = uuidv4();
    
    // Store the scheduled email
    this.emailTracking.set(id, {
      ...emailData,
      status: 'scheduled',
      id
    });
    
    // In a production system, this would be handled by a job queue
    const now = new Date();
    const delay = emailData.sendAt.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        this.sendEmail({
          to: emailData.to,
          subject: emailData.subject,
          html: this.applyTemplate(emailData.template, emailData.variables)
        });
        
        // Update tracking
        const tracked = this.emailTracking.get(id);
        if (tracked) {
          this.emailTracking.set(id, {
            ...tracked,
            status: 'sent',
            sentAt: new Date()
          });
        }
      }, delay);
    } else {
      // If the scheduled time is in the past, send immediately
      await this.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        html: this.applyTemplate(emailData.template, emailData.variables)
      });
      
      // Update tracking
      this.emailTracking.set(id, {
        ...emailData,
        status: 'sent',
        sentAt: new Date(),
        id
      });
    }
    
    return { id, scheduledTime: emailData.sendAt };
  }
  
  /**
   * Get list of scheduled emails
   */
  async getScheduledEmails(): Promise<any[]> {
    const scheduled: any[] = [];
    
    this.emailTracking.forEach((email) => {
      if (email.status === 'scheduled') {
        scheduled.push(email);
      }
    });
    
    return scheduled;
  }
  
  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(id: string): Promise<boolean> {
    const email = this.emailTracking.get(id);
    
    if (email && email.status === 'scheduled') {
      this.emailTracking.set(id, {
        ...email,
        status: 'cancelled',
        cancelledAt: new Date()
      });
      return true;
    }
    
    return false;
  }
  
  /**
   * Send an email using the configured transporter
   */
  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<any> {
    try {
      // Ensure we have the required environment variables
      if (!process.env.EMAIL_PASS) {
        console.error('EMAIL_PASS environment variable is not set');
        throw new Error('Email service is not properly configured');
      }
      
      return await this.transporter.sendMail({
        from: '"DentaMind" <dentamind27@gmail.com>',
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
    patientEmail: string;
    patientName: string;
    formToken: string;
    practiceInfo: {
      name: string;
      address: string;
      phone: string;
      website: string;
      logoUrl: string;
      primaryColor: string;
    };
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Generate the personalized form URL
      const formUrl = `${process.env.REPLIT_DOMAINS || 'http://localhost:3000'}/form/${options.formToken}`;
      
      // Use the patient form template
      const template = this.emailTemplates.get('patientForm') || '';
      
      // Apply template variables
      const html = this.applyTemplate(template, {
        patientName: options.patientName,
        formUrl,
        practiceName: options.practiceInfo.name,
        practiceAddress: options.practiceInfo.address,
        practicePhone: options.practiceInfo.phone,
        practiceWebsite: options.practiceInfo.website,
        practiceLogoUrl: options.practiceInfo.logoUrl || '',
        primaryColor: options.practiceInfo.primaryColor || '#28C76F'
      });
      
      // AI-enhance the subject line
      const enhancedSubject = await this.generateEmailContent({
        template: 'subject',
        practiceInfo: options.practiceInfo,
        patientInfo: { name: options.patientName, email: options.patientEmail },
        purpose: 'patient_form',
        additionalContext: 'This is an initial patient intake form for a new patient.'
      });
      
      // Send the email
      const result = await this.sendEmail({
        to: options.patientEmail,
        subject: enhancedSubject || `Complete Your Patient Form for ${options.practiceInfo.name}`,
        html
      });
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending patient form email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending form email' 
      };
    }
  }
  
  /**
   * Generate personalized email content using AI
   */
  async generateEmailContent(options: {
    template: string;
    practiceInfo: {
      name: string;
      address: string;
      phone: string;
      website: string;
    };
    patientInfo: {
      name: string;
      email: string;
    };
    purpose: 'patient_form' | 'appointment_reminder' | 'treatment_followup' | 'billing_notice';
    additionalContext?: string;
  }): Promise<string> {
    try {
      // Construct a prompt based on the type of content needed
      let prompt = `Generate a personalized ${options.template} for an email to be sent to dental patient ${options.patientInfo.name}. `;
      
      switch (options.purpose) {
        case 'patient_form':
          prompt += `The email is asking the patient to complete a dental intake form for ${options.practiceInfo.name}. `;
          break;
        case 'appointment_reminder':
          prompt += `The email is a reminder about an upcoming dental appointment at ${options.practiceInfo.name}. `;
          break;
        case 'treatment_followup':
          prompt += `The email is a follow-up after a dental treatment at ${options.practiceInfo.name}. `;
          break;
        case 'billing_notice':
          prompt += `The email is a billing notice from ${options.practiceInfo.name}. `;
          break;
      }
      
      if (options.additionalContext) {
        prompt += `Additional context: ${options.additionalContext} `;
      }
      
      prompt += `The content should be professional, friendly, and specific to dental care. `;
      
      if (options.template === 'subject') {
        prompt += `Generate only the subject line for the email, which should be 5-10 words.`;
      } else {
        prompt += `Generate an email body that is about 3-4 paragraphs long. Include a friendly opening and a professional closing.`;
      }
      
      // Queue the AI request
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.PATIENT_COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are an AI assistant specializing in dental practice communication. Your job is to create personalized patient emails that are engaging, informative, and follow healthcare communication best practices. Include appropriate HTML formatting.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: options.template === 'subject' ? 50 : 500
          });
          
          return completion.choices[0].message.content || '';
        }
      );
      
      return response.trim();
    } catch (error) {
      console.error('Error generating AI email content:', error);
      
      // Provide fallback content based on template type
      if (options.template === 'subject') {
        return `Complete Your Patient Form for ${options.practiceInfo.name}`;
      } else {
        return `Dear ${options.patientInfo.name},\n\nThank you for choosing ${options.practiceInfo.name} for your dental care. We look forward to serving you.\n\nBest regards,\nThe team at ${options.practiceInfo.name}`;
      }
    }
  }
  
  /**
   * Analyze an incoming email using AI
   */
  async analyzeEmail(emailContent: string): Promise<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    summary: string;
    suggestedResponse?: string;
  }> {
    try {
      // Create a prompt for email analysis
      const prompt = `
        Analyze the following email received by a dental practice and extract key information:
        
        EMAIL CONTENT:
        ${emailContent}
        
        Please provide:
        1. Category (appointment, clinical question, billing, general inquiry, or other)
        2. Priority (high, medium, low)
        3. Brief summary (max 100 words)
        4. Suggested response (if applicable)
        
        Format your response as JSON with these keys: category, priority, summary, suggestedResponse
      `;
      
      // Queue the AI request
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.PATIENT_COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: 'You are an AI assistant for a dental practice. You analyze incoming emails and provide structured information to help staff prioritize and respond efficiently.'
              },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          });
          
          return completion.choices[0].message.content || '';
        }
      );
      
      // Parse the response
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing email:', error);
      
      // Return a basic fallback analysis
      return {
        category: 'other',
        priority: 'medium',
        summary: 'Unable to analyze email content. Please review manually.'
      };
    }
  }
  
  /**
   * Apply template variables to an email template
   */
  private applyTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    
    // Replace each variable in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    return result;
  }
}
