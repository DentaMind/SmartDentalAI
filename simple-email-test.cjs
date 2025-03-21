/**
 * Simple test for sending emails directly with Nodemailer
 * This avoids all the authentication and API complexity
 */

const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Create a test email function
async function sendTestEmail() {
  console.log('Setting up transporter with credentials...');
  console.log('Email user:', process.env.EMAIL_USER || 'dentamind27@gmail.com');
  console.log('Email pass available:', process.env.EMAIL_PASS ? 'Yes' : 'No');
  
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
    
    // Message object
    const message = {
      from: process.env.EMAIL_FROM || 'DentaMind <dentamind27@gmail.com>',
      to: 'aabdin@bu.edu',
      subject: 'DentaMind - Test Patient Intake Form',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #28C76F;">DentaMind - Patient Intake Form</h2>
          </div>
          
          <p>Dear Ahmad Abdin,</p>
          
          <p>Thank you for choosing DentaMind for your dental care needs. To provide you with the best possible care, we need you to complete the following form:</p>
          
          <p><strong>Patient Intake Form</strong></p>
          
          <p>This is a test patient intake form. Please complete it at your convenience.</p>
          
          <p>This information is needed for your upcoming appointment on <strong>${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://74fbdc8a-e87b-42f1-91e9-aa42704a64e3-00-1wqx45vp1v3o7.worf.replit.dev/form/test" style="background-color: #28C76F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Form</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us at dentamind27@gmail.com or call our office.</p>
          
          <p>Thank you for your cooperation!</p>
          
          <p>Best regards,<br>
          The DentaMind Team</p>
          
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
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  }
}

// Execute the function
sendTestEmail().catch(console.error);