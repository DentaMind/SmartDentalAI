import { OverrideReview, User } from '../../shared/schema';
import { MemStorage } from '../storage';
import { Notification } from '../../shared/schema';

const REVIEW_DEADLINE_HOURS = 24;
const REASSIGNMENT_DEADLINE_HOURS = 48;
const ESCALATION_NOTIFICATION_TEMPLATE = {
  type: 'review_escalation',
  message: 'Review has exceeded deadline and requires attention',
};
const REASSIGNMENT_NOTIFICATION_TEMPLATE = {
  type: 'review_reassignment',
  message: 'Review has been reassigned due to inactivity',
};

export class ReviewEscalationService {
  constructor(private storage: MemStorage) {}

  async checkForOverdueReviews(): Promise<void> {
    const now = new Date();
    const reviews = await this.storage.getPendingReviews();

    for (const review of reviews) {
      const hoursSinceCreation = (now.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation >= REASSIGNMENT_DEADLINE_HOURS) {
        await this.handleReassignment(review);
      } else if (hoursSinceCreation >= REVIEW_DEADLINE_HOURS) {
        await this.handleOverdueReview(review);
      }
    }
  }

  private async handleOverdueReview(review: OverrideReview): Promise<void> {
    // Create escalation notification
    const notification: Notification = {
      id: this.storage.getNextId('notification'),
      userId: review.reviewerId,
      type: ESCALATION_NOTIFICATION_TEMPLATE.type,
      message: ESCALATION_NOTIFICATION_TEMPLATE.message,
      read: false,
      metadata: {
        reviewId: review.id,
        overrideId: review.overrideId,
        hoursOverdue: Math.floor(
          (new Date().getTime() - review.createdAt.getTime()) / (1000 * 60 * 60)
        ),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storage.createNotification(notification);

    // Update review with escalation flag
    await this.storage.updateOverrideReview(review.id, {
      status: 'pending',
      notes: review.notes + '\n\n[ESCALATED] Review exceeded deadline',
    });
  }

  private async handleReassignment(review: OverrideReview): Promise<void> {
    // Get backup reviewers (users with reviewer role)
    const backupReviewers = await this.storage.getUsersByRole('reviewer');
    if (backupReviewers.length === 0) {
      console.error('No backup reviewers available for reassignment');
      return;
    }

    // Find a backup reviewer who hasn't reviewed this override
    const newReviewer = this.selectNewReviewer(backupReviewers, review);
    if (!newReviewer) {
      console.error('No suitable backup reviewer found');
      return;
    }

    // Create reassignment notification for both old and new reviewers
    const notifications: Notification[] = [
      {
        id: this.storage.getNextId('notification'),
        userId: review.reviewerId,
        type: REASSIGNMENT_NOTIFICATION_TEMPLATE.type,
        message: `Review #${review.id} has been reassigned to ${newReviewer.name}`,
        read: false,
        metadata: {
          reviewId: review.id,
          overrideId: review.overrideId,
          newReviewerId: newReviewer.id,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.storage.getNextId('notification'),
        userId: newReviewer.id,
        type: REASSIGNMENT_NOTIFICATION_TEMPLATE.type,
        message: `Review #${review.id} has been reassigned to you`,
        read: false,
        metadata: {
          reviewId: review.id,
          overrideId: review.overrideId,
          previousReviewerId: review.reviewerId,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create notifications
    for (const notification of notifications) {
      await this.storage.createNotification(notification);
    }

    // Update review with new reviewer and reassignment note
    await this.storage.updateOverrideReview(review.id, {
      reviewerId: newReviewer.id,
      status: 'pending',
      notes: review.notes + `\n\n[REASSIGNED] Review reassigned to ${newReviewer.name} after ${REASSIGNMENT_DEADLINE_HOURS} hours of inactivity`,
    });
  }

  private selectNewReviewer(backupReviewers: User[], review: OverrideReview): User | undefined {
    // Filter out the current reviewer
    const availableReviewers = backupReviewers.filter(r => r.id !== review.reviewerId);
    
    if (availableReviewers.length === 0) return undefined;

    // Simple round-robin selection for now
    // In a real implementation, you might want to consider:
    // - Reviewer workload
    // - Specialization
    // - Previous review history
    return availableReviewers[Math.floor(Math.random() * availableReviewers.length)];
  }
} 