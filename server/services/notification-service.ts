import { Notification, OverrideReview, NotificationSettings } from '../../shared/schema';
import { MemStorage } from '../storage';
import { sendEmail } from './email-service';
import { sendSlackMessage } from './slack-service';

export class NotificationService {
  constructor(private storage: MemStorage) {}

  async createOverrideAlert(overrideId: number, confidence: number, providerId: number): Promise<void> {
    const settings = await this.storage.getNotificationSettings(providerId);
    if (!settings?.overrideAlertEnabled) return;

    const message = `High confidence override (${confidence}%) requires review`;
    const notification: Notification = {
      id: Date.now(),
      userId: providerId,
      type: 'override_alert',
      message,
      read: false,
      metadata: {
        overrideId,
        confidence,
        reviewDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.createNotification(notification);

    // Send email if enabled
    if (settings.emailEnabled) {
      await sendEmail({
        to: settings.userId.toString(),
        subject: 'Override Alert',
        text: message
      });
    }

    // Send Slack message if enabled
    if (settings.slackEnabled) {
      await sendSlackMessage({
        channel: 'override-alerts',
        text: message
      });
    }
  }

  async createReviewRequest(overrideId: number, reviewerId: number): Promise<void> {
    const settings = await this.storage.getNotificationSettings(reviewerId);
    if (!settings?.reviewRequestEnabled) return;

    const message = 'New override requires review';
    const notification: Notification = {
      id: Date.now(),
      userId: reviewerId,
      type: 'review_request',
      message,
      read: false,
      metadata: {
        overrideId,
        reviewDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.createNotification(notification);

    if (settings.emailEnabled) {
      await sendEmail({
        to: settings.userId.toString(),
        subject: 'Review Request',
        text: message
      });
    }

    if (settings.slackEnabled) {
      await sendSlackMessage({
        channel: 'review-requests',
        text: message
      });
    }
  }

  async createReview(overrideId: number, reviewerId: number, status: 'approved' | 'rejected', notes: string): Promise<OverrideReview> {
    const review: OverrideReview = {
      id: Date.now(),
      overrideId,
      reviewerId,
      status,
      notes,
      confidence: 0, // This will be updated by the diagnosis service
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.createOverrideReview(review);
    return review;
  }

  async getPendingReviews(reviewerId: number): Promise<OverrideReview[]> {
    return this.storage.getPendingReviews(reviewerId);
  }

  async updateNotificationSettings(userId: number, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.storage.updateNotificationSettings(userId, settings);
  }
} 