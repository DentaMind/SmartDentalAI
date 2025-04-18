import express from 'express';
import { AIFeedbackService } from '../services/ai-feedback';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Submit new feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      practiceId,
      doctorId,
      patientId,
      formId,
      originalAiResult,
      overrideData,
      overrideType,
      overrideReason,
    } = req.body;

    const feedback = await AIFeedbackService.submitFeedback(
      practiceId,
      doctorId,
      patientId,
      formId,
      originalAiResult,
      overrideData,
      overrideType,
      overrideReason
    );

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get pending feedback (admin only)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const feedback = await AIFeedbackService.getPendingFeedback();
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Failed to fetch pending feedback:', error);
    res.status(500).json({ error: 'Failed to fetch pending feedback' });
  }
});

// Approve feedback (admin only)
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const feedback = await AIFeedbackService.approveFeedback(
      parseInt(id),
      req.user.id
    );

    res.status(200).json(feedback);
  } catch (error) {
    console.error('Failed to approve feedback:', error);
    res.status(500).json({ error: 'Failed to approve feedback' });
  }
});

// Reject feedback (admin only)
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const feedback = await AIFeedbackService.rejectFeedback(
      parseInt(id),
      req.user.id
    );

    res.status(200).json(feedback);
  } catch (error) {
    console.error('Failed to reject feedback:', error);
    res.status(500).json({ error: 'Failed to reject feedback' });
  }
});

export default router; 