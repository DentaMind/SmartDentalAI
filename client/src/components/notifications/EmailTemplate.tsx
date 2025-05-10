import React from 'react';

interface EmailTemplateProps {
  title: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  patientName?: string;
  type?: 'appointment' | 'reminder' | 'alert' | 'general';
}

/**
 * A component that renders HTML email templates
 * This is used to preview the email in the UI and also as a template for the server
 */
const EmailTemplate: React.FC<EmailTemplateProps> = ({
  title,
  message,
  buttonText = 'View Details',
  buttonUrl = 'https://dentamind.com/app',
  patientName = '',
  type = 'general'
}) => {
  const headerBgColor = '#0d0d0d';
  const primaryColor = '#65FF65';
  const accentColor = type === 'alert' ? '#ff4d4f' : primaryColor;
  const darkTextColor = '#333333';
  const lightTextColor = '#ffffff';
  const bodyBgColor = '#f5f5f5';
  
  // Get icon based on notification type
  const getTypeIcon = () => {
    switch (type) {
      case 'appointment':
        return `
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="${primaryColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        `;
      case 'reminder':
        return `
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="${primaryColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        `;
      case 'alert':
        return `
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="${accentColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        `;
      default:
        return `
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="${primaryColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        `;
    }
  };
  
  // HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: ${bodyBgColor};
            color: ${darkTextColor};
            line-height: 1.5;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background-color: ${headerBgColor};
            padding: 24px;
            text-align: center;
          }
          
          .logo {
            margin-bottom: 16px;
          }
          
          .header-text {
            color: ${lightTextColor};
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
          }
          
          .message {
            margin-bottom: 24px;
            color: #555;
          }
          
          .button-container {
            text-align: center;
            margin: 24px 0;
          }
          
          .button {
            display: inline-block;
            background-color: ${accentColor};
            color: ${headerBgColor};
            font-weight: 600;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            text-align: center;
          }
          
          .footer {
            background-color: #f1f1f1;
            padding: 16px 24px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          
          .footer p {
            margin: 6px 0;
          }
          
          .icon-container {
            display: inline-block;
            margin-right: 12px;
            vertical-align: middle;
          }
          
          .notification-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .notification-title {
            font-size: 18px;
            font-weight: 500;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg width="80" height="40" viewBox="0 0 150 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M55 10H60V30H55V10Z" fill="${primaryColor}"/>
                <path d="M62 10H67L74 22.5V10H79V30H74L67 17.5V30H62V10Z" fill="${primaryColor}"/>
                <path d="M81 10H96V14.5H86V17.5H93V22H86V25.5H96V30H81V10Z" fill="${primaryColor}"/>
                <path d="M98 10H103V25.5H113V30H98V10Z" fill="${primaryColor}"/>
                <circle cx="20" cy="20" r="20" fill="${primaryColor}"/>
                <circle cx="20" cy="20" r="15" fill="${headerBgColor}"/>
                <circle cx="20" cy="20" r="10" fill="${primaryColor}"/>
                <circle cx="20" cy="20" r="5" fill="${headerBgColor}"/>
              </svg>
            </div>
            <h1 class="header-text">DentaMind</h1>
          </div>
          <div class="content">
            ${patientName ? `<div class="greeting">Hello ${patientName},</div>` : ''}
            
            <div class="notification-header">
              <div class="icon-container">
                ${getTypeIcon()}
              </div>
              <h2 class="notification-title">${title}</h2>
            </div>
            
            <div class="message">
              ${message}
            </div>
            
            ${buttonUrl ? `
              <div class="button-container">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
              </div>
            ` : ''}
            
            <p>Thank you for choosing DentaMind for your dental health needs.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} DentaMind. All rights reserved.</p>
            <p>123 Dental Street, Suite 100, San Francisco, CA 94105</p>
            <p><a href="https://dentamind.com/privacy">Privacy Policy</a> | <a href="https://dentamind.com/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default EmailTemplate; 