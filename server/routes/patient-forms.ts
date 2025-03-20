import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { patients, users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

// Define request schemas
const sendPatientFormSchema = z.object({
  patientId: z.number(),
  contactMethod: z.enum(['email', 'sms', 'both']),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  message: z.string().optional(),
});

// Create router
const router = express.Router();

// Get patient forms by patient ID
router.get('/patients/:patientId/forms', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  if (isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }
  
  try {
    // For now, we'll return mock data since the actual database table isn't set up yet
    // In a real implementation, you would query from a forms table
    
    // Check if patient exists
    const patient = await db.select().from(patients).where(eq(patients.id, patientId));
    
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Return empty array for now as placeholder
    res.json([]);
  } catch (error) {
    console.error('Error fetching patient forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send patient intake form
router.post('/patient-forms/send', async (req, res) => {
  try {
    // Validate request body
    const validatedData = sendPatientFormSchema.parse(req.body);
    
    // Get patient info
    const patient = await db.select().from(patients).where(eq(patients.id, validatedData.patientId)).limit(1);
    
    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get patient's user info
    const patientUser = await db.select().from(users).where(eq(users.id, patient[0].userId)).limit(1);
    
    if (patientUser.length === 0) {
      return res.status(404).json({ error: 'Patient user not found' });
    }
    
    const patientName = `${patientUser[0].firstName} ${patientUser[0].lastName}`;
    
    // Generate unique form link
    const formId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const formLink = `${req.protocol}://${req.get('host')}/intake-form/${formId}`;
    
    // Send email if requested
    if (validatedData.contactMethod === 'email' || validatedData.contactMethod === 'both') {
      if (!validatedData.emailAddress) {
        return res.status(400).json({ error: 'Email address is required for email contact method' });
      }
      
      await sendEmailWithIntakeForm({
        patientName,
        emailAddress: validatedData.emailAddress,
        formLink,
        customMessage: validatedData.message,
      });
    }
    
    // Send SMS if requested
    if (validatedData.contactMethod === 'sms' || validatedData.contactMethod === 'both') {
      if (!validatedData.phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required for SMS contact method' });
      }
      
      // Implement SMS sending here (future enhancement)
      // For now, we'll just log it
      console.log(`Would send SMS to ${validatedData.phoneNumber} for patient ${patientName} with link ${formLink}`);
    }
    
    // Record that the form was sent (future: store in database)
    
    res.json({ success: true, message: 'Patient intake form sent successfully' });
  } catch (error) {
    console.error('Error sending patient intake form:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to send patient intake form' });
  }
});

// Helper function to send email with intake form link
async function sendEmailWithIntakeForm({
  patientName,
  emailAddress,
  formLink,
  customMessage,
}: {
  patientName: string;
  emailAddress: string;
  formLink: string;
  customMessage?: string;
}) {
  // Create email transporter
  // In production, you would use your actual SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'user@example.com',
      pass: process.env.EMAIL_PASSWORD || 'password',
    },
  });
  
  // Create email HTML content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #28C76F; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">DentaMind</h1>
        <p style="margin: 5px 0 0;">Complete Your Patient Intake Form</p>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
        <p>Hello ${patientName},</p>
        <p>Thank you for choosing DentaMind for your dental care. To provide you with the best possible care, we need some information about your dental and medical history.</p>
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        <p>Please complete your patient intake form by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${formLink}" style="background-color: #28C76F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Intake Form</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${formLink}</p>
        <p>Please complete this form at your earliest convenience, preferably before your appointment.</p>
        <p>This information is essential for your dentist to provide appropriate care and will be kept confidential in accordance with HIPAA regulations.</p>
        <p>If you have any questions, please don't hesitate to contact our office.</p>
        <p>Best regards,<br>The DentaMind Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This email contains confidential information and is intended solely for the named recipient.</p>
        <p>&copy; 2025 DentaMind. All rights reserved.</p>
      </div>
    </div>
  `;
  
  // Send email
  await transporter.sendMail({
    from: `"DentaMind" <${process.env.EMAIL_FROM || 'noreply@dentamind.com'}>`,
    to: emailAddress,
    subject: 'Complete Your DentaMind Patient Intake Form',
    html: emailHtml,
    text: `Hello ${patientName},

Thank you for choosing DentaMind for your dental care. To provide you with the best possible care, we need some information about your dental and medical history.

${customMessage ? customMessage + '\n\n' : ''}Please complete your patient intake form by visiting this link:
${formLink}

Please complete this form at your earliest convenience, preferably before your appointment.

This information is essential for your dentist to provide appropriate care and will be kept confidential in accordance with HIPAA regulations.

If you have any questions, please don't hesitate to contact our office.

Best regards,
The DentaMind Team`,
  });
}

export default router;