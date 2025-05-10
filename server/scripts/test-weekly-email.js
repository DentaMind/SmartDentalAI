import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function testWeeklyEmail() {
  console.log('Testing weekly email functionality...');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #2c3e50;">🧠 DentaMind Weekly AI Model Summary (Test)</h1>
      <p style="color: #7f8c8d;">Generated on: ${new Date().toLocaleDateString()}</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #2c3e50;">Test Email</h2>
        <p>This is a test of the weekly AI model summary email.</p>
        <p>If you're receiving this, the email system is working correctly.</p>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #2c3e50;">System Status</h2>
        <p>Auto-deployment: ${process.env.AUTO_SUGGEST_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled'}</p>
        <p>Next scheduled check: Next Monday at 9:00 AM</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to the same email for testing
      subject: 'DentaMind Weekly AI Model Summary (Test)',
      html,
      text: 'This is a test of the weekly AI model summary email system.',
    });

    console.log('✅ Test weekly summary email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send test weekly summary:', error);
  }
}

// Run the test
console.log('🚀 Testing weekly summary email...');
testWeeklyEmail(); 