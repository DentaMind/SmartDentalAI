import cron from 'node-cron';
import { sendEmail } from '../utils/mailer';
import { AIModelService } from '../services/ai-model';
import { generateEmailLinkToken } from '../utils/token';

const aiModelService = new AIModelService();

async function sendWeeklySummary() {
  try {
    // Get A/B testing summary
    const abSummary = await aiModelService.getABSummary();
    
    // Get feedback summary
    const feedbackSummary = await aiModelService.getFeedbackSummary();
    
    // Generate token for admin actions
    const token = generateEmailLinkToken({
      userId: 1,
      email: process.env.ADMIN_EMAIL || '',
      role: 'admin',
    });
    
    // Format email content
    const html = `
      <style>
        .action-button {
          display: inline-block;
          padding: 8px 16px;
          margin: 4px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          color: white;
        }
        .promote-button {
          background-color: #4CAF50;
        }
        .rollback-button {
          background-color: #f44336;
        }
        .action-button:hover {
          opacity: 0.9;
        }
      </style>
      <h1>DentaMind AI Weekly Performance Report</h1>
      <h2>A/B Testing Results</h2>
      <table border="1" cellpadding="5">
        <tr>
          <th>Model Version</th>
          <th>Total Cases</th>
          <th>Improved</th>
          <th>Stable</th>
          <th>Worsened</th>
          <th>Actions</th>
        </tr>
        ${abSummary.map(version => {
          const promoteLink = `${process.env.APP_URL}/api/ai-model/promote/${version.version}?token=${token}&source=email&action=promote&version=${version.version}`;
          const rollbackLink = `${process.env.APP_URL}/api/ai-model/rollback/${version.version}?token=${token}&source=email&action=rollback&version=${version.version}`;
          return `
            <tr>
              <td>${version.version}</td>
              <td>${version.total}</td>
              <td>${version.improved}</td>
              <td>${version.stable}</td>
              <td>${version.worsened}</td>
              <td>
                ${version.status !== 'deployed'
                  ? `<a href="${promoteLink}" class="action-button promote-button">🔼 Promote</a>`
                  : '✅ Live'}
                ${version.status === 'archived'
                  ? `<a href="${rollbackLink}" class="action-button rollback-button">🔙 Rollback</a>`
                  : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </table>
      
      <h2>User Feedback Summary</h2>
      <table border="1" cellpadding="5">
        <tr>
          <th>Model Version</th>
          <th>Total Feedback</th>
          <th>Positive</th>
          <th>Neutral</th>
          <th>Negative</th>
        </tr>
        ${feedbackSummary.map(version => `
          <tr>
            <td>${version.version}</td>
            <td>${version.total}</td>
            <td>${version.positive}</td>
            <td>${version.neutral}</td>
            <td>${version.negative}</td>
          </tr>
        `).join('')}
      </table>
    `;

    // Send email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || '',
      subject: 'DentaMind AI Weekly Performance Report',
      body: 'Please view the HTML version of this email for the complete report.',
      html,
    });

    console.log('📊 Weekly AI performance report sent successfully');
  } catch (error) {
    console.error('Failed to send weekly AI performance report:', error);
  }
}

// Schedule to run every Monday at 9:00 AM
export function startWeeklySummaryJob() {
  cron.schedule('0 9 * * 1', sendWeeklySummary);
  console.log('📅 Weekly AI performance report job scheduled');
} 