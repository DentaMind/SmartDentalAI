import { z } from 'zod';
import crypto from 'crypto';
import { storage } from '../storage';
import { Patient, PatientMedicalHistory, AuditLog } from '../../shared/schema';
import { createHash } from 'crypto';

// Constants for encryption
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.PATIENT_DATA_ENCRYPTION_KEY;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
}

interface AccessPolicy {
  role: 'admin' | 'provider' | 'staff' | 'patient';
  action: 'read' | 'write' | 'delete';
  resource: string;
}

class SecurePatientService {
  private readonly accessPolicies: AccessPolicy[] = [
    { role: 'admin', action: 'read', resource: '*' },
    { role: 'admin', action: 'write', resource: '*' },
    { role: 'provider', action: 'read', resource: 'patient.*' },
    { role: 'provider', action: 'write', resource: 'patient.medical.*' },
    { role: 'staff', action: 'read', resource: 'patient.basic.*' },
    { role: 'patient', action: 'read', resource: 'patient.self.*' },
  ];

  // Encryption utilities
  private encrypt(data: string): EncryptedData {
    if (!ENCRYPTION_KEY) throw new Error('Encryption key not configured');

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData,
      authTag: authTag.toString('hex')
    };
  }

  private decrypt(encryptedData: EncryptedData): string {
    if (!ENCRYPTION_KEY) throw new Error('Encryption key not configured');

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Access control
  private async checkAccess(userId: number, action: 'read' | 'write' | 'delete', resource: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    const userRole = user.role;
    return this.accessPolicies.some(policy => 
      policy.role === userRole &&
      policy.action === action &&
      (policy.resource === '*' || this.matchResourcePattern(policy.resource, resource))
    );
  }

  private matchResourcePattern(pattern: string, resource: string): boolean {
    const patternParts = pattern.split('.');
    const resourceParts = resource.split('.');
    
    return patternParts.every((part, index) => 
      part === '*' || part === resourceParts[index]
    );
  }

  // Audit logging
  private async createAuditLog(
    userId: number,
    action: string,
    resource: string,
    details: string,
    patientId?: number
  ): Promise<void> {
    const auditLog: Omit<AuditLog, 'id'> = {
      userId,
      action,
      entityType: 'patient',
      entityId: patientId || 0,
      timestamp: new Date(),
      details,
      metadata: {
        ipAddress: '', // Add request IP
        userAgent: '', // Add user agent
        accessType: 'api'
      }
    };

    await storage.createAuditLog(auditLog);
  }

  // Patient data access methods
  async getPatient(userId: number, patientId: number): Promise<Patient | null> {
    const hasAccess = await this.checkAccess(userId, 'read', `patient.${patientId}`);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const patient = await storage.getPatient(patientId);
    if (!patient) return null;

    await this.createAuditLog(
      userId,
      'read',
      'patient',
      `Accessed patient record ${patientId}`,
      patientId
    );

    // Decrypt sensitive fields
    if (patient.medicalHistory) {
      const decryptedHistory = this.decrypt(patient.medicalHistory as unknown as EncryptedData);
      patient.medicalHistory = JSON.parse(decryptedHistory);
    }

    return patient;
  }

  async updatePatient(
    userId: number,
    patientId: number,
    data: Partial<Patient>
  ): Promise<Patient> {
    const hasAccess = await this.checkAccess(userId, 'write', `patient.${patientId}`);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Encrypt sensitive fields
    if (data.medicalHistory) {
      const encryptedHistory = this.encrypt(JSON.stringify(data.medicalHistory));
      data.medicalHistory = encryptedHistory as unknown as PatientMedicalHistory;
    }

    const updatedPatient = await storage.updatePatient(patientId, data);

    await this.createAuditLog(
      userId,
      'update',
      'patient',
      `Updated patient record ${patientId}`,
      patientId
    );

    return updatedPatient;
  }

  async deletePatient(userId: number, patientId: number): Promise<void> {
    const hasAccess = await this.checkAccess(userId, 'delete', `patient.${patientId}`);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Instead of actual deletion, mark as inactive and encrypt all data
    await storage.updatePatient(patientId, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    });

    await this.createAuditLog(
      userId,
      'delete',
      'patient',
      `Marked patient ${patientId} as inactive`,
      patientId
    );
  }

  // Consent management
  async updatePatientConsent(
    userId: number,
    patientId: number,
    consentData: {
      type: string;
      granted: boolean;
      expiresAt?: Date;
      details?: string;
    }
  ): Promise<void> {
    const hasAccess = await this.checkAccess(userId, 'write', `patient.${patientId}.consent`);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    await storage.createPatientConsent({
      patientId,
      type: consentData.type,
      granted: consentData.granted,
      grantedAt: new Date(),
      grantedBy: userId,
      expiresAt: consentData.expiresAt,
      details: consentData.details
    });

    await this.createAuditLog(
      userId,
      'consent_update',
      'patient',
      `Updated consent for patient ${patientId}: ${consentData.type}`,
      patientId
    );
  }

  // Data retention
  async applyRetentionPolicy(patientId: number): Promise<void> {
    const retentionPeriod = 7 * 365; // 7 years in days
    const patient = await storage.getPatient(patientId);
    
    if (!patient) return;

    const lastActivity = new Date(patient.updatedAt);
    const daysSinceLastActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity > retentionPeriod) {
      await this.archivePatientData(patientId);
    }
  }

  private async archivePatientData(patientId: number): Promise<void> {
    const patient = await storage.getPatient(patientId);
    if (!patient) return;

    // Archive data (implement your archiving logic here)
    // For example, move to cold storage or create encrypted backup

    await this.createAuditLog(
      0, // System user
      'archive',
      'patient',
      `Archived patient data for ${patientId} due to retention policy`,
      patientId
    );
  }
}

export const securePatient = new SecurePatientService(); 