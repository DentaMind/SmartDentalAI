import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { db } from '../db';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  trainingModules, 
  userCertifications,
  users
} from '../../shared/schema';
import { storage } from '../storage';
import { checkUserCertification, getUserCertifications } from '../middleware/certification-check';

const router = express.Router();

/**
 * Get all training modules
 * Accessible by: All authenticated users
 */
router.get('/modules', requireAuth, async (req, res) => {
  try {
    const modules = await db.select()
      .from(trainingModules)
      .where(eq(trainingModules.isActive, true));
    
    res.json(modules);
  } catch (error) {
    console.error('Error fetching training modules:', error);
    res.status(500).json({ message: 'Failed to fetch training modules' });
  }
});

/**
 * Get all training modules required for a specific role
 * Accessible by: All authenticated users
 */
router.get('/modules/role/:role', requireAuth, async (req, res) => {
  try {
    const { role } = req.params;
    
    // Find all modules where this role is in the requiredRoles array
    const modules = await db.select()
      .from(trainingModules)
      .where(eq(trainingModules.isActive, true));
    
    // Filter modules for this role (doing this in JS since JSON array filtering in SQL is complex)
    const roleModules = modules.filter(module => {
      const requiredRoles = module.requiredRoles as string[];
      return requiredRoles.includes(role) || requiredRoles.includes('all');
    });
    
    res.json(roleModules);
  } catch (error) {
    console.error('Error fetching role-specific training modules:', error);
    res.status(500).json({ message: 'Failed to fetch training modules for this role' });
  }
});

/**
 * Get a specific training module
 * Accessible by: All authenticated users
 */
router.get('/modules/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const module = await db.select()
      .from(trainingModules)
      .where(eq(trainingModules.id, parseInt(id)))
      .limit(1);
    
    if (module.length === 0) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    res.json(module[0]);
  } catch (error) {
    console.error('Error fetching training module:', error);
    res.status(500).json({ message: 'Failed to fetch training module' });
  }
});

/**
 * Get all certifications for a user
 * Accessible by: The user themselves or admins/managers
 */
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.role;
    
    // Only allow users to view their own certifications or admins/managers to view any
    if (
      requestingUserId !== parseInt(userId) && 
      !['admin', 'manager'].includes(requestingUserRole)
    ) {
      return res.status(403).json({ message: 'Not authorized to view these certifications' });
    }
    
    // Get all certifications for this user
    const certifications = await db.select({
      certification: userCertifications,
      module: trainingModules
    })
    .from(userCertifications)
    .innerJoin(
      trainingModules, 
      eq(userCertifications.moduleId, trainingModules.id)
    )
    .where(eq(userCertifications.userId, parseInt(userId)));
    
    res.json(certifications);
  } catch (error) {
    console.error('Error fetching user certifications:', error);
    res.status(500).json({ message: 'Failed to fetch user certifications' });
  }
});

/**
 * Check if a user has a specific certification
 * Accessible by: All authenticated users (for UI display purposes)
 */
router.get('/check/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    
    if (!type) {
      return res.status(400).json({ message: 'Certification type required' });
    }
    
    const certificationType = type as string;
    const isCertified = await checkUserCertification(parseInt(userId), certificationType);
    
    // Get additional details if needed for UI display
    const certStatuses = await getUserCertifications(parseInt(userId));
    const status = certStatuses[certificationType] || 'not_started';
    
    // Get expiration date if available
    let expiresAt = null;
    if (isCertified) {
      const modules = await db.select()
        .from(trainingModules)
        .where(eq(trainingModules.moduleType, certificationType))
        .limit(1);
      
      if (modules.length > 0) {
        const moduleId = modules[0].id;
        
        const certifications = await db.select()
          .from(userCertifications)
          .where(and(
            eq(userCertifications.userId, parseInt(userId)),
            eq(userCertifications.moduleId, moduleId)
          ))
          .limit(1);
        
        if (certifications.length > 0) {
          expiresAt = certifications[0].expiresAt;
        }
      }
    }
    
    res.json({
      certified: isCertified,
      status,
      expiresAt
    });
  } catch (error) {
    console.error('Error checking certification:', error);
    res.status(500).json({ message: 'Failed to check certification status' });
  }
});

/**
 * New route to get all staff members with their certification status
 * Used for the scheduler view and training dashboard
 * Accessible by: Admins, managers, and schedulers
 */
