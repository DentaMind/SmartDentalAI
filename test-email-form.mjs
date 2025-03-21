/**
 * Script to test sending a patient intake form to a specific email address
 * This script simulates what would happen when a staff member sends an intake form
 * to a patient through the frontend UI.
 */

import fetch from 'node-fetch';

async function sendTestIntakeForm() {
  console.log('Sending test patient intake form...');
  
  try {
    // The data that would normally come from the frontend form
    const formData = {
      patientEmail: 'aabdin@bu.edu', // Dr. Abdin's email for testing
      patientName: 'Ahmad Abdin',
      formType: 'intake',
      customMessage: 'This is a test patient intake form. Please complete it at your convenience.',
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      sendCopy: true,
      practiceEmail: 'dentamind27@gmail.com'
    };
    
    // Send the request to the patient forms API
    const response = await fetch('http://localhost:5000/api/patient-forms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    // Check the response
    if (response.ok) {
      const result = await response.json();
      console.log('Success:', result);
      console.log(`Form sent to ${formData.patientEmail}!`);
      console.log(`Form token: ${result.token}`);
      console.log(`Tracking ID: ${result.trackingId}`);
    } else {
      const errorText = await response.text();
      console.error('Error response:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error sending form:', error);
  }
}

// Run the test
sendTestIntakeForm();