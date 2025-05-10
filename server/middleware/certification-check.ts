import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { userCertifications, trainingModules } from 'shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Session } from 'express-session';

/**
 * Middleware to check if a user is a training admin
 * Used to restrict access to training module management
 */
export const requireTrainingAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user?.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRole = req.session.user.role;
  
  // Only admins and super_admins can manage training modules
  if (userRole === 'admin' || userRole === 'super_admin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Training administrator role required.' });
};

/**
 * Middleware to check if a user has the required certification
 * Used to restrict access to certain features until certification is completed
 */
export const requireCertification = (moduleType: string, redirectRoute = '/training-dashboard') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.session || !req.session.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.session.user.id;

    try {
      // Query for user's certification of the specified type
      const certifications = await db.select()
        .from(userCertifications)
        .innerJoin(trainingModules, eq(userCertifications.moduleId, trainingModules.id))
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(trainingModules.moduleType, moduleType),
            eq(userCertifications.status, 'completed')
          )
        );

      // If user has a valid certification, allow access
      if (certifications.length > 0) {
        return next();
      }

      // If API request, return 403 with message
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ 
          message: 'Certification required',
          requiredCertification: moduleType,
          redirectRoute
        });
      }

      // For page requests, redirect to training dashboard
      return res.redirect(redirectRoute);
    } catch (error) {
      console.error('Certification check error:', error);
      return res.status(500).json({ message: 'Error checking certification status' });
    }
  };
};

/**
 * Middleware to check if a user has any of the required certifications
 * Used for less strict access requirements (any one of several certifications)
 */
export const requireAnyCertification = (moduleTypes: string[], redirectRoute = '/training-dashboard') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.session || !req.session.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.session.user.id;

    try {
      // Query for user's certifications of any of the specified types
      const certifications = await db.select()
        .from(userCertifications)
        .innerJoin(trainingModules, eq(userCertifications.moduleId, trainingModules.id))
        .where(
          and(
            eq(userCertifications.userId, userId),
            inArray(trainingModules.moduleType, moduleTypes),
            eq(userCertifications.status, 'completed')
          )
        );

      // If user has any valid certification in the list, allow access
      if (certifications.length > 0) {
        return next();
      }

      // If API request, return 403 with message
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ 
          message: 'Certification required',
          requiredCertifications: moduleTypes,
          redirectRoute
        });
      }

      // For page requests, redirect to training dashboard
      return res.redirect(redirectRoute);
    } catch (error) {
      console.error('Certification check error:', error);
      return res.status(500).json({ message: 'Error checking certification status' });
    }
  };
};

/**
 * Middleware to check if a user has active certifications based on role
 * Admin users bypass this check
 */
export const requireRoleBasedCertifications = (redirectRoute = '/training-dashboard') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.session || !req.session.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    // Admins bypass certification checks
    if (userRole === 'admin' || userRole === 'super_admin') {
      return next();
    }

    try {
      // Get required certifications for the user's role
      const requiredModules = await db.select()
        .from(trainingModules)
        .where(
          inArray('requiredRoles', [userRole])
        );

      if (requiredModules.length === 0) {
        // No certifications required for this role
        return next();
      }

      const requiredModuleIds = requiredModules.map(module => module.id);

      // Check if user has completed the required certifications for their role
      const completedCertifications = await db.select()
        .from(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userId),
            inArray(userCertifications.moduleId, requiredModuleIds),
            eq(userCertifications.status, 'completed')
          )
        );

      const completedModuleIds = new Set(completedCertifications.map(cert => cert.moduleId));
      
      // Check if all required certifications are completed
      const missingCertifications = requiredModules.filter(module => !completedModuleIds.has(module.id));

      if (missingCertifications.length === 0) {
        // All required certifications completed
        return next();
      }

      // If API request, return 403 with message
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ 
          message: 'Required certifications incomplete',
          missingCertifications: missingCertifications.map(m => ({ 
            id: m.id, 
            title: m.title, 
            type: m.moduleType 
          })),
          redirectRoute
        });
      }

      // For page requests, redirect to training dashboard
      return res.redirect(redirectRoute);
    } catch (error) {
      console.error('Role-based certification check error:', error);
      return res.status(500).json({ message: 'Error checking certification status' });
    }
  };
};

// Helper to add certification information to user session
export const attachCertificationInfo = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.user?.id) {
      return next();
    }

    try {
      const userId = req.session.user.id;
      
      // Get user's certifications
      const certifications = await db.select()
        .from(userCertifications)
        .innerJoin(trainingModules, eq(userCertifications.moduleId, trainingModules.id))
        .where(eq(userCertifications.userId, userId));
      
      // Add to session for easy access
      (req.session as any).certifications = certifications.map(row => ({
        id: row.user_certifications.id,
        moduleId: row.user_certifications.moduleId,
        status: row.user_certifications.status,
        progress: row.user_certifications.progress,
        moduleType: row.training_modules.moduleType,
        title: row.training_modules.title
      }));
      
      next();
    } catch (error) {
      console.error('Error attaching certification info:', error);
      next();
    }
  };
};