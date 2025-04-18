import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { sendEmail } from '../utils/email';
import { sendSlackNotification } from '../utils/slack';

export class AuditLogService {
  static async logAction(
    userId: number,
    userEmail: string,
    userRole: string,
    action: string,
    status: 'success' | 'failed',
    details: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      const [log] = await db.insert(auditLogs).values({
        userId,
        userEmail,
        userRole,
        action,
        status,
        details,
        metadata,
        createdAt: new Date(),
      }).returning();

      // Send notifications for significant actions
      if (action === 'promote' || action === 'rollback') {
        await this.sendNotifications(log);
      }

      return log;
    } catch (error) {
      console.error('Failed to log audit action:', error);
      throw error;
    }
  }

  private static async sendNotifications(log: typeof auditLogs.$inferSelect) {
    const message = `🔒 Admin Action: ${log.action.toUpperCase()}\n` +
      `User: ${log.userEmail} (${log.userRole})\n` +
      `Status: ${log.status}\n` +
      `Details: ${log.details}\n` +
      `Time: ${log.createdAt.toISOString()}`;

    // Send Slack notification
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackNotification({
        text: message,
        color: log.status === 'success' ? 'good' : 'danger',
      });
    }

    // Send email to security contact
    if (process.env.SECURITY_CONTACT_EMAIL) {
      await sendEmail({
        to: process.env.SECURITY_CONTACT_EMAIL,
        subject: `[Security Alert] AI Model ${log.action.toUpperCase()} Action`,
        text: message,
        html: `
          <h2>🔒 Admin Action Alert</h2>
          <p><strong>Action:</strong> ${log.action.toUpperCase()}</p>
          <p><strong>User:</strong> ${log.userEmail} (${log.userRole})</p>
          <p><strong>Status:</strong> ${log.status}</p>
          <p><strong>Details:</strong> ${log.details}</p>
          <p><strong>Time:</strong> ${log.createdAt.toISOString()}</p>
          <p><strong>Metadata:</strong></p>
          <pre>${JSON.stringify(log.metadata, null, 2)}</pre>
        `,
      });
    }
  }
} 