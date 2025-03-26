import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { userCertifications, trainingModules } from '../../shared/schema';

/**
 * Middleware to check if a user has the required certification before accessing a feature
 * Can be used to restrict access to specific routes based on certification status
 * 
 * @param certificationType The type of certification required (hipaa, osha, ada, etc.)
 * @returns Middleware function that will allow or deny access
 */
export function requireCertification(certificationType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ensure the user is authenticated
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.session.user.id;

    try {
      // Find the training module for this certification type
      const modules = await db.select()
        .from(trainingModules)
        .where(eq(trainingModules.moduleType, certificationType))
        .where(eq(trainingModules.isActive, true));

      if (modules.length === 0) {
        // If the certification module doesn't exist, log it but allow access
        console.warn(`Required certification module '${certificationType}' not found`);
        return next();
      }

      const moduleId = modules[0].id;

      // Check if the user has this certification and it's completed
      const certifications = await db.select()
        .from(userCertifications)
        .where(and(
          eq(userCertifications.userId, userId),
          eq(userCertifications.moduleId, moduleId),
          eq(userCertifications.status, 'completed')
        ));

      if (certifications.length === 0) {
        // User doesn't have the required certification
        return res.status(403).json({ 
          message: 'Certification required',
          requiredCertification: certificationType,
          redirectTo: '/training'
        });
      }

      // Check if the certification has expired
      const certification = certifications[0];
      if (certification.expiresAt && new Date(certification.expiresAt) < new Date()) {
        return res.status(403).json({ 
          message: 'Certification has expired',
          requiredCertification: certificationType,
          redirectTo: '/training' 
        });
      }

      // User has the required certification, proceed
      next();
    } catch (error) {
      console.error('Error checking certification:', error);
      // In case of an error, allow access rather than blocking legitimate users
      next();
    }
  };
}

/**
 * Utility function to check if a user has a specific certification
 * Can be used to conditionally show/hide UI elements
 * 
 * @param userId The user ID
 * @param certificationType The type of certification to check
 * @returns True if the user has the certification, false otherwise
 */
export async function checkUserCertification(userId: number, certificationType: string): Promise<boolean> {
  try {
    // Find the training module for this certification type
    const modules = await db.select()
      .from(trainingModules)
      .where(eq(trainingModules.moduleType, certificationType))
      .where(eq(trainingModules.isActive, true));

    if (modules.length === 0) {
      return false;
    }

    const moduleId = modules[0].id;

    // Check if the user has this certification and it's completed
    const certifications = await db.select()
      .from(userCertifications)
      .where(and(
        eq(userCertifications.userId, userId),
        eq(userCertifications.moduleId, moduleId),
        eq(userCertifications.status, 'completed')
      ));

    if (certifications.length === 0) {
      return false;
    }

    // Check if the certification has expired
    const certification = certifications[0];
    if (certification.expiresAt && new Date(certification.expiresAt) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking certification:', error);
    return false;
  }
}

/**
 * Get all certification statuses for a user
 * 
 * @param userId The user ID
 * @returns Object with certification types as keys and their status as values
 */
export async function getUserCertifications(userId: number): Promise<Record<string, string>> {
  try {
    // Join userCertifications and trainingModules to get module types
    const result = await db.select({
      moduleType: trainingModules.moduleType,
      status: userCertifications.status,
      expiresAt: userCertifications.expiresAt
    })
    .from(userCertifications)
    .innerJoin(trainingModules, eq(userCertifications.moduleId, trainingModules.id))
    .where(eq(userCertifications.userId, userId));

    // Convert to a record of moduleType -> status, handling expired certifications
    const certStatuses: Record<string, string> = {};
    
    result.forEach(cert => {
      let status = cert.status;
      
      // If the certification has expired, mark it as such
      if (status === 'completed' && cert.expiresAt && new Date(cert.expiresAt) < new Date()) {
        status = 'expired';
      }
      
      certStatuses[cert.moduleType] = status;
    });
    
    return certStatuses;
  } catch (error) {
    console.error('Error getting user certifications:', error);
    return {};
  }
}