/**
 * Script to test sending a patient intake form to a specific email address
 * This script simulates what would happen when a staff member sends an intake form
 * to a patient through the frontend UI.
 * 
 * It includes a login step to get an authenticated session before sending the form.
 */

import fetch from 'node-fetch';
import { EmailAIService } from './server/services/email-ai-service.js';

// Direct use of the EmailAIService to bypass authentication
async function sendTestIntakeFormDirectly() {
  console.log('Sending test patient intake form directly using EmailAIService...');
  
  try {
    // Create an instance of the EmailAIService
    const emailService = new EmailAIService();
    
    // Generate a unique form URL (normally this would come from a token)
    const formToken = Math.random().toString(36).substring(2, 15);
    const formUrl = `https://dentamind.replit.app/form/${formToken}`;
    
    // Send the patient form email directly through the service
    const result = await emailService.sendPatientForm({
      to: 'aabdin@bu.edu', // Dr. Abdin's email for testing
      patientName: 'Ahmad Abdin',
      formType: 'intake',
      formUrl: formUrl,
      customMessage: 'This is a test patient intake form sent directly via EmailAIService. Please complete it at your convenience.',
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      sendCopy: true,
      practiceEmail: 'dentamind27@gmail.com'
    });
    
    if (result.success) {
      console.log('Success! Email sent directly via EmailAIService');
      console.log(`Form sent to aabdin@bu.edu!`);
      console.log(`Form URL: ${formUrl}`);
      console.log(`Tracking ID: ${result.trackingId}`);
    } else {
      console.error('Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('Error in direct email sending:', error);
  }
}

// Login and then send form
async function loginAndSendForm() {
  console.log('Attempting to login and then send form via API...');
  
  try {
    // Step 1: Log in to get a session
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'dentist', // Using a test account
        password: 'password'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Login failed:', loginResponse.status, errorText);
      throw new Error('Login failed');
    }
    
    const loginResult = await loginResponse.json();
    console.log('Login successful!');
    
    // Get any cookies from the response
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Step 2: Send the form with authentication
    const formData = {
      patientEmail: 'aabdin@bu.edu', // Dr. Abdin's email for testing
      patientName: 'Ahmad Abdin',
      formType: 'intake',
      customMessage: 'This is a test patient intake form. Please complete it at your convenience.',
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      sendCopy: true,
      practiceEmail: 'dentamind27@gmail.com'
    };
    
    const formResponse = await fetch('http://localhost:5000/api/patient-forms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(formData)
    });
    
    if (formResponse.ok) {
      const result = await formResponse.json();
      console.log('Form sent successfully through API!');
      console.log(`Form sent to ${formData.patientEmail}!`);
      console.log(`Form token: ${result.token}`);
      console.log(`Tracking ID: ${result.trackingId}`);
    } else {
      const errorText = await formResponse.text();
      console.error('Error sending form:', formResponse.status, errorText);
    }
  } catch (error) {
    console.error('Error in login and send form process:', error);
  }
}

// Try both methods (direct will likely work, API may still need session fixes)
async function runTests() {
  await sendTestIntakeFormDirectly();
  console.log('\n---------------------------------------\n');
  await loginAndSendForm();
}

runTests();