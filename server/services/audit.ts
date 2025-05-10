import { VersionComparisonAuditLog, AuditLogQuery, CreateAuditLogInput } from '../types/audit';
import { MemStorage } from '../storage';
import { createHash } from 'crypto';
import { AuditLog } from '../types/audit';

interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  adminUserId?: string;
  version?: string;
  offset: number;
  limit: number;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
}

export class AuditService {
  constructor(private storage: MemStorage) {}

  private generateSummaryHash(summary: string): string {
    return createHash('sha256').update(summary).digest('hex');
  }

  async logVersionComparison(
    adminUserId: string,
    adminUserName: string,
    version1: string,
    version2: string,
    recipientEmail: string,
    summary: string,
    metadata: {
      accuracyDeltas: Record<string, number>;
      thresholdDeltas: Record<string, number>;
      reviewImpactDelta: number;
    }
  ): Promise<VersionComparisonAuditLog> {
    const log: VersionComparisonAuditLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      adminUserId,
      adminUserName,
      version1,
      version2,
      recipientEmail,
      summaryHash: this.generateSummaryHash(summary),
      metadata,
    };

    await this.storage.createAuditLog(log);
    return log;
  }

  async logEmailSent(
    userId: string,
    recipientEmail: string,
    emailType: string,
    emailContent: string,
    adminName?: string,
    adminId?: string
  ): Promise<AuditLog> {
    const summaryHash = this.generateSummaryHash(emailContent);
    
    return this.createAuditLog({
      userId,
      action: 'email_sent',
      entityType: 'email',
      entityId: `${Date.now()}`,
      details: {
        recipientEmail,
        emailType,
        summaryHash,
      },
      metadata: adminName && adminId ? {
        adminName,
        adminId,
      } : undefined
    });
  }

  async logModelComparison(
    userId: string,
    version1: string,
    version2: string,
    comparisonSummary: string,
    metrics: {
      accuracyDeltas: Record<string, number>;
      thresholdDeltas: Record<string, number>;
      reviewImpactDelta: number;
    }
  ): Promise<AuditLog> {
    const summaryHash = this.generateSummaryHash(comparisonSummary);

    return this.createAuditLog({
      userId,
      action: 'model_comparison',
      entityType: 'ai_model',
      entityId: `${version1}_${version2}`,
      details: {
        version1,
        version2,
        summaryHash,
      },
      metadata: metrics
    });
  }

  async logThresholdChange(
    userId: string,
    modelVersion: string,
    oldThresholds: Record<string, number>,
    newThresholds: Record<string, number>,
    reason: string
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'threshold_change',
      entityType: 'ai_model',
      entityId: modelVersion,
      details: {
        oldThresholds,
        newThresholds,
        reason,
      }
    });
  }

  async logModelRetrain(
    userId: string,
    modelVersion: string,
    trainingConfig: Record<string, any>,
    metrics: Record<string, number>
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'model_retrain',
      entityType: 'ai_model',
      entityId: modelVersion,
      details: {
        trainingConfig,
      },
      metadata: {
        metrics,
      }
    });
  }

  async logDiagnosisOverride(
    userId: string,
    diagnosisId: string,
    originalDiagnosis: string,
    overrideDiagnosis: string,
    reason: string
  ): Promise<AuditLog> {
    return this.createAuditLog({
      userId,
      action: 'diagnosis_override',
      entityType: 'diagnosis',
      entityId: diagnosisId,
      details: {
        originalDiagnosis,
        overrideDiagnosis,
        reason,
      }
    });
  }

  async getAuditLogs(query: AuditLogQuery): Promise<AuditLog[]> {
    let logs = this.storage.getAuditLogs();

    // Apply filters
    if (query.startDate) {
      logs = logs.filter(log => log.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      logs = logs.filter(log => log.timestamp <= query.endDate!);
    }
    if (query.userId) {
      logs = logs.filter(log => log.userId === query.userId);
    }
    if (query.entityType) {
      logs = logs.filter(log => log.entityType === query.entityType);
    }
    if (query.entityId) {
      logs = logs.filter(log => log.entityId === query.entityId);
    }
    if (query.action) {
      logs = logs.filter(log => log.action === query.action);
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    logs = logs.slice(offset, offset + limit);

    return logs;
  }

  async exportAuditLogs(query: AuditLogQuery): Promise<string> {
    const { logs } = await this.getAuditLogs(query);
    
    const headers = [
      'Timestamp',
      'Admin User',
      'Versions',
      'Recipient',
      'Summary Hash',
      'Accuracy Changes',
      'Threshold Changes',
      'Review Impact',
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      `${log.adminUserName} (${log.adminUserId})`,
      `v${log.version1} vs v${log.version2}`,
      log.recipientEmail,
      log.summaryHash,
      JSON.stringify(log.metadata.accuracyDeltas),
      JSON.stringify(log.metadata.thresholdDeltas),
      log.metadata.reviewImpactDelta,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  }

  async createAuditLog(input: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...input,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    this.storage.createAuditLog(newLog);
    return newLog;
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const logs = this.storage.getAuditLogs();
    return logs.find(log => log.id === id) || null;
  }

  async deleteAuditLog(id: string): Promise<void> {
    this.storage.deleteAuditLog(id);
  }
} 