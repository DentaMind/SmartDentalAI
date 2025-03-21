import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { patients, users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { EmailAIService } from '../services/email-ai-service';

const router = express.Router();
const emailService = new EmailAIService();

// Schema for sending patient intake form request
const sendPatientFormSchema = z.object({
  patientId: z.number().optional(),
  patientEmail: z.string().email(),
  patientName: z.string().optional(),
  formType: z.enum(['intake', 'medical-history', 'consent', 'hipaa', 'financial']),
  customMessage: z.string().optional(),
  appointmentDate: z.string().optional(),
  sendCopy: z.boolean().optional().default(false),
  practiceEmail: z.string().email().optional()
});

// Send patient intake form via email
router.post('/patient-forms/send', async (req, res) => {
  try {
    const { 
      patientId, 
      patientEmail, 
      patientName, 
      formType, 
      customMessage, 
      appointmentDate,
      sendCopy,
      practiceEmail
    } = sendPatientFormSchema.parse(req.body);

    // If patientId is provided, get patient info from database
    let fullPatientName = patientName;
    if (patientId && !patientName) {
      const patientData = await db.query.patients.findFirst({
        where: eq(patients.id, patientId),
        with: {
          user: true
        }
      });
      
      if (patientData && patientData.user) {
        fullPatientName = `${patientData.user.firstName} ${patientData.user.lastName}`;
      }
    }

    // Generate form URL with secure token
    const formToken = generateSecureToken();
    const formUrl = `${process.env.BASE_URL || 'https://dentamind.replit.app'}/forms/${formType}?token=${formToken}`;
    
    // Store the form token in database associated with the patient
    await storeFormToken(patientId, formToken, formType);
    
    // Send email with form link
    const emailResult = await emailService.sendPatientForm({
      to: patientEmail,
      patientName: fullPatientName || 'Patient',
      formType,
      formUrl,
      customMessage: customMessage || '',
      appointmentDate: appointmentDate || '',
      sendCopy,
      practiceEmail: practiceEmail || 'dentamind27@gmail.com'
    });

    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'Patient form email sent successfully',
        trackingId: emailResult.trackingId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send patient form email',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error sending patient form:', error);
    res.status(400).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Invalid request data'
    });
  }
});

// Get patient form submission status
router.get('/patient-forms/status/:formToken', async (req, res) => {
  try {
    const { formToken } = req.params;
    
    // Check form status in database
    const formStatus = await getFormStatus(formToken);
    
    res.json({ status: formStatus });
  } catch (error) {
    console.error('Error checking form status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check form status'
    });
  }
});

// Submit completed patient form
router.post('/patient-forms/submit', async (req, res) => {
  try {
    // Validate the form token
    const { formToken, formData } = req.body;
    
    if (!formToken || !formData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields'
      });
    }
    
    // Verify token is valid and not expired
    const formStatus = await getFormStatus(formToken);
    
    if (formStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired form token'
      });
    }
    
    // Save form data to database
    await saveFormSubmission(formToken, formData);
    
    // Update form status
    await updateFormStatus(formToken, 'completed');
    
    // Notify staff that form has been completed
    await notifyFormCompleted(formToken);
    
    res.json({ 
      success: true, 
      message: 'Form submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit form'
    });
  }
});

// Helper functions
function generateSecureToken(): string {
  // Simple implementation for demo purposes
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

async function storeFormToken(patientId: number | undefined, token: string, formType: string): Promise<void> {
  // Implementation would store this in the database
  console.log(`Storing form token ${token} for patient ${patientId}, form type: ${formType}`);
  // Store in database - placeholder for demo
}

async function getFormStatus(token: string): Promise<string> {
  // Implementation would check database
  // Return 'pending', 'completed', 'expired'
  return 'pending';
}

async function saveFormSubmission(token: string, formData: any): Promise<void> {
  // Implementation would save to database
  console.log(`Saving form submission for token ${token}`);
  // Save formData to database - placeholder for demo
}

async function updateFormStatus(token: string, status: string): Promise<void> {
  // Implementation would update database
  console.log(`Updating form status to ${status} for token ${token}`);
  // Update status in database - placeholder for demo
}

async function notifyFormCompleted(token: string): Promise<void> {
  // Implementation would send notification
  console.log(`Notifying staff of completed form for token ${token}`);
  // Send notification - placeholder for demo
}

export default router;