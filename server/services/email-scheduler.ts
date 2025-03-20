/**
 * Email Scheduler Service
 * 
 * This service handles email scheduling functionality for DentaMind:
 * - Time-based email triggers for optimal patient engagement
 * - Staggered email sending to prevent inbox overload
 * - Support for multiple practice locations
 * - Analytics and tracking for email engagement
 */

import { v4 as uuidv4 } from 'uuid';
import { EmailAIService } from './email-ai-service';
import { z } from 'zod';

// Schema for email tracking
export const emailTrackingSchema = z.object({
  enableOpenTracking: z.boolean().default(true),
  enableLinkTracking: z.boolean().default(true),
  unsubscribed: z.boolean().default(false),
  trackingId: z.string().optional(),
  sentTime: z.string().optional(),
  deliveredTime: z.string().optional(),
  openedTime: z.string().optional(),
  clickedTime: z.string().optional()
});

export type EmailTracking = z.infer<typeof emailTrackingSchema>;

// Schema for email scheduling
export const emailScheduleSchema = z.object({
  id: z.string().optional(),
  recipientEmail: z.string().email(),
  recipientName: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  html: z.string().optional(),
  scheduledTime: z.string(), // ISO string
  optimizeDeliveryTime: z.boolean().default(false),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  category: z.enum([
    'appointment_reminder',
    'treatment_followup',
    'billing_reminder',
    'lab_update',
    'patient_education',
    'recall',
    'marketing',
    'misc'
  ]),
  patientId: z.number().optional(),
  providerName: z.string().optional(),
  locationId: z.number().optional(),
  templateId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  tracking: emailTrackingSchema.optional(),
  status: z.enum([
    'scheduled',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'failed',
    'cancelled'
  ]).default('scheduled')
});

// Type for email schedule
export type EmailSchedule = z.infer<typeof emailScheduleSchema>;

/**
 * Service to handle email scheduling and optimization
 */
export class EmailSchedulerService {
  private emailService: EmailAIService;
  private scheduledEmails: Map<string, EmailSchedule> = new Map();
  private schedulerIntervalId: NodeJS.Timeout | null = null;
  private schedulerIntervalMs = 60000; // Check every minute
  
  // Optimal time windows for sending emails (8-10 AM, 5-7 PM)
  private optimalTimeWindows = [
    { start: 8, end: 10 }, // 8-10 AM
    { start: 17, end: 19 } // 5-7 PM
  ];
  
  // Maximum emails to send per hour per recipient to prevent inbox overload
  private maxEmailsPerHourPerRecipient = 2;
  
  constructor(emailService: EmailAIService) {
    this.emailService = emailService;
  }
  
  /**
   * Initialize the scheduler service
   */
  async initialize(): Promise<boolean> {
    try {
      // Load any previously scheduled emails from storage
      await this.loadScheduledEmails();
      
      // Start the scheduler
      this.startScheduler();
      
      return true;
    } catch (err) {
      console.error('Failed to initialize email scheduler:', err);
      return false;
    }
  }
  
