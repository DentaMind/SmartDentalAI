import express from 'express';
import { AITrainingService } from '../services/ai-training';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Process approved feedback for training (admin only)
router.post('/process/:feedbackId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { feedbackId } = req.params;
    const result = await AITrainingService.processApprovedFeedback(parseInt(feedbackId));
    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to process feedback for training:', error);
    res.status(500).json({ error: 'Failed to process feedback for training' });
  }
});

// Get training metrics (admin only)
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const metrics = await AITrainingService.getTrainingMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Failed to get training metrics:', error);
    res.status(500).json({ error: 'Failed to get training metrics' });
  }
});

export default router; 