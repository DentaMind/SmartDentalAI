import cron from 'node-cron';
import { AIModelService } from '../services/ai-model';
import { AIReportService } from '../services/ai-report';
import { db } from '../db';
import { aiModelVersions } from '../../shared/schema';
import { eq } from 'drizzle-orm';

cron.schedule('0 9 * * 1', async () => {
  console.log('[AI] Weekly model auto-suggest check started...');

  const autoSuggest = process.env.AUTO_SUGGEST_ENABLED === 'true';
  if (!autoSuggest) {
    console.log('[AI] Auto-suggest is disabled — skipping.');
    return;
  }

  try {
    const summary = await AIModelService.getABSummary();
    if (summary.length === 0) {
      console.log('[AI] No A/B testing data available — skipping.');
      return;
    }

    const versionScores = summary.map(s => ({
      version: s.version,
      score: (s.improved - s.worsened) / s.total
    }));

    const best = versionScores.reduce((a, b) => (a.score > b.score ? a : b));
    const current = await db.select().from(aiModelVersions).where(eq(aiModelVersions.status, 'deployed'));

    if (current[0]?.version !== best.version) {
      await AIModelService.deployVersion(best.version, 1, `Auto-promoted on schedule: ${best.score * 100}% net improvement`);
      console.log(`[AI] Auto-deployed model ${best.version}`);
    } else {
      console.log('[AI] Current model is already the best — no action taken.');
    }

    // Send weekly performance report
    await AIReportService.sendWeeklyReport();
  } catch (err) {
    console.error('[AI] Weekly model suggest failed:', err);
  }
}); 