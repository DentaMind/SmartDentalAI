import { db } from '../db';
import { aiFeedbackQueue } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export class AITrainingService {
  static async processApprovedFeedback(feedbackId: number) {
    try {
      // Get the approved feedback
      const feedback = await db.query.aiFeedbackQueue.findFirst({
        where: eq(aiFeedbackQueue.id, feedbackId),
      });

      if (!feedback || feedback.status !== 'approved') {
        throw new Error('Feedback not found or not approved');
      }

      // Prepare training data
      const trainingData = {
        originalResult: feedback.originalAiResult,
        overrideData: feedback.overrideData,
        overrideType: feedback.overrideType,
        overrideReason: feedback.overrideReason,
        metadata: {
          practiceId: feedback.practiceId,
          doctorId: feedback.doctorId,
          patientId: feedback.patientId,
          formId: feedback.formId,
          approvedAt: feedback.approvedAt,
          approvedBy: feedback.approvedBy,
        },
      };

      // TODO: Integrate with actual ML training pipeline
      // This is where we would:
      // 1. Send data to training service
      // 2. Update model version
      // 3. Track training metrics
      console.log('Processing training data:', trainingData);

      // Mark feedback as processed
      await db
        .update(aiFeedbackQueue)
        .set({ status: 'processed' })
        .where(eq(aiFeedbackQueue.id, feedbackId));

      return { success: true, message: 'Feedback processed for training' };
    } catch (error) {
      console.error('Failed to process approved feedback:', error);
      throw error;
    }
  }

  static async getTrainingMetrics() {
    try {
      // Get feedback statistics
      const feedbackStats = await db.query.aiFeedbackQueue.findMany({
        where: eq(aiFeedbackQueue.status, 'approved'),
        orderBy: (feedback, { desc }) => desc(feedback.approvedAt),
      });

      // Calculate metrics
      const metrics = {
        totalApproved: feedbackStats.length,
        byType: feedbackStats.reduce((acc, feedback) => {
          acc[feedback.overrideType] = (acc[feedback.overrideType] || 0) + 1;
          return acc;
        }, {}),
        byPractice: feedbackStats.reduce((acc, feedback) => {
          acc[feedback.practiceId] = (acc[feedback.practiceId] || 0) + 1;
          return acc;
        }, {}),
        byDoctor: feedbackStats.reduce((acc, feedback) => {
          acc[feedback.doctorId] = (acc[feedback.doctorId] || 0) + 1;
          return acc;
        }, {}),
      };

      return metrics;
    } catch (error) {
      console.error('Failed to get training metrics:', error);
      throw error;
    }
  }
} 