  /**
   * Schedule an email to be sent
   */
  async scheduleEmail(emailData: Omit<EmailSchedule, 'id' | 'status'>): Promise<EmailSchedule> {
    try {
      const id = uuidv4();
      
      // If optimize delivery time is enabled, find the best time
      let scheduledTime = emailData.scheduledTime;
      if (emailData.optimizeDeliveryTime) {
        scheduledTime = this.calculateOptimalDeliveryTime(
          emailData.recipientEmail,
          new Date(emailData.scheduledTime)
        ).toISOString();
      }
      
      // Create a properly typed tracking object
      const trackingData: EmailTracking = {
        trackingId: uuidv4(),
        enableOpenTracking: emailData.tracking?.enableOpenTracking ?? true,
        enableLinkTracking: emailData.tracking?.enableLinkTracking ?? true,
        unsubscribed: emailData.tracking?.unsubscribed ?? false,
        sentTime: emailData.tracking?.sentTime,
        deliveredTime: emailData.tracking?.deliveredTime,
        openedTime: emailData.tracking?.openedTime,
        clickedTime: emailData.tracking?.clickedTime
      };
      
      const newSchedule: EmailSchedule = {
        ...emailData,
        id,
        scheduledTime,
        status: 'scheduled',
        tracking: trackingData
      };
      
      // Save to memory and persist
      this.scheduledEmails.set(id, newSchedule);
      await this.persistScheduledEmails();
      
      console.log(`Email scheduled: ID ${id}, Subject: ${newSchedule.subject}, Time: ${scheduledTime}`);
      
      return newSchedule;
    } catch (err) {
      console.error('Error scheduling email:', err);
      throw new Error('Failed to schedule email');
    }
  }
  
  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(id: string): Promise<boolean> {
    if (!this.scheduledEmails.has(id)) {
      return false;
    }
    
    const email = this.scheduledEmails.get(id);
    if (email && email.status === 'scheduled') {
      email.status = 'cancelled';
      this.scheduledEmails.set(id, email);
      await this.persistScheduledEmails();
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a scheduled email by ID
   */
  getScheduledEmail(id: string): EmailSchedule | undefined {
    return this.scheduledEmails.get(id);
  }
  
  /**
   * Get all scheduled emails
   */
  getAllScheduledEmails(): EmailSchedule[] {
    return Array.from(this.scheduledEmails.values());
  }
  
  /**
   * Get scheduled emails for a patient
   */
  getPatientScheduledEmails(patientId: number): EmailSchedule[] {
    return Array.from(this.scheduledEmails.values())
      .filter(email => email.patientId === patientId);
  }
  
  /**
   * Get scheduled emails for a specific time window
   */
  getScheduledEmailsInTimeWindow(startTime: Date, endTime: Date): EmailSchedule[] {
    return Array.from(this.scheduledEmails.values())
      .filter(email => {
        const emailTime = new Date(email.scheduledTime);
        return emailTime >= startTime && emailTime <= endTime;
      });
  }
  
  /**
   * Calculate the optimal delivery time for an email
   * within the time windows defined for best engagement
   */
  private calculateOptimalDeliveryTime(recipientEmail: string, baseTime: Date): Date {
    // Clone the date to avoid modifying the original
    const optimalTime = new Date(baseTime);
    
    // Get current hour
    const currentHour = optimalTime.getHours();
    
    // Find the next optimal time window
    let nextOptimalWindow = this.optimalTimeWindows[0];
    for (const window of this.optimalTimeWindows) {
      if (currentHour < window.start) {
        nextOptimalWindow = window;
        break;
      }
    }
    
    // Set the hour to the middle of the optimal window
    const optimalHour = Math.floor((nextOptimalWindow.start + nextOptimalWindow.end) / 2);
    optimalTime.setHours(optimalHour);
    
    // Check if we need to stagger based on recipient's email load
    const recipientEmails = this.getRecentEmailsForRecipient(recipientEmail, optimalTime);
    if (recipientEmails.length >= this.maxEmailsPerHourPerRecipient) {
      // Stagger by moving to the next optimal window or to the next day
      if (nextOptimalWindow === this.optimalTimeWindows[0]) {
        // Move to afternoon window
        optimalTime.setHours(this.optimalTimeWindows[1].start + 1);
      } else {
        // Move to next day morning window
        optimalTime.setDate(optimalTime.getDate() + 1);
        optimalTime.setHours(this.optimalTimeWindows[0].start + 1);
      }
    }
    
    return optimalTime;
  }
  
  /**
   * Get recent emails scheduled for a recipient in a time window
   */
  private getRecentEmailsForRecipient(recipientEmail: string, baseTime: Date): EmailSchedule[] {
    // Calculate the time window (1 hour before and after the base time)
    const startTime = new Date(baseTime);
    startTime.setHours(startTime.getHours() - 1);
    
    const endTime = new Date(baseTime);
    endTime.setHours(endTime.getHours() + 1);
    
    // Find emails in this time window for this recipient
    return Array.from(this.scheduledEmails.values())
      .filter(email => {
        if (email.recipientEmail !== recipientEmail) return false;
        if (email.status !== 'scheduled') return false;
        
        const emailTime = new Date(email.scheduledTime);
        return emailTime >= startTime && emailTime <= endTime;
      });
  }
  
  /**
   * Start the scheduler to check for emails that need to be sent
   */
  private startScheduler() {
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
    }
    
    this.schedulerIntervalId = setInterval(() => {
      this.processScheduledEmails();
    }, this.schedulerIntervalMs);
    
    console.log('Email scheduler started');
  }
  
  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
      console.log('Email scheduler stopped');
    }
  }
  
  /**
   * Process scheduled emails and send any that are due
   */
  private async processScheduledEmails() {
    const now = new Date();
    const dueEmails: EmailSchedule[] = [];
    
    // Find emails that are due to be sent
    for (const [id, email] of this.scheduledEmails.entries()) {
      if (email.status !== 'scheduled') continue;
      
      const scheduledTime = new Date(email.scheduledTime);
      if (scheduledTime <= now) {
        dueEmails.push(email);
      }
    }
    
    // Process due emails
    for (const email of dueEmails) {
      try {
        await this.sendScheduledEmail(email);
      } catch (err) {
        console.error(`Failed to send scheduled email ${email.id}:`, err);
        // Update status to failed
        const failedEmail = this.scheduledEmails.get(email.id!);
        if (failedEmail) {
          failedEmail.status = 'failed';
          this.scheduledEmails.set(email.id!, failedEmail);
        }
      }
    }
    
    // Persist changes if any emails were processed
    if (dueEmails.length > 0) {
      await this.persistScheduledEmails();
    }
  }
  
  /**
   * Send a scheduled email
   */
  private async sendScheduledEmail(email: EmailSchedule): Promise<boolean> {
    try {
      // Get the email object ready for sending
      const emailToSend = {
        to: email.recipientEmail,
        subject: email.subject,
        text: email.body,
        html: email.html,
        trackingId: email.tracking?.trackingId,
        metadata: {
          ...email.metadata,
          patientId: email.patientId,
          providerName: email.providerName,
          locationId: email.locationId,
          category: email.category,
          trackingEnabled: email.tracking?.enableOpenTracking || email.tracking?.enableLinkTracking
        }
      };
      
      // Send the email using the email service
      // For now, we'll just simulate this
      console.log(`[SIMULATION] Sending scheduled email: ${email.id} to ${email.recipientEmail}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Category: ${email.category}`);
      
      // Update the email status
      const updatedEmail = this.scheduledEmails.get(email.id!);
      if (updatedEmail && updatedEmail.tracking) {
        updatedEmail.status = 'sent';
        
        // Create a properly typed tracking object with all required fields
        const updatedTracking: EmailTracking = {
          trackingId: updatedEmail.tracking.trackingId || uuidv4(),
          enableOpenTracking: updatedEmail.tracking.enableOpenTracking ?? true,
          enableLinkTracking: updatedEmail.tracking.enableLinkTracking ?? true,
          unsubscribed: updatedEmail.tracking.unsubscribed ?? false,
          sentTime: new Date().toISOString(),
          deliveredTime: updatedEmail.tracking.deliveredTime,
          openedTime: updatedEmail.tracking.openedTime,
          clickedTime: updatedEmail.tracking.clickedTime
        };
        
        updatedEmail.tracking = updatedTracking;
        this.scheduledEmails.set(email.id!, updatedEmail);
      }
      
      return true;
    } catch (err) {
      console.error('Error sending scheduled email:', err);
      throw new Error('Failed to send scheduled email');
    }
  }
  
  /**
   * Load scheduled emails from persistent storage
   */
  private async loadScheduledEmails() {
    // In a real implementation, this would load from a database
    // For now, we'll just initialize with an empty map
    this.scheduledEmails = new Map();
    
    console.log('Loaded scheduled emails from storage');
  }
  
  /**
   * Persist scheduled emails to storage
   */
  private async persistScheduledEmails() {
    // In a real implementation, this would save to a database
    // For now, we'll just log
    console.log(`Persisted ${this.scheduledEmails.size} scheduled emails`);
    return true;
  }
  
  /**
   * Record email engagement (opens, clicks)
   */
  async recordEmailEngagement(trackingId: string, type: 'delivered' | 'opened' | 'clicked'): Promise<boolean> {
    // Find the email by tracking ID
    const emailEntry = Array.from(this.scheduledEmails.entries())
      .find(([_, email]) => email.tracking?.trackingId === trackingId);
    
    if (!emailEntry) {
      return false;
    }
    
    const [id, email] = emailEntry;
    
    // Create a copy of the email
    const updatedEmail = { ...email };
    
    // Make sure tracking is properly typed
    if (!updatedEmail.tracking) {
      updatedEmail.tracking = {
        trackingId: trackingId,
        enableOpenTracking: true,
        enableLinkTracking: true,
        unsubscribed: false
      };
    }
    
    const now = new Date().toISOString();
    
    // Create a properly typed tracking object
    const updatedTracking: EmailTracking = {
      trackingId: updatedEmail.tracking.trackingId || trackingId,
      enableOpenTracking: updatedEmail.tracking.enableOpenTracking ?? true,
      enableLinkTracking: updatedEmail.tracking.enableLinkTracking ?? true,
      unsubscribed: updatedEmail.tracking.unsubscribed ?? false,
      sentTime: updatedEmail.tracking.sentTime,
      deliveredTime: updatedEmail.tracking.deliveredTime,
      openedTime: updatedEmail.tracking.openedTime,
      clickedTime: updatedEmail.tracking.clickedTime
    };
    
    // Update the appropriate timestamp
    switch (type) {
      case 'delivered':
        updatedTracking.deliveredTime = now;
        updatedEmail.status = 'delivered';
        break;
      case 'opened':
        updatedTracking.openedTime = now;
        updatedEmail.status = 'opened';
        break;
      case 'clicked':
        updatedTracking.clickedTime = now;
        updatedEmail.status = 'clicked';
        break;
    }
    
    // Assign the updated tracking object
    updatedEmail.tracking = updatedTracking;
    
    // Update in memory and persist
    this.scheduledEmails.set(id, updatedEmail);
    await this.persistScheduledEmails();
    
    console.log(`Recorded ${type} event for email ${id} with tracking ID ${trackingId}`);
    
    return true;
  }
  
  /**
   * Generate analytics for email campaigns
   */
  getEmailAnalytics(startDate?: Date, endDate?: Date, category?: string): any {
    const filteredEmails = Array.from(this.scheduledEmails.values())
      .filter(email => {
        // Filter by date range if specified
        if (startDate || endDate) {
          const emailDate = new Date(email.scheduledTime);
          if (startDate && emailDate < startDate) return false;
          if (endDate && emailDate > endDate) return false;
        }
        
        // Filter by category if specified
        if (category && email.category !== category) return false;
        
        return true;
      });
    
    // Calculate delivery rate
    const totalSent = filteredEmails.filter(e => e.status !== 'scheduled' && e.status !== 'cancelled').length;
    const delivered = filteredEmails.filter(e => 
      e.status === 'delivered' || e.status === 'opened' || e.status === 'clicked'
    ).length;
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    
    // Calculate open rate
    const opened = filteredEmails.filter(e => e.status === 'opened' || e.status === 'clicked').length;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    
    // Calculate click rate
    const clicked = filteredEmails.filter(e => e.status === 'clicked').length;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    
    // Group by category
    const categoryCounts: Record<string, number> = {};
    filteredEmails.forEach(email => {
      categoryCounts[email.category] = (categoryCounts[email.category] || 0) + 1;
    });
    
    return {
      totalEmails: filteredEmails.length,
      totalSent,
      delivered,
      opened,
      clicked,
      failed: filteredEmails.filter(e => e.status === 'failed').length,
      cancelled: filteredEmails.filter(e => e.status === 'cancelled').length,
      scheduled: filteredEmails.filter(e => e.status === 'scheduled').length,
      deliveryRate: deliveryRate.toFixed(2) + '%',
      openRate: openRate.toFixed(2) + '%',
      clickRate: clickRate.toFixed(2) + '%',
      categoryCounts,
      timeRange: {
        start: startDate?.toISOString(),
        end: endDate?.toISOString()
      }
    };
  }
}

// Create and export a singleton instance
let emailSchedulerService: EmailSchedulerService;

export function getEmailSchedulerService(emailService: EmailAIService): EmailSchedulerService {
  if (!emailSchedulerService) {
    emailSchedulerService = new EmailSchedulerService(emailService);
  }
  return emailSchedulerService;
}