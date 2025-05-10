import { Router } from 'express';
import { AuditService } from '../services/audit';
import { MemStorage } from '../storage';
import { authorizeAdmin } from '../middleware/auth';
import { stringify } from 'csv-stringify/sync';
import { AuditLogQuery } from '../types/audit';

const router = Router();
const storage = new MemStorage();
const auditService = new AuditService(storage);

// Get audit logs with optional filters
router.get('/', async (req, res) => {
  try {
    const query: AuditLogQuery = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      userId: req.query.userId as string,
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
      action: req.query.action as string,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const logs = await auditService.getAuditLogs(query);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log by ID
router.get('/:id', async (req, res) => {
  try {
    const log = await auditService.getAuditLogById(req.params.id);
    if (!log) {
      res.status(404).json({ error: 'Audit log not found' });
      return;
    }
    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Delete audit log
router.delete('/:id', async (req, res) => {
  try {
    await auditService.deleteAuditLog(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting audit log:', error);
    res.status(500).json({ error: 'Failed to delete audit log' });
  }
});

// Create a new audit log entry
router.post('/logs', async (req, res) => {
  try {
    const log = await auditService.createAuditLog(req.body);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Get paginated audit logs with filters
router.get('/logs/export', authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate, adminUserId, version } = req.query;
    
    const query = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      adminUserId: adminUserId as string,
      version: version as string,
    };

    const { logs } = await auditService.getAuditLogs(query);
    
    // Prepare CSV data
    const csvData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      adminUserId: log.adminUserId,
      adminUserName: log.adminUserName,
      version1: log.version1,
      version2: log.version2,
      recipientEmail: log.recipientEmail,
      summaryHash: log.summaryHash,
      accuracyDeltas: JSON.stringify(log.metadata.accuracyDeltas),
      thresholdDeltas: JSON.stringify(log.metadata.thresholdDeltas),
      reviewImpactDelta: log.metadata.reviewImpactDelta,
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: {
        timestamp: 'Timestamp',
        adminUserId: 'Admin ID',
        adminUserName: 'Admin Name',
        version1: 'Version 1',
        version2: 'Version 2',
        recipientEmail: 'Recipient Email',
        summaryHash: 'Summary Hash',
        accuracyDeltas: 'Accuracy Deltas',
        thresholdDeltas: 'Threshold Deltas',
        reviewImpactDelta: 'Review Impact Delta',
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

export default router; 