/**
 * Script to register a new patient for Dr. Abdin and send them an intake form
 * 
 * This sends an email with a link to the patient intake form and assigns the
 * patient to Dr. Abdin's schedule.
 */

const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

async function registerNewPatient() {
  console.log('Setting up registration for new patient under Dr. Abdin...');
  console.log('Email user:', process.env.EMAIL_USER || 'dentamind27@gmail.com');
  console.log('Email pass available:', process.env.EMAIL_PASS ? 'Yes' : 'No');
  
  // Generate a unique form token for this patient
  const formToken = uuidv4();
  const patientEmail = 'aabdin@bu.edu'; // You can change this to any test email
  const patientName = 'Ahmad Abdin';
  
  try {
    // Create a transporter object using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'dentamind27@gmail.com',
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('Transporter created, verifying...');
    
    // Verify connection configuration
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    // Set appointment date one week from now
    const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Base URL for the application
    const baseUrl = process.env.BASE_URL || 'https://74fbdc8a-e87b-42f1-91e9-aa42704a64e3-00-1wqx45vp1v3o7.worf.replit.dev';
    const formUrl = `${baseUrl}/form/${formToken}`;
    
    // Email template for new patient registration
    const message = {
      from: process.env.EMAIL_FROM || 'Dr. Abdin <dentamind27@gmail.com>',
      to: patientEmail,
      subject: 'DentaMind - New Patient Registration and Appointment Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #28C76F;">Welcome to DentaMind Dental Care</h2>
          </div>
          
          <p>Dear ${patientName},</p>
          
          <p>Thank you for choosing DentaMind for your dental care needs. We are pleased to confirm your appointment with <strong>Dr. Abdin</strong> on:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; color: #333;">${formattedDate}</h3>
          </div>
          
          <p><strong>To prepare for your visit:</strong> Please complete our new patient intake form by clicking the button below. This information will help us provide you with the best possible care.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formUrl}" style="background-color: #28C76F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete New Patient Form</a>
          </div>
          
          <p><strong>What to expect during your first visit:</strong></p>
          <ul style="margin-bottom: 20px;">
            <li>Comprehensive examination</li>
            <li>Digital x-rays (if needed)</li>
            <li>Discussion of your dental health goals</li>
            <li>Personalized treatment plan</li>
          </ul>
          
          <p><strong>Please bring:</strong></p>
          <ul style="margin-bottom: 20px;">
            <li>Your dental insurance card (if applicable)</li>
            <li>A list of current medications</li>
            <li>Photo ID</li>
          </ul>
          
          <p>If you need to reschedule or have any questions before your appointment, please call our office at (555) 123-4567.</p>
          
          <p>We look forward to meeting you and helping you achieve optimal dental health!</p>
          
          <p>Sincerely,<br>
          Dr. Abdin and the DentaMind Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>This email contains a secure link to complete your patient form. Your privacy is important to us, and all information is transmitted securely and protected in accordance with HIPAA regulations.</p>
          </div>
        </div>
      `
    };
    
    console.log('Sending email...');
    
    // Send mail with defined transport object
    const info = await transporter.sendMail(message);
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    // Log information about the patient registration
    console.log('\nPatient registration information:');
    console.log('--------------------------------');
    console.log(`Patient Name: ${patientName}`);
    console.log(`Patient Email: ${patientEmail}`);
    console.log(`Provider: Dr. Abdin`);
    console.log(`Appointment Date: ${formattedDate}`);
    console.log(`Form Token: ${formToken}`);
    console.log(`Form URL: ${formUrl}`);
    console.log('--------------------------------');
    console.log('\nAfter the patient completes the form, the data will be stored in the system and accessible in Dr. Abdin\'s dashboard.');
    
  } catch (error) {
    console.error('Error registering patient:', error);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  }
}

// Execute the function
registerNewPatient().catch(console.error);