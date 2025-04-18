import { sendEmail } from '../utils/mailer.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function testEmail() {
  console.log('Testing email functionality...');

  try {
    await sendEmail({
      to: 'dentamind27@gmail.com',
      subject: 'DentaMind Email Test',
      body: 'This is a test email from DentaMind AI system.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">🧠 DentaMind Email Test</h1>
          <p>This is a test email to verify the email functionality of the DentaMind AI system.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>If you're receiving this email, the system is correctly configured to send emails.</p>
            <p>Time of test: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

// Run the test
testEmail(); 