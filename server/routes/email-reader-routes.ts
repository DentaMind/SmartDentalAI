/**
 * Email Reader Routes
 * 
 * These routes allow dental practices to configure their email integration
 * with DentaMind, enabling AI-powered email processing of patient communications.
 */

import express from 'express';
import { z } from 'zod';
import { emailReaderService } from '../services/email-reader-service';

const router = express.Router();

// Schema for configuring email reader
const emailConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  user: z.string().email(),
  password: z.string(),
  tls: z.boolean().default(true),
});

// Schema for manual email check
const manualCheckSchema = z.object({
  practiceId: z.string()
});

// Configure email account for a practice
router.post('/configure', async (req, res) => {
  try {
    // Verify user is authenticated and authorized
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Validate request body
    const result = emailConfigSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid configuration', 
        errors: result.error.errors 
      });
    }
    
    // Get practice ID (in a real app, would come from the user's association)
    // For now, we'll use the user ID as a placeholder for practiceId
    const practiceId = req.session.userId.toString();
    
    // Configure email reader
    const success = await emailReaderService.configurePracticeEmail(practiceId, {
      ...result.data,
      practiceId
    });
    
    if (success) {
      return res.json({ 
        success: true, 
        message: 'Email configuration successful',
        status: emailReaderService.getEmailProcessingStatus(practiceId) 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration failed' 
      });
    }
  } catch (error) {
    console.error('Error configuring email reader:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get email processing status
router.get('/status', (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Get practice ID (in a real app, would come from the user's association)
    const practiceId = req.session.userId.toString();
    
    // Get email processing status
    const status = emailReaderService.getEmailProcessingStatus(practiceId);
    
    return res.json({ 
      success: true, 
      status 
    });
  } catch (error) {
    console.error('Error getting email processing status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Manually check for new emails
router.post('/check', async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Get practice ID (in a real app, would come from the user's association)
    const practiceId = req.session.userId.toString();
    
    // Check if email is configured
    const status = emailReaderService.getEmailProcessingStatus(practiceId);
    if (!status.configured) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not configured for this practice' 
      });
    }
    
    // Check if already processing
    if (status.isProcessing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email processing already in progress',
        status
      });
    }
    
    // Trigger email check
    await emailReaderService.manuallyCheckEmails(practiceId);
    
    return res.json({ 
      success: true, 
      message: 'Email check completed',
      status: emailReaderService.getEmailProcessingStatus(practiceId)
    });
  } catch (error) {
    console.error('Error checking emails:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking emails' 
    });
  }
});

// Update email check interval
router.post('/interval', (req, res) => {
  try {
    // Verify user is authenticated and authorized
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Validate request body
    const { minutes } = req.body;
    if (typeof minutes !== 'number' || minutes < 1 || minutes > 60) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid interval. Must be between 1 and 60 minutes.' 
      });
    }
    
    // Update interval
    const newInterval = emailReaderService.setEmailCheckInterval(minutes);
    
    return res.json({ 
      success: true, 
      message: 'Email check interval updated',
      interval: newInterval
    });
  } catch (error) {
    console.error('Error updating email check interval:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;