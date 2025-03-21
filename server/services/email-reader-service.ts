/**
 * Email Reader Service
 * 
 * This service connects to a dental practice's email account,
 * reads messages, and processes them using AI for automated responses,
 * appointment scheduling, and information extraction.
 */

import { simpleParser } from 'mailparser';
import { ImapFlow } from 'imapflow';
import { OpenAI } from 'openai';
import * as nodemailer from 'nodemailer';
import NodeCache from 'node-cache';
import { AIServiceType } from './ai-service-types';
import { aiRequestQueue } from './ai-request-queue';

// Cache processed emails to avoid duplicate processing
const processedEmailCache = new NodeCache({ stdTTL: 86400 * 7 }); // Cache for 7 days

interface EmailConnectionConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  practiceId: string;
}

interface EmailProcessingResult {
  messageId: string;
  subject: string;
  from: string;
  sentDate: Date;
  category: 'appointment' | 'inquiry' | 'clinical' | 'billing' | 'other';
  priority: 'high' | 'medium' | 'low';
  requiresResponse: boolean;
  requiredAction?: string;
  summary: string;
  suggestedResponse?: string;
  extractedData?: Record<string, any>;
  aiConfidenceScore: number;
}

export class EmailReaderService {
  private openAI: OpenAI;
  private connectionConfigs: Map<string, EmailConnectionConfig> = new Map();
  private clients: Map<string, ImapFlow> = new Map();
  private isProcessingEmails: Map<string, boolean> = new Map();
  private processingSince: Map<string, Date> = new Map();
  private lastEmailCheck: Map<string, Date> = new Map();
  private emailProcessingInterval: NodeJS.Timeout | null = null;
  private emailCheckIntervalMinutes = 5;

