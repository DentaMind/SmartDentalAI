import { AIModelService } from './ai-model';
import { db } from '../db';
import { aiModelVersions } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

interface ModelPerformance {
  version: string;
  total: number;
  improved: number;
  stable: number;
  worsened: number;
  score: number;
}

export class AIReportService {
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  static async generateWeeklyReport() {
    try {
      const summary = await AIModelService.getABSummary();
      if (summary.length === 0) {
        return null;
      }

      const versionScores = summary.map(s => ({
        version: s.version,
        total: s.total,
        improved: s.improved,
        stable: s.stable,
        worsened: s.worsened,
        score: (s.improved - s.worsened) / s.total
      }));

      const best = versionScores.reduce((a, b) => (a.score > b.score ? a : b));
      const current = await db.select().from(aiModelVersions).where(eq(aiModelVersions.status, 'deployed'));

      return {
        versions: versionScores,
        bestVersion: best,
        currentVersion: current[0]?.version,
        shouldDeploy: current[0]?.version !== best.version
      };
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw error;
    }
  }

  static async sendWeeklyReport() {
    try {
      const report = await this.generateWeeklyReport();
      if (!report) {
        console.log('[AI] No data available for weekly report');
        return;
      }

      const html = `
        <h1>DentaMind AI Weekly Performance Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        
        <h2>Current Model Version</h2>
        <p>${report.currentVersion || 'None'}</p>
        
        <h2>Best Performing Version</h2>
        <p>${report.bestVersion.version} (Score: ${(report.bestVersion.score * 100).toFixed(2)}%)</p>
        
        <h2>Detailed Performance Metrics</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px;">Version</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total Cases</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Improved</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Stable</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Worsened</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Score</th>
          </tr>
          ${report.versions.map(v => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${v.version}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${v.total}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${v.improved}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${v.stable}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${v.worsened}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${(v.score * 100).toFixed(2)}%</td>
            </tr>
          `).join('')}
        </table>
        
        ${report.shouldDeploy ? `
          <h2 style="color: #ff0000;">⚠️ Action Required</h2>
          <p>A better performing model version (${report.bestVersion.version}) is available.</p>
          <p>Auto-deployment is ${process.env.AUTO_SUGGEST_ENABLED === 'true' ? 'enabled' : 'disabled'}.</p>
        ` : ''}
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_SUPPORT_ADDRESS,
        subject: 'DentaMind AI Weekly Performance Report',
        html,
      });

      console.log('[AI] Weekly performance report sent successfully');
    } catch (error) {
      console.error('[AI] Failed to send weekly report:', error);
    }
  }
} 