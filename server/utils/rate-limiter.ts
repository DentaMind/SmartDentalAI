import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { AuditLogService } from '../services/audit-log';

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Configure rate limits
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 5, // Number of points
  duration: 60 * 60, // Per hour
  blockDuration: 60 * 60, // Block for 1 hour if limit exceeded
  keyPrefix: 'rate_limit:', // Redis key prefix
});

export async function checkRateLimit(
  ip: string,
  userAgent: string,
  userId?: number,
  userEmail?: string,
  userRole?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await rateLimiter.consume(ip);
    return { success: true };
  } catch (error) {
    // Log rate limit violation
    if (userId && userEmail && userRole) {
      await AuditLogService.logAction(
        userId,
        userEmail,
        userRole,
        'rate_limit_exceeded',
        'failed',
        `Rate limit exceeded for IP: ${ip}`,
        {
          ip,
          userAgent,
          remainingPoints: error.remainingPoints,
          msBeforeNext: error.msBeforeNext,
        }
      );
    }

    return {
      success: false,
      message: 'Too many requests. Please try again later.',
    };
  }
}

// Reset rate limit for testing
export async function resetRateLimit(ip: string) {
  await rateLimiter.delete(ip);
}

// Get rate limit info
export async function getRateLimitInfo(ip: string) {
  const res = await rateLimiter.get(ip);
  return {
    remainingPoints: res?.remainingPoints || 0,
    consumedPoints: res?.consumedPoints || 0,
    msBeforeNext: res?.msBeforeNext || 0,
  };
} 