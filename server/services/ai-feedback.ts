import { db } from '../db';
import { aiFeedbackQueue } from '../../shared/schema';
import { NewAiFeedbackQueue } from '../../shared/types';

export class AIFeedbackService {
  static async submitFeedback(
    practiceId: number,
    doctorId: number,
    patientId: number,
    formId: number,
    originalAiResult: any,
    overrideData: any,
    overrideType: 'triage' | 'symptoms' | 'diagnosis' | 'treatment',
    overrideReason?: string
  ) {
    try {
      // First, save the override locally in the practice's database
      // This would be handled by the practice's local storage service
      
      // Then, submit to the central feedback queue
      const feedback: NewAiFeedbackQueue = {
        practiceId,
        doctorId,
        patientId,
        formId,
        originalAiResult,
        overrideData,
        overrideType,
        overrideReason,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [result] = await db
        .insert(aiFeedbackQueue)
        .values(feedback)
        .returning();

      return result;
    } catch (error) {
      console.error('Failed to submit AI feedback:', error);
      throw error;
    }
  }

  static async getPendingFeedback() {
    try {
      return await db.query.aiFeedbackQueue.findMany({
        where: (feedback, { eq }) => eq(feedback.status, 'pending'),
        orderBy: (feedback, { desc }) => desc(feedback.createdAt),
      });
    } catch (error) {
      console.error('Failed to fetch pending feedback:', error);
      throw error;
    }
  }

  static async approveFeedback(feedbackId: number, approvedBy: number) {
    try {
      const [result] = await db
        .update(aiFeedbackQueue)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          approvedBy,
          updatedAt: new Date(),
        })
        .where(eq(aiFeedbackQueue.id, feedbackId))
        .returning();

      return result;
    } catch (error) {
      console.error('Failed to approve feedback:', error);
      throw error;
    }
  }

  static async rejectFeedback(feedbackId: number, approvedBy: number) {
    try {
      const [result] = await db
        .update(aiFeedbackQueue)
        .set({
          status: 'rejected',
          approvedAt: new Date(),
          approvedBy,
          updatedAt: new Date(),
        })
        .where(eq(aiFeedbackQueue.id, feedbackId))
        .returning();

      return result;
    } catch (error) {
      console.error('Failed to reject feedback:', error);
      throw error;
    }
  }
} 