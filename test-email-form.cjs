/**
 * Script to test sending a patient intake form to a specific email address
 * This script simulates what would happen when a staff member sends an intake form
 * to a patient through the frontend UI.
 */

/**
 * Direct test script for sending patient intake forms
 * Using direct method to send emails without going through API endpoints
 */

// Import required modules
const { EmailAIService } = require('./server/services/email-ai-service');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to send test email directly via the service
async function sendTestEmail() {
  console.log('Sending test patient intake form directly...');
  
  try {
    // Create email service instance
    const emailService = new EmailAIService();
    
    // Generate a form token for tracking
    const formToken = uuidv4();
    const formUrl = `https://dentamind.replit.app/form/${formToken}`;
    
    // Send email using the service
    const result = await emailService.sendPatientForm({
      to: 'aabdin@bu.edu',
      patientName: 'Ahmad Abdin',
      formType: 'intake',
      formUrl: formUrl,
      customMessage: 'This is a test patient intake form. Please complete it at your convenience.',
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sendCopy: true,
      practiceEmail: 'dentamind27@gmail.com'
    });
    
    // Check result
    if (result.success) {
      console.log('Success! Email sent directly:');
      console.log(`Form sent to aabdin@bu.edu`);
      console.log(`Form URL: ${formUrl}`);
      console.log(`Tracking ID: ${result.trackingId}`);
    } else {
      console.error('Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('Error in direct email sending:', error);
    // Log more detailed error information
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
sendTestEmail();