import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, body, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: body,
      html,
    });
    console.log(`📤 Email sent to: ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
} 