router.get('/staff', requireAuth, requireRole(['admin', 'manager', 'staff']), async (req, res) => {
  try {
    // Get all staff members (non-patients)
    const staffUsers = await db.select()
      .from(users)
      .where(inArray(users.role, ['doctor', 'assistant', 'hygienist', 'staff', 'manager', 'admin']));
    
    // Get certification status for each user
    const staffWithCertifications = await Promise.all(
      staffUsers.map(async (user) => {
        const certStatuses = await getUserCertifications(user.id);
        
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          certifications: certStatuses
        };
      })
    );
    
    res.json(staffWithCertifications);
  } catch (error) {
    console.error('Error fetching staff certifications:', error);
    res.status(500).json({ message: 'Failed to fetch staff certification status' });
  }
});

/**
 * Route to record a training module completion
 * Used when a user finishes a quiz
 * Accessible by: All authenticated users (for their own certifications)
 */
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const { moduleId, score } = req.body;
    const userId = req.user?.id;
    
    if (!moduleId || score === undefined) {
      return res.status(400).json({ message: 'Module ID and score are required' });
    }
    
    // Get the module to check passing score
    const modules = await db.select()
      .from(trainingModules)
      .where(eq(trainingModules.id, moduleId))
      .limit(1);
    
    if (modules.length === 0) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    const module = modules[0];
    const passingScore = module.passingScore || 90;
    const passed = score >= passingScore;
    
    // Check if user already has a record for this module
    const existingCerts = await db.select()
      .from(userCertifications)
      .where(and(
        eq(userCertifications.userId, userId),
        eq(userCertifications.moduleId, moduleId)
      ))
      .limit(1);
    
    let certification;
    const now = new Date();
    
    // Calculate expiration date if applicable
    let expiresAt = null;
    if (module.expirationPeriod) {
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + module.expirationPeriod);
    }
    
    // Create or update the certification record
    if (existingCerts.length > 0) {
      // Update existing record
      certification = await db
        .update(userCertifications)
        .set({
          status: passed ? 'completed' : 'in_progress',
          score,
          completedAt: passed ? now : null,
          expiresAt: passed ? expiresAt : null,
          lastAttemptAt: now,
          attempts: existingCerts[0].attempts + 1,
          quizResults: req.body.quizResults || null,
          updatedAt: now
        })
        .where(eq(userCertifications.id, existingCerts[0].id))
        .returning();
    } else {
      // Create new record
      certification = await db
        .insert(userCertifications)
        .values({
          userId,
          moduleId,
          status: passed ? 'completed' : 'in_progress',
          score,
          completedAt: passed ? now : null,
          expiresAt: passed ? expiresAt : null,
          lastAttemptAt: now,
          attempts: 1,
          quizResults: req.body.quizResults || null,
          createdAt: now,
          updatedAt: now
        })
        .returning();
    }
    
    res.json({
      certification: certification[0],
      passed,
      passingScore
    });
  } catch (error) {
    console.error('Error recording certification completion:', error);
    res.status(500).json({ message: 'Failed to record certification completion' });
  }
});

/**
 * Create a new training module 
 * Accessible by: Admins only
 */
router.post('/modules', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const moduleData = req.body;
    
    if (!moduleData.title || !moduleData.moduleType) {
      return res.status(400).json({ message: 'Title and module type are required' });
    }
    
    const newModule = await db
      .insert(trainingModules)
      .values({
        title: moduleData.title,
        description: moduleData.description || null,
        requiredRoles: moduleData.requiredRoles || ['all'],
        steps: moduleData.steps || [],
        quizQuestions: moduleData.quizQuestions || [],
        imageUrl: moduleData.imageUrl || null,
        moduleType: moduleData.moduleType,
        passingScore: moduleData.passingScore || 90,
        isActive: true,
        expirationPeriod: moduleData.expirationPeriod || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newModule[0]);
  } catch (error) {
    console.error('Error creating training module:', error);
    res.status(500).json({ message: 'Failed to create training module' });
  }
});

/**
 * Update a training module
 * Accessible by: Admins only
 */
router.put('/modules/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const moduleData = req.body;
    
    const updatedModule = await db
      .update(trainingModules)
      .set({
        title: moduleData.title,
        description: moduleData.description,
        requiredRoles: moduleData.requiredRoles,
        steps: moduleData.steps,
        quizQuestions: moduleData.quizQuestions,
        imageUrl: moduleData.imageUrl,
        moduleType: moduleData.moduleType,
        passingScore: moduleData.passingScore,
        isActive: moduleData.isActive,
        expirationPeriod: moduleData.expirationPeriod,
        updatedAt: new Date()
      })
      .where(eq(trainingModules.id, parseInt(id)))
      .returning();
    
    if (updatedModule.length === 0) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    res.json(updatedModule[0]);
  } catch (error) {
    console.error('Error updating training module:', error);
    res.status(500).json({ message: 'Failed to update training module' });
  }
});

export default router;