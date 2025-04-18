import { db } from '../db';
import { tokenBlacklist } from '../../shared/schema';
import { AuditLogService } from './audit-log';

export class TokenBlacklistService {
  static async blacklistToken(
    token: string,
    reason: string,
    userId: number,
    userEmail: string,
    userRole: string
  ) {
    try {
      const [blacklistedToken] = await db.insert(tokenBlacklist).values({
        token,
        reason,
        blacklistedAt: new Date(),
        userId,
        userEmail,
        userRole
      }).returning();

      // Log the blacklisting action
      await AuditLogService.logAction(
        userId,
        userEmail,
        userRole,
        'token_blacklist',
        'success',
        `Token blacklisted: ${reason}`,
        { token: token.slice(0, 10) + '...' } // Only log partial token for security
      );

      return blacklistedToken;
    } catch (error) {
      console.error('Failed to blacklist token:', error);
      throw error;
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedToken = await db.query.tokenBlacklist.findFirst({
        where: (blacklist, { eq }) => eq(blacklist.token, token)
      });

      if (blacklistedToken) {
        // Log the attempt to use a blacklisted token
        await AuditLogService.logAction(
          0, // Unknown user
          'unknown',
          'unknown',
          'blacklisted_token_attempt',
          'failed',
          'Attempt to use blacklisted token',
          { token: token.slice(0, 10) + '...' }
        );
      }

      return !!blacklistedToken;
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false; // Fail open in case of database issues
    }
  }

  static async getBlacklistedTokens(
    userId?: number,
    limit: number = 100
  ) {
    try {
      const query = db.query.tokenBlacklist.findMany({
        where: userId 
          ? (blacklist, { eq }) => eq(blacklist.userId, userId)
          : undefined,
        limit,
        orderBy: (blacklist, { desc }) => desc(blacklist.blacklistedAt)
      });

      return query;
    } catch (error) {
      console.error('Failed to fetch blacklisted tokens:', error);
      throw error;
    }
  }
} 