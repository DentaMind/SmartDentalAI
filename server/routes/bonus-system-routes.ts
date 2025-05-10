import express from 'express';
import { db } from '../db';
import { bonusGoals, bonusGoalTiers, bonusAchievements, bonusNotifications } from '../../shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export function setupBonusSystemRoutes(router: express.Router) {
  // Get all bonus goals
  router.get('/api/bonus/goals', async (req, res) => {
    try {
      const goals = await db.query.bonusGoals.findMany({
        with: {
          tiers: true
        },
        orderBy: [
          desc(bonusGoals.isActive),
          desc(bonusGoals.createdAt)
        ]
      });
      
      res.json(goals);
    } catch (error) {
      console.error('Error fetching bonus goals:', error);
      res.status(500).json({ error: 'Failed to fetch bonus goals' });
    }
  });
  
  // Get a specific bonus goal
  router.get('/api/bonus/goals/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      const goal = await db.query.bonusGoals.findFirst({
        where: eq(bonusGoals.id, parseInt(id)),
        with: {
          tiers: true
        }
      });
      
      if (!goal) {
        return res.status(404).json({ error: 'Bonus goal not found' });
      }
      
      res.json(goal);
    } catch (error) {
      console.error(`Error fetching bonus goal ${id}:`, error);
      res.status(500).json({ error: 'Failed to fetch bonus goal' });
    }
  });
  
  // Create a new bonus goal
  router.post('/api/bonus/goals', async (req, res) => {
    const { 
      name, 
      description, 
      targetAmount,
      bonusAmount,
      isActive,
      goalType,
      timeframe,
      roleId,
      userId,
      tiers
    } = req.body;
    
    try {
      // Get the current user ID (creator)
      const createdBy = req.session.user?.id || 1; // Default to 1 if not authenticated
      
      // Create the goal
      const [newGoal] = await db.insert(bonusGoals).values({
        name,
        description,
        targetAmount,
        bonusAmount,
        isActive,
        goalType,
        timeframe,
        roleId: roleId || null,
        userId: userId || null,
        createdBy,
        createdAt: new Date()
      }).returning();
      
      // If tiers are provided, create them
      if (tiers && tiers.length > 0) {
        const tierValues = tiers.map((tier: any) => ({
          goalId: newGoal.id,
          targetAmount: tier.targetAmount,
          bonusAmount: tier.bonusAmount,
          description: tier.description
        }));
        
        await db.insert(bonusGoalTiers).values(tierValues);
      }
      
      // Get the complete goal with tiers
      const completeGoal = await db.query.bonusGoals.findFirst({
        where: eq(bonusGoals.id, newGoal.id),
        with: {
          tiers: true
        }
      });
      
      // Create notification for affected users
      let notificationTargets: number[] = [];
      
      if (goalType === 'practice') {
        // Notify all users
        const users = await db.query.users.findMany({
          columns: {
            id: true
          }
        });
        notificationTargets = users.map(user => user.id);
      } else if (goalType === 'role' && roleId) {
        // Notify users with this role
        const users = await db.query.users.findMany({
          where: eq(users.role, roleId.toString()),
          columns: {
            id: true
          }
        });
        notificationTargets = users.map(user => user.id);
      } else if (goalType === 'individual' && userId) {
        // Notify only this user
        notificationTargets = [userId];
      }
      
      // Create notifications
      if (notificationTargets.length > 0) {
        const notifications = notificationTargets.map(userId => ({
          userId,
          goalId: newGoal.id,
          goalName: name,
          message: `A new ${timeframe} bonus goal has been created: ${name}`,
          createdAt: new Date(),
          isRead: false,
          notificationType: 'goal_created' as 'goal_created'
        }));
        
        await db.insert(bonusNotifications).values(notifications);
      }
      
      res.status(201).json(completeGoal);
    } catch (error) {
      console.error('Error creating bonus goal:', error);
      res.status(500).json({ error: 'Failed to create bonus goal' });
    }
  });
  
  // Update a bonus goal
  router.patch('/api/bonus/goals/:id', async (req, res) => {
    const { id } = req.params;
    const {
      name, 
      description, 
      targetAmount,
      bonusAmount,
      isActive,
      goalType,
      timeframe,
      roleId,
      userId,
      tiers
    } = req.body;
    
    try {
      // Update the goal
      await db.update(bonusGoals).set({
        name,
        description,
        targetAmount,
        bonusAmount,
        isActive,
        goalType,
        timeframe,
        roleId: roleId || null,
        userId: userId || null,
        updatedAt: new Date()
      }).where(eq(bonusGoals.id, parseInt(id)));
      
      // If tiers are provided, update them
      if (tiers && tiers.length > 0) {
        // Delete existing tiers
        await db.delete(bonusGoalTiers).where(eq(bonusGoalTiers.goalId, parseInt(id)));
        
        // Create new tiers
        const tierValues = tiers.map((tier: any) => ({
          goalId: parseInt(id),
          targetAmount: tier.targetAmount,
          bonusAmount: tier.bonusAmount,
          description: tier.description
        }));
        
        await db.insert(bonusGoalTiers).values(tierValues);
      }
      
      // Get the updated goal
      const updatedGoal = await db.query.bonusGoals.findFirst({
        where: eq(bonusGoals.id, parseInt(id)),
        with: {
          tiers: true
        }
      });
      
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Bonus goal not found' });
      }
      
      // Create notification for affected users about the update
      let notificationTargets: number[] = [];
      
      if (goalType === 'practice') {
        // Notify all users
        const users = await db.query.users.findMany({
          columns: {
            id: true
          }
        });
        notificationTargets = users.map(user => user.id);
      } else if (goalType === 'role' && roleId) {
        // Notify users with this role
        const users = await db.query.users.findMany({
          where: eq(users.role, roleId.toString()),
          columns: {
            id: true
          }
        });
        notificationTargets = users.map(user => user.id);
      } else if (goalType === 'individual' && userId) {
        // Notify only this user
        notificationTargets = [userId];
      }
      
      // Create notifications
      if (notificationTargets.length > 0) {
        const notifications = notificationTargets.map(userId => ({
          userId,
          goalId: parseInt(id),
          goalName: name,
          message: `The bonus goal "${name}" has been updated`,
          createdAt: new Date(),
          isRead: false,
          notificationType: 'goal_updated' as 'goal_updated'
        }));
        
        await db.insert(bonusNotifications).values(notifications);
      }
      
      res.json(updatedGoal);
    } catch (error) {
      console.error(`Error updating bonus goal ${id}:`, error);
      res.status(500).json({ error: 'Failed to update bonus goal' });
    }
  });
  
  // Delete a bonus goal
  router.delete('/api/bonus/goals/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      // Delete associated tiers first
      await db.delete(bonusGoalTiers).where(eq(bonusGoalTiers.goalId, parseInt(id)));
      
      // Delete notifications related to this goal
      await db.delete(bonusNotifications).where(eq(bonusNotifications.goalId, parseInt(id)));
      
      // Delete the goal
      const result = await db.delete(bonusGoals).where(eq(bonusGoals.id, parseInt(id))).returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Bonus goal not found' });
      }
      
      res.json({ message: 'Bonus goal deleted successfully' });
    } catch (error) {
      console.error(`Error deleting bonus goal ${id}:`, error);
      res.status(500).json({ error: 'Failed to delete bonus goal' });
    }
  });
  
  // Get production totals for a specific timeframe
  router.get('/api/bonus/production-totals', async (req, res) => {
    const { startDate, endDate, timeframe = 'custom' } = req.query as { 
      startDate?: string; 
      endDate?: string; 
      timeframe?: string;
    };
    
    try {
      // Validate date parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Query financial transactions for the period
      const transactions = await db.query.financialTransactions.findMany({
        where: and(
          gte(financialTransactions.transactionDate, start),
          lte(financialTransactions.transactionDate, end)
        )
      });
      
      // Calculate total production
      const totalProduction = transactions.reduce((sum, transaction) => {
        // Only count production related transactions (filter out expenses, refunds, etc.)
        if (['payment', 'insurance_payment', 'service_charge'].includes(transaction.transactionType)) {
          return sum + transaction.amount;
        }
        return sum;
      }, 0);
      
      // Get staff count for per-staff calculations
      const staffCount = await db.query.users.findMany({
        where: and(
          eq(users.isActive, true),
          eq(users.role, 'staff')
        )
      }).then(staff => staff.length);
      
      // Calculate average per staff
      const averagePerStaff = staffCount > 0 ? Math.round(totalProduction / staffCount) : 0;
      
      res.json({
        totalProduction,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timeframe,
        staffCount,
        averagePerStaff
      });
    } catch (error) {
      console.error('Error calculating production totals:', error);
      res.status(500).json({ error: 'Failed to calculate production totals' });
    }
  });
  
  // Check eligibility for a bonus
  router.post('/api/bonus/check-eligibility', async (req, res) => {
    const { goalId, startDate, endDate } = req.body;
    
    try {
      // Get the goal
      const goal = await db.query.bonusGoals.findFirst({
        where: eq(bonusGoals.id, goalId),
        with: {
          tiers: true
        }
      });
      
      if (!goal) {
        return res.status(404).json({ error: 'Bonus goal not found' });
      }
      
      // Get production totals for the period
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Query financial transactions for the period
      const transactions = await db.query.financialTransactions.findMany({
        where: and(
          gte(financialTransactions.transactionDate, start),
          lte(financialTransactions.transactionDate, end)
        )
      });
      
      // Calculate total production
      const production = transactions.reduce((sum, transaction) => {
        // Only count production related transactions
        if (['payment', 'insurance_payment', 'service_charge'].includes(transaction.transactionType)) {
          return sum + transaction.amount;
        }
        return sum;
      }, 0);
      
      // Determine the highest tier achieved (if using tiers)
      let achieved = false;
      let bonusAmount = 0;
      let targetAmount = goal.targetAmount;
      
      if (goal.tiers && goal.tiers.length > 0) {
        // Sort tiers by target amount in descending order
        const sortedTiers = [...goal.tiers].sort((a, b) => b.targetAmount - a.targetAmount);
        
        // Find the highest tier achieved
        for (const tier of sortedTiers) {
          if (production >= tier.targetAmount) {
            achieved = true;
            bonusAmount = tier.bonusAmount;
            targetAmount = tier.targetAmount;
            break;
          }
        }
      } else {
        // Using single goal threshold
        achieved = production >= goal.targetAmount;
        bonusAmount = goal.bonusAmount;
      }
      
      // Calculate shortfall if goal not achieved
      const shortfall = achieved ? 0 : targetAmount - production;
      
      // If achieved and not already recorded, create an achievement record
      if (achieved) {
        // Check if this achievement has already been recorded
        const existingAchievement = await db.query.bonusAchievements.findFirst({
          where: and(
            eq(bonusAchievements.goalId, goalId),
            gte(bonusAchievements.achievedAt, start),
            lte(bonusAchievements.achievedAt, end)
          )
        });
        
        if (!existingAchievement) {
          // Get user ID from session or use a default for testing
          const userId = req.session.user?.id || 1;
          
          // Create achievement record
          const [achievement] = await db.insert(bonusAchievements).values({
            goalId,
            userId,
            amount: bonusAmount,
            achievedAt: new Date(),
            targetAmount,
            actualAmount: production,
            isPaid: false
          }).returning();
          
          // Create notification
          await db.insert(bonusNotifications).values({
            userId,
            goalId,
            goalName: goal.name,
            message: `You've achieved the "${goal.name}" bonus goal!`,
            createdAt: new Date(),
            isRead: false,
            notificationType: 'achievement',
            bonusAmount
          });
        }
      }
      
      res.json({
        achieved,
        production,
        targetAmount,
        bonusAmount,
        shortfall,
        goalName: goal.name
      });
    } catch (error) {
      console.error('Error checking bonus eligibility:', error);
      res.status(500).json({ error: 'Failed to check bonus eligibility' });
    }
  });
  
  // Get bonus achievements
  router.get('/api/bonus/achievements', async (req, res) => {
    const { startDate, endDate, timeframe, isPaid, userId } = req.query as {
      startDate?: string;
      endDate?: string;
      timeframe?: string;
      isPaid?: string;
      userId?: string;
    };
    
    try {
      // Build the query conditions
      let conditions = [];
      
      if (startDate && endDate) {
        conditions.push(
          gte(bonusAchievements.achievedAt, new Date(startDate)),
          lte(bonusAchievements.achievedAt, new Date(endDate))
        );
      }
      
      if (timeframe && timeframe !== 'all') {
        // Join with goals to filter by timeframe
        // This is a simplified approach - in a real app you'd need to join with the goals table
      }
      
      if (isPaid && isPaid !== 'all') {
        conditions.push(eq(bonusAchievements.isPaid, isPaid === 'true'));
      }
      
      if (userId && userId !== 'all') {
        conditions.push(eq(bonusAchievements.userId, parseInt(userId)));
      }
      
      // Execute the query
      const achievements = await db.query.bonusAchievements.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(bonusAchievements.achievedAt)],
        with: {
          goal: true,
          user: true
        }
      });
      
      // Format the response
      const formattedAchievements = achievements.map(achievement => ({
        id: achievement.id,
        goalId: achievement.goalId,
        userId: achievement.userId,
        userName: `${achievement.user.firstName} ${achievement.user.lastName}`,
        userRole: achievement.user.role,
        amount: achievement.amount,
        achievedAt: achievement.achievedAt.toISOString(),
        goalName: achievement.goal.name,
        targetAmount: achievement.targetAmount,
        actualAmount: achievement.actualAmount,
        isPaid: achievement.isPaid,
        paidAt: achievement.paidAt ? achievement.paidAt.toISOString() : null,
        timeframe: achievement.goal.timeframe
      }));
      
      res.json(formattedAchievements);
    } catch (error) {
      console.error('Error fetching bonus achievements:', error);
      res.status(500).json({ error: 'Failed to fetch bonus achievements' });
    }
  });
  
  // Get notifications for a user
  router.get('/api/bonus/notifications/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { type } = req.query as { type?: string };
    
    try {
      // Build the query conditions
      let conditions = [eq(bonusNotifications.userId, parseInt(userId))];
      
      if (type && type !== 'all') {
        if (type === 'unread') {
          conditions.push(eq(bonusNotifications.isRead, false));
        } else {
          conditions.push(eq(bonusNotifications.notificationType, type as any));
        }
      }
      
      // Execute the query
      const notifications = await db.query.bonusNotifications.findMany({
        where: and(...conditions),
        orderBy: [
          desc(bonusNotifications.isRead), 
          desc(bonusNotifications.createdAt)
        ],
        limit: 50 // Limit to the most recent 50 notifications
      });
      
      res.json(notifications);
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });
  
  // Mark a notification as read
  router.patch('/api/bonus/notifications/:id/read', async (req, res) => {
    const { id } = req.params;
    
    try {
      const result = await db.update(bonusNotifications)
        .set({ isRead: true })
        .where(eq(bonusNotifications.id, parseInt(id)))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });
  
  // Mark all notifications for a user as read
  router.patch('/api/bonus/notifications/user/:userId/read-all', async (req, res) => {
    const { userId } = req.params;
    
    try {
      await db.update(bonusNotifications)
        .set({ isRead: true })
        .where(and(
          eq(bonusNotifications.userId, parseInt(userId)),
          eq(bonusNotifications.isRead, false)
        ));
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  });
  
  // Delete a notification
  router.delete('/api/bonus/notifications/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      const result = await db.delete(bonusNotifications)
        .where(eq(bonusNotifications.id, parseInt(id)))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });
}