  constructor() {
    // Initialize OpenAI for email processing
    this.openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
    });

    // Start the email checking interval
    this.startEmailProcessingInterval();
  }

  /**
   * Start the interval to check for new emails periodically
   */
  private startEmailProcessingInterval() {
    if (this.emailProcessingInterval) {
      clearInterval(this.emailProcessingInterval);
    }

    this.emailProcessingInterval = setInterval(() => {
      this.checkAllPracticeEmails();
    }, this.emailCheckIntervalMinutes * 60 * 1000);
  }

  /**
   * Check emails for all configured practices
   */
  private async checkAllPracticeEmails() {
    for (const [practiceId, config] of this.connectionConfigs.entries()) {
      try {
        // Don't start a new check if one is already in progress
        if (this.isProcessingEmails.get(practiceId)) {
          continue;
        }

        await this.processNewEmails(practiceId);
      } catch (error) {
        console.error(`Error checking emails for practice ${practiceId}:`, error);
      }
    }
  }

  /**
   * Configure a new practice email account for monitoring
   */
  async configurePracticeEmail(practiceId: string, config: EmailConnectionConfig): Promise<boolean> {
    try {
      // Store the configuration
      this.connectionConfigs.set(practiceId, {
        ...config,
        practiceId
      });

      // Test the connection
      const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.tls,
        auth: {
          user: config.user,
          pass: config.password
        }
      });

      try {
        await client.connect();
        await client.logout();
        console.log(`Successfully configured email for practice ${practiceId}`);
        return true;
      } catch (error) {
        console.error(`Failed to connect to email for practice ${practiceId}:`, error);
        this.connectionConfigs.delete(practiceId);
        return false;
      }
    } catch (error) {
      console.error(`Error configuring practice email ${practiceId}:`, error);
      return false;
    }
  }

  /**
   * Process new emails for a specific practice
   */
  async processNewEmails(practiceId: string): Promise<EmailProcessingResult[]> {
    const config = this.connectionConfigs.get(practiceId);
    if (!config) {
      throw new Error(`No email configuration found for practice ${practiceId}`);
    }

    // Mark that we're processing emails
    this.isProcessingEmails.set(practiceId, true);
    this.processingSince.set(practiceId, new Date());

    let client: ImapFlow | null = null;
    const results: EmailProcessingResult[] = [];

    try {
      // Create a new connection
      client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.tls,
        auth: {
          user: config.user,
          pass: config.password
        }
      });

      // Connect to the server
      await client.connect();

      // Get the last check time or use a default (24 hours ago)
      const lastCheck = this.lastEmailCheck.get(practiceId) || new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Open the mailbox
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        // Search for unread messages since the last check
        const messages = await client.search({
          since: lastCheck,
          seen: false
        });

        // Process each message
        for (const messageId of messages) {
          // Skip if we've already processed this message
          const cacheKey = `${practiceId}:${messageId}`;
          if (processedEmailCache.has(cacheKey)) {
            continue;
          }

          // Fetch the message
          const message = await client.fetchOne(messageId, { source: true });
          
          // Parse the email
          const parsed = await simpleParser(message.source);
          
          // Process the email with AI
          const result = await this.analyzeEmailWithAI(parsed, practiceId);
          
          // Mark as processed
          processedEmailCache.set(cacheKey, true);
          
          // Add to results
          results.push(result);
          
          // Handle the email based on analysis
          await this.handleEmailBasedOnAnalysis(result, practiceId);
        }
      } finally {
        // Release the mailbox lock
        lock.release();
      }

      // Update the last check time
      this.lastEmailCheck.set(practiceId, new Date());

      // Logout and close the connection
      await client.logout();

      return results;
    } catch (error) {
      console.error(`Error processing emails for practice ${practiceId}:`, error);
      throw error;
    } finally {
      // Mark that we're done processing
      this.isProcessingEmails.set(practiceId, false);
      
      // Clean up the client if it exists
      if (client) {
        try {
          await client.close();
        } catch (error) {
          console.error(`Error closing email client for practice ${practiceId}:`, error);
        }
      }
    }
  }

  /**
   * Analyze an email with AI to extract information and determine next steps
   */
  private async analyzeEmailWithAI(email: any, practiceId: string): Promise<EmailProcessingResult> {
    const subject = email.subject || '(No Subject)';
    const from = email.from?.text || '(No Sender)';
    const text = email.text || '';
    const html = email.html || '';
    const messageId = email.messageId || `generated-${Date.now()}`;
    const sentDate = email.date || new Date();

    // Default result in case AI processing fails
    const defaultResult: EmailProcessingResult = {
      messageId,
      subject,
      from,
      sentDate,
      category: 'other',
      priority: 'medium',
      requiresResponse: true,
      summary: `Email from ${from} with subject "${subject}"`,
      aiConfidenceScore: 0
    };

    try {
      // Queue the AI request
      const aiResult = await aiRequestQueue.enqueueRequest<any>(
        AIServiceType.COMMUNICATION,
        async () => {
          return this.openAI.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant for a dental practice. Analyze the following email and extract key information. 
                Categorize the email as 'appointment' (scheduling, cancellation, etc.), 'inquiry' (general questions), 
                'clinical' (patient symptoms, concerns), 'billing' (payments, insurance), or 'other'.
                Determine priority: 'high' (urgent issues, pain, emergencies), 'medium' (needs attention but not urgent), or 'low' (general information).
                Determine if a response is needed, and if so, suggest a brief, professional response.
                Extract any relevant data such as patient names, requested dates/times, symptoms mentioned, etc.
                Return a JSON object with the following structure:
                {
                  "category": string,
                  "priority": string,
                  "requiresResponse": boolean,
                  "requiredAction": string (optional),
                  "summary": string,
                  "suggestedResponse": string (optional),
                  "extractedData": object (optional),
                  "aiConfidenceScore": number (0-1)
                }`
              },
              {
                role: "user",
                content: `Email Subject: ${subject}\nFrom: ${from}\nDate: ${sentDate}\n\nContent:\n${text}`
              }
            ],
            response_format: { type: "json_object" }
          });
        },
        60000
      );

      // Parse the AI response
      if (aiResult?.choices?.[0]?.message?.content) {
        try {
          const parsedResult = JSON.parse(aiResult.choices[0].message.content);
          return {
            messageId,
            subject,
            from,
            sentDate,
            category: parsedResult.category || 'other',
            priority: parsedResult.priority || 'medium',
            requiresResponse: parsedResult.requiresResponse !== undefined ? parsedResult.requiresResponse : true,
            requiredAction: parsedResult.requiredAction,
            summary: parsedResult.summary || defaultResult.summary,
            suggestedResponse: parsedResult.suggestedResponse,
            extractedData: parsedResult.extractedData,
            aiConfidenceScore: parsedResult.aiConfidenceScore || 0.7
          };
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          return defaultResult;
        }
      }

      return defaultResult;
    } catch (error) {
      console.error('Error analyzing email with AI:', error);
      return defaultResult;
    }
  }

  /**
   * Handle an email based on the AI analysis
   */
  private async handleEmailBasedOnAnalysis(result: EmailProcessingResult, practiceId: string) {
    // Add to notifications in the system
    await this.createEmailNotification(result, practiceId);
    
    // Handle based on category and priority
    switch (result.category) {
      case 'appointment':
        // Handle appointment requests
        if (result.extractedData?.appointmentRequest) {
          await this.handleAppointmentRequest(result, practiceId);
        }
        break;
        
      case 'clinical':
        // Prioritize clinical concerns, especially high priority ones
        if (result.priority === 'high') {
          await this.handleUrgentClinicalConcern(result, practiceId);
        }
        break;
        
      case 'inquiry':
        // Handle standard inquiries
        if (result.requiresResponse && result.suggestedResponse) {
          // Could auto-respond or queue for review based on confidence
          await this.queueResponseForReview(result, practiceId);
        }
        break;
        
      case 'billing':
        // Process billing inquiries
        await this.handleBillingInquiry(result, practiceId);
        break;
        
      default:
        // Default handling for other types
        await this.queueForManualReview(result, practiceId);
    }
  }

  /**
   * Create a notification in the system for the email
   */
  private async createEmailNotification(result: EmailProcessingResult, practiceId: string) {
    // Implementation would connect to the notifications system
    console.log(`[Email Notification] Practice ${practiceId}: ${result.priority} priority email - ${result.summary}`);
    
    // TODO: Connect to notification service
    // Actual implementation would create a notification in the DentaMind system
  }

  /**
   * Handle an appointment request extracted from an email
   */
  private async handleAppointmentRequest(result: EmailProcessingResult, practiceId: string) {
    // Extract appointment details
    const appointmentData = result.extractedData?.appointmentRequest;
    if (!appointmentData) return;
    
    // Log for demonstration purposes
    console.log(`[Appointment Request] Practice ${practiceId}: Request for ${appointmentData.date} at ${appointmentData.time}`);
    
    // TODO: Connect to appointment scheduling system
    // Actual implementation would check availability and potentially schedule
  }

  /**
   * Handle an urgent clinical concern
   */
  private async handleUrgentClinicalConcern(result: EmailProcessingResult, practiceId: string) {
    // Log for demonstration purposes
    console.log(`[URGENT CLINICAL] Practice ${practiceId}: ${result.summary}`);
    
    // TODO: Add to urgent notifications, potentially send SMS to provider
    // Actual implementation would alert the appropriate provider
  }

  /**
   * Queue a response for review before sending
   */
  private async queueResponseForReview(result: EmailProcessingResult, practiceId: string) {
    // Log for demonstration purposes
    console.log(`[Response Queue] Practice ${practiceId}: Response queued for review`);
    
    // TODO: Add to response queue in the UI
    // Actual implementation would add to a review queue in the DentaMind dashboard
  }

  /**
   * Handle a billing inquiry
   */
  private async handleBillingInquiry(result: EmailProcessingResult, practiceId: string) {
    // Log for demonstration purposes
    console.log(`[Billing Inquiry] Practice ${practiceId}: ${result.summary}`);
    
    // TODO: Route to billing department or financial dashboard
    // Actual implementation would route to the appropriate staff
  }

  /**
   * Queue an email for manual review
   */
  private async queueForManualReview(result: EmailProcessingResult, practiceId: string) {
    // Log for demonstration purposes
    console.log(`[Manual Review] Practice ${practiceId}: ${result.summary}`);
    
    // TODO: Add to general review queue
    // Actual implementation would add to the inbox in the DentaMind dashboard
  }

  /**
   * Get the status of email processing for a practice
   */
  getEmailProcessingStatus(practiceId: string) {
    return {
      isProcessing: this.isProcessingEmails.get(practiceId) || false,
      processingSince: this.processingSince.get(practiceId),
      lastCheck: this.lastEmailCheck.get(practiceId),
      configured: this.connectionConfigs.has(practiceId)
    };
  }

  /**
   * Manually trigger email checking for a practice
   */
  async manuallyCheckEmails(practiceId: string): Promise<EmailProcessingResult[]> {
    return this.processNewEmails(practiceId);
  }

  /**
   * Update the email checking interval
   */
  setEmailCheckInterval(minutes: number) {
    if (minutes < 1) minutes = 1; // Minimum 1 minute
    if (minutes > 60) minutes = 60; // Maximum 1 hour
    
    this.emailCheckIntervalMinutes = minutes;
    this.startEmailProcessingInterval(); // Restart with new interval
    
    return this.emailCheckIntervalMinutes;
  }
}

// Export a singleton instance
export const emailReaderService = new EmailReaderService();