import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuditLogService } from '../services/audit-log';
import { TokenBlacklistService } from '../services/token-blacklist';
import { config } from '../config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  deviceId?: string;
  sessionId?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function generateEmailLinkToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.emailLinkSecret, { expiresIn: '24h' });
}

export async function verifyToken(token: string, deviceId?: string, sessionId?: string): Promise<TokenPayload | null> {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      await AuditLogService.logAction(
        0,
        'unknown',
        'unknown',
        'token_verification',
        'failed',
        'Blacklisted token attempt',
        { token: token.slice(0, 10) + '...' }
      );
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Verify device and session if provided
    if (deviceId && decoded.deviceId !== deviceId) {
      await AuditLogService.logAction(
        decoded.userId,
        decoded.email,
        decoded.role,
        'token_verification',
        'failed',
        'Device ID mismatch',
        { expectedDeviceId: deviceId, tokenDeviceId: decoded.deviceId }
      );
      return null;
    }

    if (sessionId && decoded.sessionId !== sessionId) {
      await AuditLogService.logAction(
        decoded.userId,
        decoded.email,
        decoded.role,
        'token_verification',
        'failed',
        'Session ID mismatch',
        { expectedSessionId: sessionId, tokenSessionId: decoded.sessionId }
      );
      return null;
    }

    // Log successful verification
    await AuditLogService.logAction(
      decoded.userId,
      decoded.email,
      decoded.role,
      'token_verification',
      'success',
      'Token verified successfully',
      { deviceId, sessionId }
    );

    return decoded;
  } catch (error) {
    // Log token verification failures
    if (error instanceof jwt.JsonWebTokenError) {
      await AuditLogService.logAction(
        0,
        'unknown',
        'unknown',
        'token_verification',
        'failed',
        error.message,
        { error: error.name }
      );
    }
    return null;
  }
}

export function verifyEmailLinkToken(token: string): TokenPayload {
  return jwt.verify(token, config.emailLinkSecret) as TokenPayload;
}

// Helper function to revoke a token
export async function revokeToken(
  token: string,
  reason: string,
  userId: number,
  userEmail: string,
  userRole: string
): Promise<void> {
  await TokenBlacklistService.blacklistToken(token, reason, userId, userEmail, userRole);
} 