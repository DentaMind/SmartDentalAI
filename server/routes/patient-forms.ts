import express from 'express';
import { z } from 'zod';
import { IStorage } from '../types';
import { EmailAIService } from '../services/email-ai-service';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// Define form response schema
const patientFormResponseSchema = z.object({
  formToken: z.string(),
  formData: z.object({
    // Personal Information
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    // Other fields will be handled dynamically
  }).passthrough(), // Allow other fields to pass through
});

// Define schema for sending a patient form
const sendPatientFormSchema = z.object({
  patientId: z.number().optional(),
  patientEmail: z.string().email(),
  patientName: z.string(),
  formType: z.enum(['intake', 'medical-history', 'consent', 'hipaa', 'financial']),
  customMessage: z.string().optional(),
  appointmentDate: z.string().optional(),
  sendCopy: z.boolean().default(false),
  practiceEmail: z.string().email().optional(),
});

// Define a map to store form tokens temporarily
// In a production environment, these would be stored in a database
const formTokens = new Map<string, {
  patientId?: number;
  patientEmail: string;
  patientName: string;
  formType: string;
  expiresAt: Date;
}>();

// Set up patient forms routes
export function setupPatientFormsRoutes(router: express.Router, storage: IStorage) {
  const emailService = new EmailAIService();
  
  // Route to send a patient form via email
  router.post('/patient-forms/send', async (req, res) => {
    try {
      const formData = sendPatientFormSchema.parse(req.body);
      
      // Generate a unique token for this form
      const formToken = uuidv4();
      
      // Store token with patient info (expires in 14 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);
      
      formTokens.set(formToken, {
        patientId: formData.patientId,
        patientEmail: formData.patientEmail,
        patientName: formData.patientName,
        formType: formData.formType,
        expiresAt
      });
      
      // Generate form URL with token
      const formUrl = `${process.env.BASE_URL || 'https://dentamind.replit.app'}/form/${formToken}`;
      
      // Format patient name for email
      const [firstName, lastName] = formData.patientName.split(' ');
      
      // Send email using the email service
      const emailResult = await emailService.sendPatientForm({
        to: formData.patientEmail,
        patientName: formData.patientName,
        formType: formData.formType,
        formUrl,
        customMessage: formData.customMessage,
        appointmentDate: formData.appointmentDate,
        sendCopy: formData.sendCopy,
        practiceEmail: formData.practiceEmail
      });
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }
      
      // Return success response with token (for testing)
      return res.status(200).json({
        success: true,
        message: 'Form sent successfully',
        token: formToken,
        trackingId: emailResult.trackingId
      });
    } catch (error) {
      console.error('Error sending patient form:', error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Invalid request data'
      });
    }
  });
  
  // Route to verify form token
  router.get('/patient-forms/verify/:token', (req, res) => {
    const { token } = req.params;
    
    // Check if token exists and is valid
    if (formTokens.has(token)) {
      const formData = formTokens.get(token)!;
      
      // Check if token has expired
      if (formData.expiresAt < new Date()) {
        formTokens.delete(token);
        return res.status(400).json({
          success: false,
          message: 'Form link has expired'
        });
      }
      
      // Return form data (excluding sensitive fields)
      return res.status(200).json({
        success: true,
        formType: formData.formType,
        patientName: formData.patientName
      });
    }
    
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired form link'
    });
  });
  
  // Route to submit a completed form
  router.post('/patient-forms/submit', async (req, res) => {
    try {
      // Validate the input
      const { formToken, formData } = patientFormResponseSchema.parse(req.body);
      
      // Check if token exists and is valid
      if (!formTokens.has(formToken)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired form token'
        });
      }
      
      const tokenData = formTokens.get(formToken)!;
      
      // Check if token has expired
      if (tokenData.expiresAt < new Date()) {
        formTokens.delete(formToken);
        return res.status(400).json({
          success: false,
          message: 'Form link has expired'
        });
      }
      
      // Process the form data based on form type
      switch (tokenData.formType) {
        case 'intake':
          // For an intake form, create or update patient record
          if (tokenData.patientId) {
            // Update existing patient
            // This would typically include an update to the patient record
            // and creation of related records for medical history, dental history, etc.
            console.log(`Updating patient ${tokenData.patientId} with form data`);
          } else {
            // Create new patient
            // Convert form data to format expected by patient creation APIs
            console.log(`Creating new patient with email ${tokenData.patientEmail}`);
          }
          break;
          
        case 'medical-history':
          // Update medical history
          console.log(`Updating medical history for patient ${tokenData.patientId || 'new'}`);
          break;
          
        case 'consent':
        case 'hipaa':
        case 'financial':
          // Store signed forms/agreements
          console.log(`Storing ${tokenData.formType} agreement for patient ${tokenData.patientId || 'new'}`);
          break;
          
        default:
          throw new Error(`Unknown form type: ${tokenData.formType}`);
      }
      
      // Clean up the token
      formTokens.delete(formToken);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Form submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting patient form:', error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Invalid form data'
      });
    }
  });
  
  // Route to get a list of sent forms (for administrative purposes)
  router.get('/patient-forms/sent', async (req, res) => {
    try {
      // This would typically pull from a database
      // Here we're just returning the active tokens for demo purposes
      const activeForms = Array.from(formTokens.entries()).map(([token, data]) => ({
        token,
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        formType: data.formType,
        expiresAt: data.expiresAt,
        isExpired: data.expiresAt < new Date()
      }));
      
      return res.status(200).json({
        success: true,
        forms: activeForms
      });
    } catch (error) {
      console.error('Error getting sent forms:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error'
      });
    }
  });
}