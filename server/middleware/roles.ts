import { Request, Response, NextFunction } from 'express';

// Define allowed roles
export type UserRole = 'dentist' | 'admin' | 'patient';

// Middleware factory that checks if user has required role
export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (should be set by auth middleware)
    const user = req.user as { role?: string } | undefined;

    if (!user || !user.role) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      return res.status(403).json({
        error: 'Forbidden', 
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Helper middleware for specific roles
export const doctorOnly = checkRole(['dentist']);
export const staffOrDoctor = checkRole(['admin', 'dentist']);
export const patientOnly = checkRole(['patient']);
export const anyRole = checkRole(['dentist', 'admin', 'patient']); 