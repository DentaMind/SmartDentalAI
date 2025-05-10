
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { securityService } from '../services/security';

export function setupSecurityMiddleware(app: express.Express) {
  // Set security headers with Helmet
  // For development, use a more permissive CSP
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using development CSP configuration');
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http:", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'", "http:", "https:"],
            imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
            connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
            fontSrc: ["'self'", "data:", "http:", "https:"],
            objectSrc: ["'self'", "http:", "https:"],
            mediaSrc: ["'self'", "data:", "http:", "https:"],
            frameSrc: ["'self'", "http:", "https:"],
          },
        },
        // Allow iframes for development tools
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
      })
    );
  } else {
    // Production-grade security
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'", "data:"],
          },
        },
      })
    );
  }
  
  // Rate limiting for all API requests
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
    skip: (req) => req.path.startsWith('/healthcheck'), // Don't rate limit health checks
  });
  
  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);
  
  // Stronger rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again later',
  });
  
  // Apply stricter rate limiting to authentication routes
  app.use('/api/login', authLimiter);
  app.use('/api/register', authLimiter);
  
  // CSRF protection middleware
  app.use((req, res, next) => {
    // Skip for GET requests and non-API routes
    if (req.method === 'GET' || !req.path.startsWith('/api')) {
      return next();
    }
    
    // In development mode, skip CSRF protection
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }
    
    // Check CSRF token (in a real app, use a proper CSRF library)
    const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
    const sessionToken = (req as any).session?.csrfToken;
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      console.warn(`CSRF validation failed for ${req.path}`);
      return res.status(403).json({ message: 'CSRF validation failed' });
    }
    
    next();
  });
  
  // Add file monitoring for ransomware detection
  app.use(async (req, res, next) => {
    // Only check periodically (e.g. 1% of requests) to avoid performance impact
    if (Math.random() < 0.01) {
      const integrityCheck = await securityService.performIntegrityCheck();
      if (integrityCheck.status === 'compromised') {
        console.error('CRITICAL SECURITY ALERT: File integrity check failed');
        // In a real system, this could trigger an emergency response
      }
    }
    next();
  });
  
  // Log all API accesses
  app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = (req as any).user?.id;
    
    securityService.createAuditLog({
      userId,
      action: 'api_request',
      resource: req.path,
      ipAddress,
      userAgent,
      details: { method: req.method },
      result: 'success'
    }).catch(err => console.error('Error logging API access:', err));
    
    next();
  });
  
  // Error handler to prevent leaking sensitive information
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    
    // Log the error for auditing
    securityService.createAuditLog({
      userId: (req as any).user?.id,
      action: 'error',
      resource: req.path,
      details: { 
        errorName: err.name,
        errorMessage: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      result: 'error'
    }).catch(e => console.error('Error logging error:', e));
    
    // Don't expose error details in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'An unexpected error occurred' });
    }
    
    res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  });
}
