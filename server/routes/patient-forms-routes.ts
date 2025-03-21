/**
 * Patient Forms API Routes
 * 
 * These routes handle sending, validating, and processing patient intake forms
 */

import express from "express";
import { db } from "../db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { IStorage } from "../types";

const formTokenSchema = z.object({
  formToken: z.string().min(6),
});

const validateFormTokenSchema = z.object({
  formToken: z.string().min(6),
});

// Create a forms router
export const patientFormsRoutes = express.Router();

/**
 * Setup patient forms routes
 */
export function setupPatientFormsRoutes(router: express.Router) {
  // Mount the patient forms router
  router.use("/patient-forms", patientFormsRoutes);

  // Send a patient form via email
  patientFormsRoutes.post("/send", async (req, res) => {
    try {
      const { patientEmail, patientName, formType, customMessage } = req.body;
      
      // Generate a secure form token
      const formToken = crypto.randomBytes(32).toString("hex");
      
      // Create a transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || 'dentamind27@gmail.com',
          pass: process.env.EMAIL_PASS
        }
      });
      
      // Form URL with token
      const formUrl = `${req.protocol}://${req.get("host")}/form/${formToken}`;
      
      // Set up email data
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'DentaMind <dentamind27@gmail.com>',
        to: patientEmail,
        subject: 'DentaMind - Patient Intake Form',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #28C76F;">DentaMind - Patient Intake Form</h2>
            </div>
            
            <p>Dear ${patientName},</p>
            
            <p>Thank you for choosing DentaMind for your dental care needs. To provide you with the best possible care, we need you to complete the following form:</p>
            
            <p><strong>${formType === 'intake' ? 'Patient Intake Form' : 'Medical History Update'}</strong></p>
            
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            
            <p>This information is needed for your upcoming appointment.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${formUrl}" style="background-color: #28C76F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Form</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            
            <p>Thank you for your cooperation!</p>
            
            <p>Best regards,<br>
            The DentaMind Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
              <p>This email contains a secure link to complete your patient form. Your privacy is important to us, and all information is transmitted securely and protected in accordance with HIPAA regulations.</p>
            </div>
          </div>
        `
      };
      
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      
      // Store the form token in the database for later validation
      // This is a simplified version - in production, store in a database with expiration
      
      res.status(200).json({ 
        success: true,
        message: 'Form sent successfully',
        formToken: formToken,
        emailInfo: info.messageId
      });
    } catch (error) {
      console.error('Error sending patient form:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to send patient form',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Validate a form token (public endpoint)
  patientFormsRoutes.get("/validate/:formToken", async (req, res) => {
    try {
      const { formToken } = req.params;
      
      // For testing purposes - allow 'test' token to work without validation
      if (formToken === 'test') {
        return res.status(200).json({
          valid: true,
          formType: 'intake',
          patientName: 'Test Patient',
          formData: {},
        });
      }
      
      // In a real implementation, validate the token against the database
      // Check if it exists and hasn't expired
      
      // For now, we'll just simulate checking for a specific token for testing
      const isValidToken = formToken && formToken.length > 10;
      
      if (!isValidToken) {
        return res.status(404).json({
          valid: false,
          message: 'Invalid or expired form token',
        });
      }
      
      // Return form data if the token is valid
      res.status(200).json({
        valid: true,
        formType: 'intake',
        patientName: 'Test Patient',
        formData: {},
      });
    } catch (error) {
      console.error('Error validating form token:', error);
      res.status(500).json({
        valid: false,
        message: 'Error validating form token',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  // Submit a completed form
  patientFormsRoutes.post("/submit/:formToken", async (req, res) => {
    try {
      const { formToken } = req.params;
      const formData = req.body;
      
      // In a real implementation:
      // 1. Validate the token
      // 2. Store the submitted form data
      // 3. Mark the form as completed
      // 4. Optionally notify staff of completion
      
      res.status(200).json({
        success: true,
        message: 'Form submitted successfully',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit form',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}