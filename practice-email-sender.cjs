/**
 * DentaMind - Practice Email Sender
 * 
 * This script demonstrates how dental practices using DentaMind software can
 * send customized emails to patients with their own practice branding.
 */

const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Configurable settings for the dental practice
 * In a production environment, these would be stored in a database and 
 * configured through the DentaMind admin dashboard
 */
const PRACTICE_CONFIG = {
  // Practice Information
  practiceName: "Abdin Dental",
  practiceTagline: "Excellence in Comprehensive Dental Care",
  practiceEmail: "info@abdindental.com", // This would be the practice's actual email
  practicePhone: "(555) 123-4567",
  practiceAddress: "123 Dental Way, Boston, MA 02215",
  practiceWebsite: "www.abdindental.com",
  
  // Branding Colors (can be customized by each practice)
  primaryColor: "#007bff",  // Practice can choose their brand color
  secondaryColor: "#f8f9fa",
  accentColor: "#28a745",
  
  // Provider Information (practices can set up multiple providers)
  providers: [
    {
      id: "drabdin",
      firstName: "Ahmad",
      lastName: "Abdin",
      title: "Dr.",
      credentials: "DDS",
      specialization: "General Dentistry",
      email: "drabdin@abdindental.com"
    },
    // Practices can add more providers here
  ]
};

/**
 * Sends a patient registration email with practice branding
 */
async function sendPatientRegistrationEmail(patientInfo, providerInfo, appointmentInfo) {
  console.log(`Setting up registration for new patient at ${PRACTICE_CONFIG.practiceName}...`);
  console.log('Email user:', process.env.EMAIL_USER || 'dentamind27@gmail.com');
  console.log('Email pass available:', process.env.EMAIL_PASS ? 'Yes' : 'No');
  
  // In production, we would use the practice's actual email credentials
  // For this demonstration, we're using the DentaMind test account
  
  // Generate a unique form token for this patient
  const formToken = uuidv4();
  
  try {
    // Create a transporter object using SMTP
    // In production, this would use the practice's email server settings
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
    
    // Format the appointment date
    const formattedDate = appointmentInfo.date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    const formattedTime = appointmentInfo.date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Base URL for the application
    const baseUrl = process.env.BASE_URL || 'https://74fbdc8a-e87b-42f1-91e9-aa42704a64e3-00-1wqx45vp1v3o7.worf.replit.dev';
    const formUrl = `${baseUrl}/form/${formToken}`;
    
    // Create the email with practice branding and configuration
    const message = {
      from: `${PRACTICE_CONFIG.practiceName} <${process.env.EMAIL_USER || 'dentamind27@gmail.com'}>`,
      to: patientInfo.email,
      subject: `${PRACTICE_CONFIG.practiceName} - New Patient Registration and Appointment Confirmation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px; padding: 15px; background-color: ${PRACTICE_CONFIG.primaryColor}; border-radius: 5px;">
            <h1 style="color: white; margin: 0;">${PRACTICE_CONFIG.practiceName}</h1>
            <p style="color: white; margin: 5px 0 0 0;">${PRACTICE_CONFIG.practiceTagline}</p>
          </div>
          
          <p>Dear ${patientInfo.firstName} ${patientInfo.lastName},</p>
          
          <p>Thank you for choosing ${PRACTICE_CONFIG.practiceName} for your dental care needs. We are pleased to confirm your appointment with <strong>${providerInfo.title} ${providerInfo.firstName} ${providerInfo.lastName}, ${providerInfo.credentials}</strong> on:</p>
          
          <div style="background-color: ${PRACTICE_CONFIG.secondaryColor}; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border-left: 4px solid ${PRACTICE_CONFIG.primaryColor};">
            <h3 style="margin: 0; color: #333;">${formattedDate}</h3>
            <p style="margin: 5px 0 0 0; color: #555;">${formattedTime}</p>
          </div>
          
          <p><strong>To prepare for your visit:</strong> Please complete our new patient intake form by clicking the button below. This information will help us provide you with the best possible care.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formUrl}" style="background-color: ${PRACTICE_CONFIG.accentColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete New Patient Form</a>
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
          
          <p>If you need to reschedule or have any questions before your appointment, please call our office at ${PRACTICE_CONFIG.practicePhone}.</p>
          
          <p>We look forward to meeting you and helping you achieve optimal dental health!</p>
          
          <p>Sincerely,<br>
          ${providerInfo.title} ${providerInfo.firstName} ${providerInfo.lastName} and the ${PRACTICE_CONFIG.practiceName} Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
            <p>${PRACTICE_CONFIG.practiceName} | ${PRACTICE_CONFIG.practiceAddress} | ${PRACTICE_CONFIG.practicePhone}</p>
            <p>This email contains a secure link to complete your patient form. Your privacy is important to us, and all information is transmitted securely and protected in accordance with HIPAA regulations.</p>
            <p>Powered by <a href="#" style="color: #28C76F; text-decoration: none;">DentaMind</a> - Smart Dental Practice Management</p>
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
    console.log(`Practice: ${PRACTICE_CONFIG.practiceName}`);
    console.log(`Patient Name: ${patientInfo.firstName} ${patientInfo.lastName}`);
    console.log(`Patient Email: ${patientInfo.email}`);
    console.log(`Provider: ${providerInfo.title} ${providerInfo.firstName} ${providerInfo.lastName}, ${providerInfo.credentials}`);
    console.log(`Appointment Date: ${formattedDate} at ${formattedTime}`);
    console.log(`Form Token: ${formToken}`);
    console.log(`Form URL: ${formUrl}`);
    console.log('--------------------------------');
    console.log('\nAfter the patient completes the form, the data will be stored in the DentaMind system');
    console.log(`and accessible in ${PRACTICE_CONFIG.practiceName}'s DentaMind dashboard.`);
    
    return { success: true, formToken, formUrl };
    
  } catch (error) {
    console.error('Error sending registration email:', error);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    return { success: false, error: error.message };
  }
}

// Run the demo for Abdin Dental
async function runDemo() {
  // Get the provider from the practice config
  const provider = PRACTICE_CONFIG.providers[0];
  
  // Set up a test patient
  const patient = {
    firstName: "Ahmad",
    lastName: "Abdin",
    email: "aabdin@bu.edu"
  };
  
  // Set up an appointment one week from now
  const appointment = {
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    duration: 60, // minutes
    type: "New Patient Exam"
  };
  
  // Send the registration email
  await sendPatientRegistrationEmail(patient, provider, appointment);
}

// Execute the demo
runDemo().catch(console.error);