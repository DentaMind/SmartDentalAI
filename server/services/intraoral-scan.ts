import { IntraoralScan, CreateIntraoralScan, UpdateIntraoralScan } from '../schema/intraoral-scan';
import { AuditLogService } from './audit-log';
import { StorageService } from './storage';

export class IntraoralScanService {
  private storage: StorageService;
  private auditLog: AuditLogService;

  constructor() {
    this.storage = new StorageService();
    this.auditLog = new AuditLogService();
  }

  async createScan(data: CreateIntraoralScan, userId: string): Promise<IntraoralScan> {
    const scan = await this.storage.createIntraoralScan(data);
    
    await this.auditLog.logAction({
      userId,
      action: 'CREATE_INTRACORAL_SCAN',
      entityType: 'INTRACORAL_SCAN',
      entityId: scan.id,
      metadata: {
        patientId: scan.patientId,
        format: scan.format,
        fileSize: scan.metadata?.fileSize
      }
    });

    return scan;
  }

  async updateScan(id: string, data: UpdateIntraoralScan, userId: string): Promise<IntraoralScan> {
    const scan = await this.storage.updateIntraoralScan(id, data);
    
    await this.auditLog.logAction({
      userId,
      action: 'UPDATE_INTRACORAL_SCAN',
      entityType: 'INTRACORAL_SCAN',
      entityId: id,
      metadata: {
        changes: Object.keys(data)
      }
    });

    return scan;
  }

  async getScan(id: string): Promise<IntraoralScan | undefined> {
    return this.storage.getIntraoralScan(id);
  }

  async getScansByPatient(patientId: string): Promise<IntraoralScan[]> {
    return this.storage.getIntraoralScansByPatient(patientId);
  }

  async deleteScan(id: string, userId: string): Promise<void> {
    await this.storage.deleteIntraoralScan(id);
    
    await this.auditLog.logAction({
      userId,
      action: 'DELETE_INTRACORAL_SCAN',
      entityType: 'INTRACORAL_SCAN',
      entityId: id
    });
  }

  async linkScanToXray(scanId: string, xrayId: string, userId: string): Promise<IntraoralScan> {
    const scan = await this.storage.updateIntraoralScan(scanId, { xrayId });
    
    await this.auditLog.logAction({
      userId,
      action: 'LINK_SCAN_TO_XRAY',
      entityType: 'INTRACORAL_SCAN',
      entityId: scanId,
      metadata: {
        xrayId
      }
    });

    return scan;
  }

  async updateTransform(scanId: string, transform: any, userId: string): Promise<IntraoralScan> {
    const scan = await this.storage.updateIntraoralScan(scanId, { transform });
    
    await this.auditLog.logAction({
      userId,
      action: 'UPDATE_SCAN_TRANSFORM',
      entityType: 'INTRACORAL_SCAN',
      entityId: scanId,
      metadata: {
        transform
      }
    });

    return scan;
  }
} 