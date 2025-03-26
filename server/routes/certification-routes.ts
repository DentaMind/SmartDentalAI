import express, { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { 
  trainingModules, 
  userCertifications, 
  TrainingModule, 
  UserCertification,
  insertTrainingModuleSchema,
  insertUserCertificationSchema
} from '../../shared/schema';
import { requireTrainingAdmin } from '../middleware/certification-check';
import { z } from 'zod';

/**
 * Setup certification routes
 * @param router Express router instance
 */
export function setupCertificationRoutes(router: express.Router) {
  // Get all training modules (with optional filter)
  router.get('/certifications/modules', async (req: Request, res: Response) => {
    try {
      const moduleType = req.query.type as string;
      const role = req.query.role as string;
      let query = db.select().from(trainingModules);
      
      // Apply filters if provided
      if (moduleType) {
        query = query.where(eq(trainingModules.moduleType, moduleType));
      }
      
      // Get the modules
      let modules = await query.orderBy(asc(trainingModules.title));
      
      // If role filter is provided, only return modules required for that role
      if (role) {
        modules = modules.filter(module => {
          if (!module.requiredRoles) return false;
          const roles = module.requiredRoles as string[];
          return roles.includes(role);
        });
      }
      
      res.json(modules);
    } catch (error) {
      console.error('Error fetching training modules:', error);
      res.status(500).json({ error: 'Failed to fetch training modules' });
    }
  });

  // Get current user's certifications
  router.get('/certifications/my', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      
      // Get all user's certifications
      const certifications = await db.select()
        .from(userCertifications)
        .where(eq(userCertifications.userId, userId));
      
      // Get the module details for each certification
      const moduleIds = certifications.map(cert => cert.moduleId);
      const modules = await db.select()
        .from(trainingModules)
        .where(sql`${trainingModules.id} IN (${moduleIds.length ? moduleIds : [0]})`);
      
      // Combine the data
      const certsWithModules = certifications.map(cert => {
        const module = modules.find(m => m.id === cert.moduleId);
        return {
          ...cert,
          module: module || null
        };
      });
      
      res.json(certsWithModules);
    } catch (error) {
      console.error('Error fetching user certifications:', error);
      res.status(500).json({ error: 'Failed to fetch certifications' });
    }
  });

  // Get a specific training module by ID
  router.get('/certifications/modules/:id', async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      const module = await db.query.trainingModules.findFirst({
        where: eq(trainingModules.id, moduleId)
      });
      
      if (!module) {
        return res.status(404).json({ error: 'Training module not found' });
      }
      
      res.json(module);
    } catch (error) {
      console.error('Error fetching training module:', error);
      res.status(500).json({ error: 'Failed to fetch training module' });
    }
  });

  // Get user certification progress for a specific module
  router.get('/certifications/modules/:moduleId/progress', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const moduleId = parseInt(req.params.moduleId);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      const userId = req.session.user.id;
      
      // Get the certification record
      const certification = await db.select()
        .from(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(userCertifications.moduleId, moduleId)
          )
        )
        .limit(1);
      
      if (certification.length === 0) {
        // No existing certification record, return default values
        return res.json({
          status: 'not_started',
          progress: 0,
          currentStep: 0,
          attempts: 0
        });
      }
      
      res.json(certification[0]);
    } catch (error) {
      console.error('Error fetching certification progress:', error);
      res.status(500).json({ error: 'Failed to fetch certification progress' });
    }
  });

  // Update user certification progress
  router.post('/certifications/modules/:moduleId/progress', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const moduleId = parseInt(req.params.moduleId);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      const userId = req.session.user.id;
      
      // Validate the progress update data
      const progressSchema = z.object({
        progress: z.number().min(0).max(100).optional(),
        currentStep: z.number().min(0).optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'expired']).optional(),
        lastAnswers: z.any().optional(),
      });
      
      const validatedData = progressSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid progress data', details: validatedData.error.format() });
      }
      
      const { progress, currentStep, status, lastAnswers } = validatedData.data;
      
      // Check if certification record exists
      const existingCert = await db.select()
        .from(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(userCertifications.moduleId, moduleId)
          )
        )
        .limit(1);
      
      if (existingCert.length === 0) {
        // Create a new certification record
        const newCert = await db.insert(userCertifications).values({
          userId,
          moduleId,
          progress: progress || 0,
          currentStep: currentStep || 0,
          status: status || 'in_progress',
          lastAnswers: lastAnswers || null,
        }).returning();
        
        return res.status(201).json(newCert[0]);
      }
      
      // Update existing certification record
      const updateData: Partial<UserCertification> = {};
      
      if (progress !== undefined) updateData.progress = progress;
      if (currentStep !== undefined) updateData.currentStep = currentStep;
      if (status !== undefined) updateData.status = status;
      if (lastAnswers !== undefined) updateData.lastAnswers = lastAnswers;
      
      // Track attempts
      if (status === 'in_progress') {
        updateData.lastAttemptAt = new Date();
        updateData.attempts = (existingCert[0].attempts || 0) + 1;
      }
      
      const updatedCert = await db.update(userCertifications)
        .set(updateData)
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(userCertifications.moduleId, moduleId)
          )
        )
        .returning();
      
      res.json(updatedCert[0]);
    } catch (error) {
      console.error('Error updating certification progress:', error);
      res.status(500).json({ error: 'Failed to update certification progress' });
    }
  });

  // Submit quiz answers and complete module
  router.post('/certifications/modules/:moduleId/complete', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const moduleId = parseInt(req.params.moduleId);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      const userId = req.session.user.id;
      
      // Validate the completion data
      const completionSchema = z.object({
        quizAnswers: z.array(z.object({
          questionId: z.string(),
          answer: z.any(),
          correct: z.boolean()
        })),
        score: z.number().min(0).max(100),
      });
      
      const validatedData = completionSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid completion data', details: validatedData.error.format() });
      }
      
      const { quizAnswers, score } = validatedData.data;
      
      // Get the training module to check passing score
      const module = await db.query.trainingModules.findFirst({
        where: eq(trainingModules.id, moduleId)
      });
      
      if (!module) {
        return res.status(404).json({ error: 'Training module not found' });
      }
      
      // Determine if the user passed
      const passed = score >= module.passingScore;
      
      // Prepare the certification data
      const certData: Partial<UserCertification> = {
        score,
        quizResults: quizAnswers,
        lastAttemptAt: new Date(),
        lastAnswers: quizAnswers,
      };
      
      // If passed, update status and set completion time
      if (passed) {
        certData.status = 'completed';
        certData.completedAt = new Date();
        certData.progress = 100;
        
        // If module has an expiration period, set the expiration date
        if (module.expirationPeriod) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + module.expirationPeriod);
          certData.expiresAt = expiresAt;
        }
        
        // TODO: Generate certificate PDF and set the URL
        // certData.certificateUrl = generatedUrl;
      }
      
      // Check if certification record exists
      const existingCert = await db.select()
        .from(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(userCertifications.moduleId, moduleId)
          )
        )
        .limit(1);
      
      let updatedCert;
      
      if (existingCert.length === 0) {
        // Create a new certification record
        certData.userId = userId;
        certData.moduleId = moduleId;
        certData.attempts = 1;
        
        updatedCert = await db.insert(userCertifications).values(certData as any).returning();
      } else {
        // Update existing certification record
        certData.attempts = (existingCert[0].attempts || 0) + 1;
        
        updatedCert = await db.update(userCertifications)
          .set(certData)
          .where(
            and(
              eq(userCertifications.userId, userId),
              eq(userCertifications.moduleId, moduleId)
            )
          )
          .returning();
      }
      
      res.json({
        certification: updatedCert[0],
        passed,
        passingScore: module.passingScore
      });
    } catch (error) {
      console.error('Error completing training module:', error);
      res.status(500).json({ error: 'Failed to complete training module' });
    }
  });

  // ADMIN ROUTES - Protected by requireTrainingAdmin middleware

  // Create a new training module
  router.post('/certifications/modules', requireTrainingAdmin, async (req: Request, res: Response) => {
    try {
      // Validate the module data
      const validated = insertTrainingModuleSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: 'Invalid module data', details: validated.error.format() });
      }
      
      // Create the module
      const newModule = await db.insert(trainingModules).values(validated.data).returning();
      
      res.status(201).json(newModule[0]);
    } catch (error) {
      console.error('Error creating training module:', error);
      res.status(500).json({ error: 'Failed to create training module' });
    }
  });

  // Update an existing training module
  router.put('/certifications/modules/:id', requireTrainingAdmin, async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      // Check if module exists
      const existingModule = await db.query.trainingModules.findFirst({
        where: eq(trainingModules.id, moduleId)
      });
      
      if (!existingModule) {
        return res.status(404).json({ error: 'Training module not found' });
      }
      
      // Validate the module data
      const validated = insertTrainingModuleSchema.partial().safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: 'Invalid module data', details: validated.error.format() });
      }
      
      // Update the module
      const updatedModule = await db.update(trainingModules)
        .set(validated.data)
        .where(eq(trainingModules.id, moduleId))
        .returning();
      
      res.json(updatedModule[0]);
    } catch (error) {
      console.error('Error updating training module:', error);
      res.status(500).json({ error: 'Failed to update training module' });
    }
  });

  // Delete a training module
  router.delete('/certifications/modules/:id', requireTrainingAdmin, async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      // Check if module exists
      const existingModule = await db.query.trainingModules.findFirst({
        where: eq(trainingModules.id, moduleId)
      });
      
      if (!existingModule) {
        return res.status(404).json({ error: 'Training module not found' });
      }
      
      // Delete associated certification records
      await db.delete(userCertifications)
        .where(eq(userCertifications.moduleId, moduleId));
      
      // Delete the module
      await db.delete(trainingModules)
        .where(eq(trainingModules.id, moduleId));
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting training module:', error);
      res.status(500).json({ error: 'Failed to delete training module' });
    }
  });

  // Update or assign certifications for a user (admin function)
  router.post('/certifications/users/:userId', requireTrainingAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Validate the certification data
      const certificationSchema = z.object({
        moduleId: z.number(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'expired']),
        completedAt: z.date().optional(),
        expiresAt: z.date().optional(),
        score: z.number().min(0).max(100).optional(),
      });
      
      const validatedData = certificationSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid certification data', details: validatedData.error.format() });
      }
      
      const { moduleId, status, completedAt, expiresAt, score } = validatedData.data;
      
      // Check if the user already has a certification for this module
      const existingCert = await db.select()
        .from(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(userCertifications.moduleId, moduleId)
          )
        )
        .limit(1);
      
      if (existingCert.length === 0) {
        // Create a new certification
        const newCert = await db.insert(userCertifications).values({
          userId,
          moduleId,
          status,
          completedAt,
          expiresAt,
          score,
          progress: status === 'completed' ? 100 : 0,
        }).returning();
        
        return res.status(201).json(newCert[0]);
      }
      
      // Update existing certification
      const updateData: Partial<UserCertification> = {
        status,
        progress: status === 'completed' ? 100 : existingCert[0].progress,
      };
      
      if (completedAt) updateData.completedAt = completedAt;
      if (expiresAt) updateData.expiresAt = expiresAt;
      if (score !== undefined) updateData.score = score;
      
      const updatedCert = await db.update(userCertifications)
        .set(updateData)
        .where(
          and(
            eq(userCertifications.userId, userId),
            eq(userCertifications.moduleId, moduleId)
          )
        )
        .returning();
      
      res.json(updatedCert[0]);
    } catch (error) {
      console.error('Error updating user certification:', error);
      res.status(500).json({ error: 'Failed to update user certification' });
    }
  });

  // Get certifications for a specific user (admin function)
  router.get('/certifications/users/:userId', requireTrainingAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Get all user's certifications
      const certifications = await db.select()
        .from(userCertifications)
        .where(eq(userCertifications.userId, userId));
      
      // Get the module details for each certification
      const moduleIds = certifications.map(cert => cert.moduleId);
      
      if (moduleIds.length === 0) {
        return res.json([]);
      }
      
      const modules = await db.select()
        .from(trainingModules)
        .where(sql`${trainingModules.id} IN (${moduleIds})`);
      
      // Combine the data
      const certsWithModules = certifications.map(cert => {
        const module = modules.find(m => m.id === cert.moduleId);
        return {
          ...cert,
          module: module || null
        };
      });
      
      res.json(certsWithModules);
    } catch (error) {
      console.error('Error fetching user certifications:', error);
      res.status(500).json({ error: 'Failed to fetch certifications' });
    }
  });

  // Bulk assign training modules to users based on role (New Hire Automation)
  router.post('/certifications/bulk-assign', requireTrainingAdmin, async (req: Request, res: Response) => {
    try {
      // Validate the bulk assignment data
      const bulkAssignSchema = z.object({
        userIds: z.array(z.number()),
        moduleTypes: z.array(z.string()).optional(),
        specificModuleIds: z.array(z.number()).optional(),
        role: z.string().optional(),
      });
      
      const validatedData = bulkAssignSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid assignment data', details: validatedData.error.format() });
      }
      
      const { userIds, moduleTypes, specificModuleIds, role } = validatedData.data;
      
      if (!moduleTypes && !specificModuleIds && !role) {
        return res.status(400).json({ error: 'You must specify either moduleTypes, specificModuleIds, or a role' });
      }
      
      // Get modules to assign
      let modulesToAssign: TrainingModule[] = [];
      
      if (specificModuleIds && specificModuleIds.length > 0) {
        // Get specific modules by ID
        const modules = await db.select()
          .from(trainingModules)
          .where(sql`${trainingModules.id} IN (${specificModuleIds})`);
        
        modulesToAssign = modules;
      } else {
        // Get modules by type or role
        let query = db.select().from(trainingModules).where(eq(trainingModules.isActive, true));
        
        if (moduleTypes && moduleTypes.length > 0) {
          // Filter by module types
          query = query.where(sql`${trainingModules.moduleType} IN (${moduleTypes})`);
        }
        
        const modules = await query;
        
        if (role) {
          // Filter by required roles
          modulesToAssign = modules.filter(module => {
            if (!module.requiredRoles) return false;
            const roles = module.requiredRoles as string[];
            return roles.includes(role);
          });
        } else {
          modulesToAssign = modules;
        }
      }
      
      if (modulesToAssign.length === 0) {
        return res.status(404).json({ error: 'No matching modules found to assign' });
      }
      
      // Create certification records for each user and module
      const results = [];
      
      for (const userId of userIds) {
        for (const module of modulesToAssign) {
          // Check if user already has this certification
          const existingCert = await db.select()
            .from(userCertifications)
            .where(
              and(
                eq(userCertifications.userId, userId),
                eq(userCertifications.moduleId, module.id)
              )
            )
            .limit(1);
          
          if (existingCert.length === 0) {
            // Create a new certification record
            const newCert = await db.insert(userCertifications).values({
              userId,
              moduleId: module.id,
              status: 'not_started',
              progress: 0,
            }).returning();
            
            results.push({
              userId,
              moduleId: module.id,
              moduleName: module.title,
              action: 'assigned',
              certification: newCert[0]
            });
          } else {
            results.push({
              userId,
              moduleId: module.id,
              moduleName: module.title,
              action: 'already_exists',
              certification: existingCert[0]
            });
          }
        }
      }
      
      res.json({
        message: `Assigned ${modulesToAssign.length} modules to ${userIds.length} users`,
        results
      });
    } catch (error) {
      console.error('Error bulk assigning training modules:', error);
      res.status(500).json({ error: 'Failed to assign training modules' });
    }
  });

  return router;
}