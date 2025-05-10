import { Router } from 'express';
import { MemStorage } from '../storage';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { OpenAI } from 'openai';
import { config } from '../config';
import { emailService } from '../services/email';

const router = Router();
const storage = new MemStorage();
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// ... existing routes ...

router.post(
  '/compare/summary',
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const {
        version1,
        version2,
        accuracyDeltas,
        thresholdDeltas,
        reviewImpactDelta,
      } = req.body;

      // Validate input
      if (!version1 || !version2 || !accuracyDeltas || !thresholdDeltas || reviewImpactDelta === undefined) {
        return res.status(400).json({ error: 'Missing required comparison data' });
      }

      // Format the data for the AI prompt
      const accuracyChanges = Object.entries(accuracyDeltas)
        .map(([condition, delta]) => `${condition}: ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`)
        .join(', ');

      const thresholdChanges = Object.entries(thresholdDeltas)
        .map(([condition, delta]) => `${condition}: ${delta > 0 ? '+' : ''}${delta.toFixed(2)}`)
        .join(', ');

      const reviewImpact = `${reviewImpactDelta > 0 ? '+' : ''}${reviewImpactDelta} reviews`;

      // Generate the prompt
      const prompt = `Generate a concise, professional summary comparing dental AI model versions ${version1} and ${version2}. Focus on key changes in accuracy and confidence thresholds. Use natural language and highlight significant improvements or regressions.

Data:
Accuracy changes: ${accuracyChanges}
Confidence threshold changes: ${thresholdChanges}
Review impact: ${reviewImpact}

Format the response as a single paragraph, focusing on the most significant changes. Use percentages for accuracy changes and decimal points for threshold changes.`;

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a dental AI expert analyzing model version changes. Provide clear, concise summaries focusing on clinical impact."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const summary = completion.choices[0].message.content?.trim();

      if (!summary) {
        throw new Error('Failed to generate summary');
      }

      res.json({ summary });
    } catch (error) {
      console.error('Error generating version comparison summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  }
);

router.post(
  '/compare/email',
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const {
        version1,
        version2,
        accuracyDeltas,
        thresholdDeltas,
        reviewImpactDelta,
        summary,
        recipientEmail,
      } = req.body;

      // Validate input
      if (!version1 || !version2 || !accuracyDeltas || !thresholdDeltas || 
          reviewImpactDelta === undefined || !summary || !recipientEmail) {
        return res.status(400).json({ error: 'Missing required data' });
      }

      // Send email with comparison report
      await emailService.sendVersionComparison({
        version1,
        version2,
        accuracyDeltas,
        thresholdDeltas,
        reviewImpactDelta,
        summary,
        recipientEmail,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending version comparison email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
);

export default router; 