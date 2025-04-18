import express from 'express';
import { AIModelService } from '../services/ai-model';
import { authenticateToken } from '../middleware/auth';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import { AuditLogService } from '../services/audit-log';
import { checkRateLimit } from '../utils/rate-limiter';
import { verifyEmailLinkToken } from '../utils/token';

const router = express.Router();

// Initialize automated training job
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Starting automated model training...');
    await AIModelService.trainNewVersion();
  } catch (error) {
    console.error('Automated training failed:', error);
  }
});

// Get model versions (admin only)
router.get('/versions', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const versions = await AIModelService.getModelVersions();
    res.status(200).json(versions);
  } catch (error) {
    console.error('Failed to get model versions:', error);
    res.status(500).json({ error: 'Failed to get model versions' });
  }
});

// Train new model version
router.post('/train', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await AIModelService.trainNewVersion();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error training new model version:', error);
    res.status(500).json({ error: 'Failed to train new model version' });
  }
});

// Deploy model version
router.post('/deploy/:version', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { version } = req.params;
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await AIModelService.deployVersion(version, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error deploying model version:', error);
    res.status(500).json({ error: 'Failed to deploy model version' });
  }
});

// Rollback to a previous model version
router.post('/rollback/:version', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { version } = req.params;
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await AIModelService.rollbackToVersion(version, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error rolling back model version:', error);
    res.status(500).json({ error: error.message || 'Failed to rollback model version' });
  }
});

// Get audit log (admin only)
router.get('/audit-log', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const logs = await AIModelService.getAuditLog();
    res.status(200).json(logs);
  } catch (error) {
    console.error('Failed to get audit log:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// Get A/B testing summary
router.get('/ab-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const summary = await AIModelService.getABSummary();
    res.json(summary);
  } catch (error) {
    console.error('Failed to get A/B summary:', error);
    res.status(500).json({ error: 'Failed to get A/B summary' });
  }
});

// New route: Secure promotion via token
router.get('/promote/:version', async (req, res) => {
  try {
    const { version } = req.params;
    const { token, source, action } = req.query;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.success) {
      await AuditLogService.logAction({
        action: 'promote_attempt',
        status: 'failed',
        details: 'Rate limit exceeded',
        metadata: { ip, userAgent, version, source, action }
      });
      return res.status(429).send(`
        <h2>❌ Too many requests</h2>
        <p>${rateLimitResult.message}</p>
      `);
    }

    // Verify token
    const decoded = verifyEmailLinkToken(token as string);

    if (!decoded || decoded.role !== 'admin') {
      await AuditLogService.logAction({
        userId: decoded?.userId,
        action: 'promote_attempt',
        status: 'failed',
        details: 'Unauthorized access attempt',
        metadata: { ip, userAgent, version, source, action }
      });
      return res.status(403).send(`
        <h2>❌ Unauthorized</h2>
        <p>You do not have permission to perform this action.</p>
      `);
    }

    const result = await AIModelService.deployVersion(
      version,
      decoded.userId,
      `Promoted via email by ${decoded.email}`
    );

    await AuditLogService.logAction({
      userId: decoded.userId,
      action: 'promote',
      status: 'success',
      details: result.message,
      metadata: { ip, userAgent, version, source, action }
    });

    return res.send(`
      <h2>✅ ${result.message}</h2>
      <p>Action logged and audit trail created.</p>
    `);
  } catch (err) {
    return res.status(401).send(`
      <h2>❌ Invalid or expired link</h2>
      <p>Please request a new link from the admin dashboard.</p>
    `);
  }
});

// Optional: rollback endpoint
router.get('/rollback/:version', async (req, res) => {
  try {
    const { version } = req.params;
    const { token, source, action } = req.query;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.success) {
      await AuditLogService.logAction({
        action: 'rollback_attempt',
        status: 'failed',
        details: 'Rate limit exceeded',
        metadata: { ip, userAgent, version, source, action }
      });
      return res.status(429).send(`
        <h2>❌ Too many requests</h2>
        <p>${rateLimitResult.message}</p>
      `);
    }

    // Verify token
    const decoded = verifyEmailLinkToken(token as string);

    if (!decoded || decoded.role !== 'admin') {
      await AuditLogService.logAction({
        userId: decoded?.userId,
        action: 'rollback_attempt',
        status: 'failed',
        details: 'Unauthorized access attempt',
        metadata: { ip, userAgent, version, source, action }
      });
      return res.status(403).send(`
        <h2>❌ Unauthorized</h2>
        <p>You do not have permission to perform this action.</p>
      `);
    }

    const result = await AIModelService.rollbackToVersion(
      version,
      decoded.userId,
      `Rollback via email by ${decoded.email}`
    );

    await AuditLogService.logAction({
      userId: decoded.userId,
      action: 'rollback',
      status: 'success',
      details: result.message,
      metadata: { ip, userAgent, version, source, action }
    });

    return res.send(`
      <h2>✅ ${result.message}</h2>
      <p>Action logged and audit trail created.</p>
    `);
  } catch (err) {
    return res.status(401).send(`
      <h2>❌ Invalid or expired link</h2>
      <p>Please request a new link from the admin dashboard.</p>
    `);
  }
});

export default router; 