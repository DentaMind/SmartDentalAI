import { db } from '../db';
import { aiFeedbackQueue, aiModelVersions, aiModelAuditLog, aiTriageResults } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

interface ModelVersion {
  id?: number;
  version: string;
  status: 'training' | 'ready' | 'deployed' | 'archived';
  trainingData: {
    feedbackIds: number[];
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
    };
  };
  deployedAt?: Date;
  deployedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AIModelService {
  private static currentVersion: string = '1.0.0';

  static async trainNewVersion() {
    try {
      // Get all approved and unprocessed feedback
      const approvedFeedback = await db.query.aiFeedbackQueue.findMany({
        where: (feedback, { and, eq }) => and(
          eq(feedback.status, 'approved'),
          eq(feedback.processed, false)
        ),
      });

      if (approvedFeedback.length === 0) {
        return { success: false, message: 'No new feedback to train on' };
      }

      // Prepare training data
      const trainingData = approvedFeedback.map(feedback => ({
        originalResult: feedback.originalAiResult,
        overrideData: feedback.overrideData,
        overrideType: feedback.overrideType,
        metadata: {
          practiceId: feedback.practiceId,
          doctorId: feedback.doctorId,
          patientId: feedback.patientId,
          formId: feedback.formId,
        },
      }));

      // Generate new version number
      const newVersion = this.generateNextVersion();

      // Create new model version record
      const [modelVersion] = await db
        .insert(aiModelVersions)
        .values({
          version: newVersion,
          status: 'training',
          trainingData: {
            feedbackIds: approvedFeedback.map(f => f.id),
            metrics: {
              accuracy: 0,
              precision: 0,
              recall: 0,
            },
          },
        })
        .returning();

      // TODO: Integrate with ML training pipeline
      // This is where we would:
      // 1. Send training data to ML service
      // 2. Wait for training completion
      // 3. Update metrics with real values
      console.log('Training new model version:', {
        version: newVersion,
        dataPoints: trainingData.length,
      });

      // Mark feedback as processed
      await Promise.all(
        approvedFeedback.map(feedback =>
          db
            .update(aiFeedbackQueue)
            .set({ processed: true })
            .where(eq(aiFeedbackQueue.id, feedback.id))
        )
      );

      return {
        success: true,
        message: 'New model version training initiated',
        version: newVersion,
      };
    } catch (error) {
      console.error('Failed to train new model version:', error);
      throw error;
    }
  }

  static async deployVersion(version: string, deployedBy: number, notes?: string) {
    const [target] = await db
      .select()
      .from(aiModelVersions)
      .where(eq(aiModelVersions.version, version));

    if (!target) throw new Error('Model version not found');
    if (target.status === 'deployed') throw new Error('Model is already deployed');

    // Archive any previously deployed version
    await db.update(aiModelVersions)
      .set({ status: 'archived' })
      .where(eq(aiModelVersions.status, 'deployed'));

    // Deploy the selected one
    await db.update(aiModelVersions)
      .set({
        status: 'deployed',
        deployedAt: new Date(),
        deployedBy,
      })
      .where(eq(aiModelVersions.version, version));

    // Log the deployment
    await db.insert(aiModelAuditLog).values({
      version,
      action: 'deploy',
      performedBy: deployedBy,
      notes,
    });

    return { success: true, message: `Model ${version} is now live` };
  }

  static async rollbackToVersion(version: string, userId: number, notes?: string) {
    const [model] = await db
      .select()
      .from(aiModelVersions)
      .where(eq(aiModelVersions.version, version));

    if (!model) throw new Error('Version not found');
    if (model.status !== 'archived') throw new Error('Can only rollback to archived versions');

    // Archive the current live one
    await db.update(aiModelVersions)
      .set({ status: 'archived' })
      .where(eq(aiModelVersions.status, 'deployed'));

    // Promote the archived version
    await db.update(aiModelVersions)
      .set({
        status: 'deployed',
        deployedAt: new Date(),
        deployedBy: userId,
      })
      .where(eq(aiModelVersions.version, version));

    // Log the rollback
    await db.insert(aiModelAuditLog).values({
      version,
      action: 'rollback',
      performedBy: userId,
      notes,
    });

    return { success: true, message: `Rolled back to model ${version}` };
  }

  static async getModelVersions() {
    const versions = await db
      .select()
      .from(aiModelVersions)
      .orderBy(desc(aiModelVersions.createdAt));

    return {
      currentVersion: this.currentVersion,
      versions,
    };
  }

  static async getAuditLog() {
    const logs = await db
      .select({
        id: aiModelAuditLog.id,
        version: aiModelAuditLog.version,
        action: aiModelAuditLog.action,
        performedBy: aiModelAuditLog.performedBy,
        notes: aiModelAuditLog.notes,
        timestamp: aiModelAuditLog.timestamp,
      })
      .from(aiModelAuditLog)
      .orderBy(desc(aiModelAuditLog.timestamp));

    return logs;
  }

  static async getABSummary() {
    const triageResults = await db
      .select({
        modelVersion: aiTriageResults.modelVersion,
        outcome: aiTriageResults.outcome
      })
      .from(aiTriageResults);

    // Group by version and count outcomes
    const versionStats = triageResults.reduce((acc, result) => {
      if (!acc[result.modelVersion]) {
        acc[result.modelVersion] = {
          version: result.modelVersion,
          total: 0,
          improved: 0,
          stable: 0,
          worsened: 0
        };
      }

      acc[result.modelVersion].total++;
      switch (result.outcome) {
        case 'improved':
          acc[result.modelVersion].improved++;
          break;
        case 'stable':
          acc[result.modelVersion].stable++;
          break;
        case 'worsened':
          acc[result.modelVersion].worsened++;
          break;
      }

      return acc;
    }, {} as Record<string, {
      version: string;
      total: number;
      improved: number;
      stable: number;
      worsened: number;
    }>);

    return Object.values(versionStats);
  }

  private static generateNextVersion(): string {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }
} 