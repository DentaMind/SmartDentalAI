import { AIModelService } from '../services/ai-model';
import { db } from '../db';
import { aiFeedbackQueue } from '../../shared/schema';
import { eq, and, count } from 'drizzle-orm';
import cron from 'node-cron';

const THRESHOLD = 25; // can be tuned

cron.schedule('0 * * * *', async () => {
  try {
    console.log('[Auto-Retrain] Checking feedback queue...');
    const [feedbackCount] = await db
      .select({ count: count() })
      .from(aiFeedbackQueue)
      .where(and(eq(aiFeedbackQueue.status, 'approved'), eq(aiFeedbackQueue.processed, false)));

    if (feedbackCount.count >= THRESHOLD) {
      console.log(`[Auto-Retrain] Threshold met (${feedbackCount.count}), starting training.`);
      await AIModelService.trainNewVersion();
    } else {
      console.log(`[Auto-Retrain] Only ${feedbackCount.count} approved feedbacks — skipping.`);
    }
  } catch (err) {
    console.error('[Auto-Retrain] Failed to check or train model:', err);
  }
}); 