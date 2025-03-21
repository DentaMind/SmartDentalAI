/**
 * Email Reader Service
 * 
 * This service connects to a dental practice's email account,
 * reads messages, and processes them using AI for automated responses,
 * appointment scheduling, and information extraction.
 */
import { OpenAI } from 'openai';
import { parseEmail } from 'mailparser';
import { ImapFlow, ImapFlowOptions } from 'imapflow';
import * as fs from 'fs';
import * as path from 'path';
import NodeCache from 'node-cache';
import { AIServiceType } from '../config/ai-keys';
import { aiRequestQueue } from './ai-request-queue';

// Define email connection configuration
interface EmailConnectionConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  folderNames?: string[];
  practiceId?: string;
}

// Processing settings
interface EmailProcessingSettings {
  autoRespond: boolean;
  categorizeEmails: boolean;
  extractAppointmentRequests: boolean;
  notifyStaff: boolean;
  maxEmailsToProcess: number;
}

// Result of email processing
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

// Paged list of processed emails
interface ProcessedEmailsList {
  items: EmailProcessingResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Status response
interface EmailProcessingStatus {
  isConfigured: boolean;
  isProcessing: boolean;
  status: string;
  stats: {
    totalProcessed: number;
    appointmentRequestsFound: number;
    lastProcessedTime: string;
  };
}

/**
 * Service to manage email reading and AI-powered processing
 */
export class EmailReaderService {
  private openAI: OpenAI;
  private connectionConfigs: Map<string, EmailConnectionConfig> = new Map();
  private processingSettings: Map<string, EmailProcessingSettings> = new Map();
  private clients: Map<string, ImapFlow> = new Map();
  private isProcessingEmails: Map<string, boolean> = new Map();
  private processingSince: Map<string, Date> = new Map();
  private lastEmailCheck: Map<string, Date> = new Map();
  private emailProcessingInterval: NodeJS.Timeout | null = null;
  private emailCheckIntervalMinutes = 5;
  
  // Cache for storing processed emails to avoid reprocessing
  private processedEmailCache: NodeCache;
  
  // In-memory storage for processed emails (would be replaced with database in production)
  private processedEmails: Map<string, EmailProcessingResult[]> = new Map();
  
  // Processing statistics
  private processingStats: Map<string, {
    totalProcessed: number;
    appointmentRequestsFound: number;
    lastProcessedTime: string;
  }> = new Map();

  constructor() {
    // Initialize OpenAI client using the communication API key
    this.openAI = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY_COMMUNICATION
    });
    
    // Initialize cache with 7-day TTL
    this.processedEmailCache = new NodeCache({ 
      stdTTL: 60 * 60 * 24 * 7, // 7 days in seconds
      checkperiod: 600 // Check for expired items every 10 minutes
    });
    
