import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendAuditNotification = async (
  to: string,
  action: string,
  details: Record<string, any>
) => {
  const subject = `Audit Alert: ${action}`;
  const text = `
    An audit event has been recorded:
    
    Action: ${action}
    Time: ${new Date().toISOString()}
    Details: ${JSON.stringify(details, null, 2)}
    
    This is an automated message.
  `;

  return sendEmail({ to, subject, text });
}; 