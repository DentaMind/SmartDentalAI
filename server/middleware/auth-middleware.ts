
import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/security';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from various sources
  const token = 
    req.headers.authorization?.split(' ')[1] || // Bearer token
    req.cookies?.token || // Cookie
    req.query.token as string; // Query parameter
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = securityService.verifyJWT(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Add user data to request
    (req as any).user = decoded;
    
    // Audit the successful auth
    securityService.createAuditLog({
      userId: (decoded as any).userId,
      action: 'authenticate',
      resource: 'auth_system',
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown'
    });
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated
    if (!(req as any).user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRole = (req as any).user.role;
    
    if (!roles.includes(userRole)) {
      // Audit the failed authorization
      securityService.createAuditLog({
        userId: (req as any).user.userId,
        action: 'authorize',
        resource: req.path,
        result: 'error',
        details: { 
          requiredRoles: roles, 
          userRole
        }
      });
      
      return res.status(403).json({ 
        message: 'Insufficient permissions', 
        required: roles,
        current: userRole
      });
    }
    
    next();
  };
};
