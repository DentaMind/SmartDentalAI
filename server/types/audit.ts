export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  offset?: number;
  limit?: number;
}

export type CreateAuditLogInput = Omit<AuditLog, 'id' | 'timestamp'>; 