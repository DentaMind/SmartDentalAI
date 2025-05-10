import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { AIModelService } from '../services/ai-model.ts';
import { db } from '../db.ts';
import { users } from '../../shared/schema.ts';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../utils/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function sendWeeklySummary() {
  console.log('[AI] Generating weekly admin model summary...');

  try {
    const summary = await AIModelService.getABSummary();
    if (!summary.length) {
      console.log('[AI] No model data available for summary');
      return;
    }

    const currentVersion = (await AIModelService.getModelVersions()).currentVersion;
    const activeModel = summary.find(s => s.version === currentVersion);

    // Format model statistics
    const modelStats = summary.map(s => {
      const score = ((s.improved - s.worsened) / s.total * 100).toFixed(1);
      const isActive = s.version === currentVersion;
      return {
        version: s.version,
        score: `${score}%`,
        improved: s.improved,
        worsened: s.worsened,
        total: s.total,
        isActive
      };
    });

    // Generate HTML content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #2c3e50;">🧠 DentaMind Weekly AI Model Summary</h1>
        <p style="color: #7f8c8d;">Generated on: ${new Date().toLocaleDateString()}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #2c3e50;">Current Model Status</h2>
          <p style="font-size: 18px;">
            ${activeModel ? `✅ v${activeModel.version} (${((activeModel.improved - activeModel.worsened) / activeModel.total * 100).toFixed(1)}% net improvement)` : 'No active model'}
          </p>
        </div>

        <h2 style="color: #2c3e50;">Model Performance Overview</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f1f1f1;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Version</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Net Improvement</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Improved Cases</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Worsened Cases</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Total Cases</th>
            </tr>
          </thead>
          <tbody>
            ${modelStats.map(stat => `
              <tr style="${stat.isActive ? 'background-color: #e8f5e9;' : ''}">
                <td style="padding: 12px; border: 1px solid #ddd;">v${stat.version} ${stat.isActive ? '✅' : ''}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${stat.score}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${stat.improved}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${stat.worsened}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${stat.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <h2 style="color: #2c3e50;">System Status</h2>
          <p>Auto-deployment: ${process.env.AUTO_SUGGEST_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled'}</p>
          <p>Next scheduled check: Next Monday at 9:00 AM</p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3 style="color: #2c3e50;">Quick Actions</h3>
            <p>To manage model versions, visit the <a href="${process.env.APP_URL}/admin/ai-models" style="color: #3498db;">AI Model Management Dashboard</a></p>
          </div>
        </div>
      </div>
    `;

    // Generate plain text content
    const text = `DentaMind Weekly AI Model Summary\n\n` +
      `Current Model: ${activeModel ? `v${activeModel.version}` : 'None'}\n\n` +
      `Model Stats:\n${modelStats.map(stat => 
        `- v${stat.version}${stat.isActive ? ' (Current)' : ''}: ${stat.score} net improvement (${stat.improved}↑ / ${stat.worsened}↓ of ${stat.total})`
      ).join('\n')}\n\n` +
      `Auto-deployment: ${process.env.AUTO_SUGGEST_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`;

    // Get admin users
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));

    // Send emails to all admins
    for (const admin of admins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: 'Weekly AI Model Report – DentaMind',
          body: text,
          html
        });
        console.log(`✅ Summary sent to admin: ${admin.email}`);
      }
    }

    console.log('[AI] Weekly summary sent to all admins');
  } catch (err) {
    console.error('[AI] Weekly summary email failed:', err);
  }
}

// Run the summary
console.log('🚀 Manually triggering weekly admin summary...');
sendWeeklySummary(); 