    // Start the email checking interval
    this.startEmailProcessingInterval();
  }

  /**
   * Configure an email account for a practice
   */
  public async configureEmailAccount(config: EmailConnectionConfig): Promise<{ success: boolean, message: string }> {
    try {
      const practiceId = config.practiceId || 'default';
      
      // Test the connection first
      const testResult = await this.testConnection(config);
      if (!testResult.success) {
        return testResult;
      }
      
      // Store the configuration
      this.connectionConfigs.set(practiceId, config);
      
      // Set default processing settings if none exist
      if (!this.processingSettings.has(practiceId)) {
        this.processingSettings.set(practiceId, {
          autoRespond: false,
          categorizeEmails: true,
          extractAppointmentRequests: true,
          notifyStaff: true,
          maxEmailsToProcess: 50
        });
      }
      
      // Initialize stats object if it doesn't exist
      if (!this.processingStats.has(practiceId)) {
        this.processingStats.set(practiceId, {
          totalProcessed: 0,
          appointmentRequestsFound: 0,
          lastProcessedTime: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        message: 'Email account configured successfully'
      };
    } catch (error) {
      console.error('Error configuring email account:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error configuring email account'
      };
    }
  }

  /**
   * Update email processing settings
   */
  public async updateProcessingSettings(
    practiceId: string, 
    settings: EmailProcessingSettings
  ): Promise<{ success: boolean, message: string }> {
    try {
      this.processingSettings.set(practiceId, settings);
      return {
        success: true,
        message: 'Email processing settings updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update settings'
      };
    }
  }

  /**
   * Test an email connection
   */
  public async testConnection(config: EmailConnectionConfig): Promise<{ success: boolean, message: string, details?: any }> {
    let client: ImapFlow | null = null;
    
    try {
      const imapOptions: ImapFlowOptions = {
        host: config.host,
        port: config.port,
        secure: config.tls,
        auth: {
          user: config.user,
          pass: config.password
        },
        logger: false
      };
      
      // Create the client
      client = new ImapFlow(imapOptions);
      
      // Try to connect and login
      await client.connect();
      
      // Get mailbox list to verify everything is working
      const mailboxes = [];
      for await (const mailbox of client.mailboxList()) {
        mailboxes.push(mailbox);
      }
      
      await client.logout();
      
      return {
        success: true,
        message: 'Successfully connected to email server',
        details: {
          availableMailboxes: mailboxes.map(box => box.path)
        }
      };
    } catch (error) {
      let errorMessage = 'Failed to connect to email server';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Provide more user-friendly error messages based on common issues
      if (errorMessage.includes('auth')) {
        errorMessage = 'Authentication failed. Please check your username and password.';
      } else if (errorMessage.includes('connect')) {
        errorMessage = 'Connection failed. Please check your server address and port.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Connection timed out. The server might be down or unreachable.';
      } else if (errorMessage.includes('certificate')) {
        errorMessage = 'SSL/TLS certificate validation failed. The server\'s certificate might be invalid.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      // Ensure we close the connection if it's still open
      if (client) {
        try {
          await client.logout();
        } catch (e) {
          // Ignore errors on logout
        }
      }
    }
  }

  /**
   * Start the interval to check for new emails periodically
   */
  private startEmailProcessingInterval() {
    // Clear any existing interval
    if (this.emailProcessingInterval) {
      clearInterval(this.emailProcessingInterval);
    }
    
    // Check for new emails every few minutes
    this.emailProcessingInterval = setInterval(async () => {
      await this.checkAllPracticeEmails();
    }, this.emailCheckIntervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Check emails for all configured practices
   */
  private async checkAllPracticeEmails() {
    for (const [practiceId, config] of this.connectionConfigs.entries()) {
      // Only check if processing is enabled for this practice
      if (this.isProcessingEmails.get(practiceId)) {
        try {
          await this.processNewEmails(practiceId);
        } catch (error) {
          console.error(`Error processing emails for practice ${practiceId}:`, error);
        }
      }
    }
  }

  /**
   * Start processing emails for a practice
   */
  public async startProcessingEmails(practiceId: string): Promise<{ success: boolean, message: string, details?: any }> {
    try {
      if (!this.connectionConfigs.has(practiceId)) {
        return {
          success: false,
          message: 'No email configuration found for this practice'
        };
      }
      
      if (this.isProcessingEmails.get(practiceId)) {
        return {
          success: true,
          message: 'Email processing is already active'
        };
      }
      
      // Mark as processing
      this.isProcessingEmails.set(practiceId, true);
      this.processingSince.set(practiceId, new Date());
      
      // Process emails immediately the first time
      await this.processNewEmails(practiceId);
      
      return {
        success: true,
        message: 'Email processing started successfully',
        details: {
          startedAt: this.processingSince.get(practiceId)?.toISOString()
        }
      };
    } catch (error) {
      this.isProcessingEmails.set(practiceId, false);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start email processing'
      };
    }
  }

  /**
   * Stop processing emails for a practice
   */
  public async stopProcessingEmails(practiceId: string): Promise<{ success: boolean, message: string }> {
    try {
      if (!this.isProcessingEmails.get(practiceId)) {
        return {
          success: true,
          message: 'Email processing is already stopped'
        };
      }
      
      // Mark as not processing
      this.isProcessingEmails.set(practiceId, false);
      
      return {
        success: true,
        message: 'Email processing stopped successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to stop email processing'
      };
    }
  }

  /**
   * Get the current status of email processing
   */
  public async getEmailProcessingStatus(practiceId: string): Promise<EmailProcessingStatus> {
    try {
      return {
        isConfigured: this.connectionConfigs.has(practiceId),
        isProcessing: !!this.isProcessingEmails.get(practiceId),
        status: this.isProcessingEmails.get(practiceId) 
          ? 'active' 
          : this.connectionConfigs.has(practiceId) ? 'configured' : 'not configured',
        stats: this.processingStats.get(practiceId) || {
          totalProcessed: 0,
          appointmentRequestsFound: 0,
          lastProcessedTime: ''
        }
      };
    } catch (error) {
      console.error('Error getting email processing status:', error);
      return {
        isConfigured: false,
        isProcessing: false,
        status: 'error',
        stats: {
          totalProcessed: 0,
          appointmentRequestsFound: 0,
          lastProcessedTime: ''
        }
      };
    }
  }

  /**
   * Get list of processed emails
   */
  public async getProcessedEmails(
    practiceId: string,
    page: number = 1,
    pageSize: number = 20,
    category?: string
  ): Promise<ProcessedEmailsList> {
    try {
      // Get all processed emails for this practice
      const allEmails = this.processedEmails.get(practiceId) || [];
      
      // Filter by category if provided
      const filteredEmails = category 
        ? allEmails.filter(email => email.category === category)
        : allEmails;
      
      // Sort by date (newest first)
      const sortedEmails = [...filteredEmails].sort((a, b) => 
        new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
      );
      
      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedEmails = sortedEmails.slice(startIndex, endIndex);
      
      return {
        items: paginatedEmails,
        totalCount: sortedEmails.length,
        page,
        pageSize,
        totalPages: Math.ceil(sortedEmails.length / pageSize)
      };
    } catch (error) {
      console.error('Error getting processed emails:', error);
      return {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      };
    }
  }

  /**
   * Process new emails for a practice
   */
  private async processNewEmails(practiceId: string): Promise<void> {
    if (!this.isProcessingEmails.get(practiceId)) {
      return;
    }
    
    const config = this.connectionConfigs.get(practiceId);
    if (!config) {
      throw new Error('No email configuration found for this practice');
    }
    
    const settings = this.processingSettings.get(practiceId) || {
      autoRespond: false,
      categorizeEmails: true,
      extractAppointmentRequests: true,
      notifyStaff: true,
      maxEmailsToProcess: 50
    };
    
    let client: ImapFlow | null = null;
    
    try {
      // Record the last check time
      this.lastEmailCheck.set(practiceId, new Date());
      
      // Create IMAP connection options
      const imapOptions: ImapFlowOptions = {
        host: config.host,
        port: config.port,
        secure: config.tls,
        auth: {
          user: config.user,
          pass: config.password
        },
        logger: false
      };
      
      // Create the client
      client = new ImapFlow(imapOptions);
      
      // Connect to the server
      await client.connect();
      
      // Process each folder (or just INBOX if no folders specified)
      const folders = config.folderNames || ['INBOX'];
      
      for (const folder of folders) {
        await this.processFolder(client, folder, practiceId, settings);
      }
      
      // Update the stats
      const currentStats = this.processingStats.get(practiceId) || {
        totalProcessed: 0,
        appointmentRequestsFound: 0,
        lastProcessedTime: new Date().toISOString()
      };
      
      currentStats.lastProcessedTime = new Date().toISOString();
      this.processingStats.set(practiceId, currentStats);
      
    } catch (error) {
      console.error(`Error processing emails for practice ${practiceId}:`, error);
      throw error;
    } finally {
      // Ensure we close the connection
      if (client) {
        try {
          await client.logout();
        } catch (e) {
          // Ignore errors on logout
        }
      }
    }
  }

  /**
   * Process a specific email folder
   */
  private async processFolder(
    client: ImapFlow,
    folderName: string,
    practiceId: string,
    settings: EmailProcessingSettings
  ): Promise<void> {
    try {
      // Open the mailbox
      await client.mailboxOpen(folderName);
      
      try {
        // Get messages from the last 24 hours that haven't been processed yet
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Create a search query for recent messages
        const searchQuery = { since: yesterday };
        let count = 0;
        
        // Fetch messages using the fetch method with proper options
        for await (const message of client.fetch(searchQuery, { source: true })) {
          // Stop if we've reached the maximum number of emails to process
          if (count >= settings.maxEmailsToProcess) {
            break;
          }
          
          // Check if we've already processed this message
          const cacheKey = `${practiceId}_${message.uid}`;
          if (this.processedEmailCache.has(cacheKey)) {
            continue;
          }
          
          try {
            // Parse the email if source is available
            if (message.source) {
              const source = message.source.toString();
              const parsedEmail = await parseEmail(source);
              
              // Process the email content
              const emailText = parsedEmail.text || '';
              const emailHtml = parsedEmail.html || '';
              const subject = parsedEmail.subject || '';
              const from = parsedEmail.from?.text || '';
              const sentDate = parsedEmail.date || new Date();
              
              // Use AI to analyze the email content
              const analysis = await this.analyzeEmailContent(
                emailText,
                subject,
                from
              );
              
              // Create a processing result
              const result: EmailProcessingResult = {
                messageId: message.uid.toString(),
                subject,
                from,
                sentDate,
                category: analysis.category as any,
                priority: analysis.priority as any,
                requiresResponse: analysis.requiresResponse,
                requiredAction: analysis.requiredAction,
                summary: analysis.summary,
                suggestedResponse: analysis.suggestedResponse,
                extractedData: analysis.extractedData,
                aiConfidenceScore: analysis.confidenceScore
              };
              
              // Store the result
              const practiceEmails = this.processedEmails.get(practiceId) || [];
              practiceEmails.push(result);
              this.processedEmails.set(practiceId, practiceEmails);
              
              // Add to cache to avoid reprocessing
              this.processedEmailCache.set(cacheKey, true);
              
              // Update stats
              const stats = this.processingStats.get(practiceId) || {
                totalProcessed: 0,
                appointmentRequestsFound: 0,
                lastProcessedTime: new Date().toISOString()
              };
              
              stats.totalProcessed++;
              
              // Check if this is an appointment request
              if (result.category === 'appointment') {
                stats.appointmentRequestsFound++;
              }
              
              this.processingStats.set(practiceId, stats);
              
              count++;
            }
          } catch (emailError) {
            console.error('Error processing individual email:', emailError);
            // Continue to the next email
          }
        }
        
      } finally {
        // Close the mailbox when done
        await client.mailboxClose();
      }
    } catch (error) {
      console.error(`Error processing folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Analyze email content using AI
   */
  private async analyzeEmailContent(
    emailText: string,
    subject: string,
    from: string
  ): Promise<{
    category: string;
    priority: string;
    requiresResponse: boolean;
    requiredAction?: string;
    summary: string;
    suggestedResponse?: string;
    extractedData?: any;
    confidenceScore: number;
  }> {
    try {
      // Create a prompt for the AI
      const prompt = `
        Analyze the following email received by a dental practice:
        
        SUBJECT: ${subject}
        FROM: ${from}
        CONTENT:
        ${emailText.slice(0, 1500)} // Limiting to 1500 chars to avoid token limits
        
        Determine:
        1. Category (one of: appointment, inquiry, clinical, billing, other)
        2. Priority (one of: high, medium, low)
        3. Whether it requires a response (true/false)
        4. A brief summary (max 100 words)
        5. Any required action
        6. A suggested response (if appropriate)
        7. Any appointment requests or relevant data
        
        Format your response as a JSON object with these fields: category, priority, requiresResponse, summary, requiredAction, suggestedResponse, extractedData, confidenceScore (0-1)
      `;
      
      // Send the prompt to the AI
      const response = await aiRequestQueue.enqueueRequest<string>(
        AIServiceType.PATIENT_COMMUNICATION,
        async () => {
          const completion = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: 'You are an AI assistant for a dental practice. Your job is to analyze incoming emails and extract meaningful information to help staff prioritize and respond appropriately.'
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
        category: analysis.category || 'other',
        priority: analysis.priority || 'medium',
        requiresResponse: !!analysis.requiresResponse,
        requiredAction: analysis.requiredAction,
        summary: analysis.summary || 'No summary available',
        suggestedResponse: analysis.suggestedResponse,
        extractedData: analysis.extractedData,
        confidenceScore: analysis.confidenceScore || 0.5
      };
    } catch (error) {
      console.error('Error analyzing email content:', error);
      
      // Return a default analysis if AI fails
      return {
        category: 'other',
        priority: 'medium',
        requiresResponse: true,
        summary: 'Failed to analyze this email. Please review manually.',
        confidenceScore: 0
      };
    }
  }
}