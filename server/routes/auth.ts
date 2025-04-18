import { Router } from 'express';
import { verifyToken } from '../utils/token';
import { checkRateLimit } from '../utils/rate-limiter';
import { AuditLogService } from '../services/audit-log';

const router = Router();

// Token verification endpoint
router.post('/verify-token', async (req, res) => {
  try {
    const { token, deviceId, sessionId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      req.ip,
      req.headers['user-agent'] as string,
      req.user?.id,
      req.user?.email,
      req.user?.role
    );

    if (!rateLimitResult.success) {
      return res.status(429).json({ error: rateLimitResult.message });
    }

    // Verify token
    const decoded = await verifyToken(token, deviceId, sessionId);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Log successful verification
    await AuditLogService.logAction(
      decoded.userId,
      decoded.email,
      decoded.role,
      'token_verification',
      'success',
      'Token verified via API endpoint',
      {
        deviceId,
        sessionId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    return res.json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 