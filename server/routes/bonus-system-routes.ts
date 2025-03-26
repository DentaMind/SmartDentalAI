import express from "express";
import { db } from "../db";
import {
  bonusGoals,
  bonusGoalTiers,
  bonusAchievements,
  bonusNotifications,
  insertBonusGoalSchema,
  insertBonusGoalTierSchema,
  insertBonusAchievementSchema,
  insertBonusNotificationSchema,
  financialTransactions
} from "../../shared/schema";
import { eq, and, gte, lte, desc, sql, sum } from "drizzle-orm";
import { ZodError } from "zod";

export function setupBonusSystemRoutes(router: express.Router) {
  // Get all bonus goals
  router.get("/bonus/goals", async (req, res) => {
    try {
      const goals = await db.select().from(bonusGoals).orderBy(desc(bonusGoals.createdAt));
      res.json(goals);
    } catch (error) {
      console.error("Error fetching bonus goals:", error);
      res.status(500).json({ error: "Failed to fetch bonus goals" });
    }
  });

  // Get single bonus goal with its tiers
  router.get("/bonus/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await db.select().from(bonusGoals).where(eq(bonusGoals.id, goalId)).limit(1);
      
      if (!goal.length) {
        return res.status(404).json({ error: "Bonus goal not found" });
      }

      const tiers = await db.select().from(bonusGoalTiers).where(eq(bonusGoalTiers.goalId, goalId))
        .orderBy(bonusGoalTiers.tierLevel);

      res.json({
        ...goal[0],
        tiers
      });
    } catch (error) {
      console.error("Error fetching bonus goal:", error);
      res.status(500).json({ error: "Failed to fetch bonus goal" });
    }
  });

  // Create new bonus goal
  router.post("/bonus/goals", async (req, res) => {
    try {
      const validatedData = insertBonusGoalSchema.parse(req.body);
      const result = await db.insert(bonusGoals).values(validatedData).returning();
      
      // If there are tiers to add
      if (req.body.tiers && Array.isArray(req.body.tiers)) {
        const tierPromises = req.body.tiers.map((tier: any) => {
          const tierData = {
            ...tier,
            goalId: result[0].id
          };
          return db.insert(bonusGoalTiers).values(tierData);
        });
        
        await Promise.all(tierPromises);
      }
      
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating bonus goal:", error);
      res.status(500).json({ error: "Failed to create bonus goal" });
    }
  });

  // Update bonus goal
  router.put("/bonus/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const validatedData = insertBonusGoalSchema.partial().parse(req.body);
      
      const result = await db
        .update(bonusGoals)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(bonusGoals.id, goalId))
        .returning();
      
      if (!result.length) {
        return res.status(404).json({ error: "Bonus goal not found" });
      }
      
      res.json(result[0]);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating bonus goal:", error);
      res.status(500).json({ error: "Failed to update bonus goal" });
    }
  });

  // Add tier to goal
  router.post("/bonus/goals/:id/tiers", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const validatedData = insertBonusGoalTierSchema.parse({
        ...req.body,
        goalId
      });
      
      const result = await db
        .insert(bonusGoalTiers)
        .values(validatedData)
        .returning();
      
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding tier:", error);
      res.status(500).json({ error: "Failed to add tier" });
    }
  });

  // Get all achievements
  router.get("/bonus/achievements", async (req, res) => {
    try {
      const achievements = await db
        .select()
        .from(bonusAchievements)
        .orderBy(desc(bonusAchievements.achievedDate));
      
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Get achievements by user
  router.get("/bonus/achievements/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievements = await db
        .select()
        .from(bonusAchievements)
        .where(eq(bonusAchievements.userId, userId))
        .orderBy(desc(bonusAchievements.achievedDate));
      
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  // Calculate production totals for a specified timeframe
  router.get("/bonus/production-totals", async (req, res) => {
    try {
      const { startDate, endDate, timeframe } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Get all financial transactions within the date range
      const result = await db
        .select({
          totalAmount: sql<number>`sum(${financialTransactions.amount})`,
        })
        .from(financialTransactions)
        .where(
          and(
            gte(financialTransactions.date, start),
            lte(financialTransactions.date, end),
            eq(financialTransactions.status, "completed")
          )
        );
      
      // Get staff count
      const staffCount = 0; // TODO: Implement staff count query
      
      res.json({
        startDate: start,
        endDate: end,
        timeframe: timeframe || "custom",
        totalProduction: result[0]?.totalAmount || 0,
        staffCount,
        averagePerStaff: staffCount ? (result[0]?.totalAmount || 0) / staffCount : 0
      });
    } catch (error) {
      console.error("Error calculating production totals:", error);
      res.status(500).json({ error: "Failed to calculate production totals" });
    }
  });

  // Check for achievement eligibility
  router.post("/bonus/check-eligibility", async (req, res) => {
    try {
      const { goalId, startDate, endDate } = req.body;
      
      if (!goalId || !startDate || !endDate) {
        return res.status(400).json({ error: "Goal ID, start date and end date are required" });
      }

      // Get the goal details
      const goal = await db
        .select()
        .from(bonusGoals)
        .where(eq(bonusGoals.id, parseInt(goalId)))
        .limit(1);
      
      if (!goal.length) {
        return res.status(404).json({ error: "Bonus goal not found" });
      }

      // Get the tiers for this goal
      const tiers = await db
        .select()
        .from(bonusGoalTiers)
        .where(eq(bonusGoalTiers.goalId, parseInt(goalId)))
        .orderBy(bonusGoalTiers.targetAmount);

      // Calculate production during this period
      const productionResult = await db
        .select({
          totalAmount: sql<number>`sum(${financialTransactions.amount})`,
        })
        .from(financialTransactions)
        .where(
          and(
            gte(financialTransactions.date, new Date(startDate)),
            lte(financialTransactions.date, new Date(endDate)),
            eq(financialTransactions.status, "completed")
          )
        );
      
      const production = productionResult[0]?.totalAmount || 0;
      
      // Find the highest tier achieved
      let achievedTier = null;
      let achievedAmount = 0;
      
      // Check tiers from highest to lowest for better bonus calculation
      const sortedTiers = [...tiers].sort((a, b) => b.targetAmount - a.targetAmount);
      
      for (const tier of sortedTiers) {
        if (production >= tier.targetAmount) {
          achievedTier = tier;
          achievedAmount = tier.bonusAmount;
          break;
        }
      }
      
      // If no tier achieved but we reached base goal amount
      if (!achievedTier && production >= goal[0].targetAmount) {
        achievedAmount = goal[0].bonusAmount;
      }
      
      res.json({
        goalId,
        production,
        startDate,
        endDate,
        targetAmount: goal[0].targetAmount,
        achieved: production >= goal[0].targetAmount,
        achievedTier: achievedTier ? {
          id: achievedTier.id,
          level: achievedTier.tierLevel,
          amount: achievedTier.bonusAmount
        } : null,
        bonusAmount: achievedAmount,
        shortfall: production < goal[0].targetAmount ? goal[0].targetAmount - production : 0
      });
    } catch (error) {
      console.error("Error checking eligibility:", error);
      res.status(500).json({ error: "Failed to check bonus eligibility" });
    }
  });

  // Record an achievement
  router.post("/bonus/achievements", async (req, res) => {
    try {
      const validatedData = insertBonusAchievementSchema.parse(req.body);
      const result = await db.insert(bonusAchievements).values(validatedData).returning();
      
      // Create notification for the achievement
      await db.insert(bonusNotifications).values({
        goalId: validatedData.goalId,
        userId: validatedData.userId,
        achievementId: result[0].id,
        notificationType: "achieved",
        message: `Congratulations! You've earned a bonus of $${validatedData.bonusAmount / 100} for reaching a production goal.`,
        isRead: false,
        createdAt: new Date()
      });
      
      res.status(201).json(result[0]);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error recording achievement:", error);
      res.status(500).json({ error: "Failed to record achievement" });
    }
  });

  // Mark bonus as paid
  router.put("/bonus/achievements/:id/paid", async (req, res) => {
    try {
      const achievementId = parseInt(req.params.id);
      const { approvedBy, notes } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ error: "Approver ID is required" });
      }
      
      const result = await db
        .update(bonusAchievements)
        .set({
          isPaid: true,
          paidDate: new Date(),
          approvedBy,
          approvedDate: new Date(),
          notes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(bonusAchievements.id, achievementId))
        .returning();
      
      if (!result.length) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      // Create payment notification
      await db.insert(bonusNotifications).values({
        goalId: result[0].goalId,
        userId: result[0].userId,
        achievementId: achievementId,
        notificationType: "payment_processed",
        message: `Your bonus payment of $${result[0].bonusAmount / 100} has been processed.`,
        isRead: false,
        createdAt: new Date()
      });
      
      res.json(result[0]);
    } catch (error) {
      console.error("Error marking achievement as paid:", error);
      res.status(500).json({ error: "Failed to mark achievement as paid" });
    }
  });

  // Get notifications for a user
  router.get("/bonus/notifications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await db
        .select()
        .from(bonusNotifications)
        .where(eq(bonusNotifications.userId, userId))
        .orderBy(desc(bonusNotifications.createdAt));
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  router.put("/bonus/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const result = await db
        .update(bonusNotifications)
        .set({ isRead: true })
        .where(eq(bonusNotifications.id, notificationId))
        .returning();
      
      if (!result.length) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  return router;
}