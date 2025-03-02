
import { storage } from "../storage";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || "dentamind-dev-secret-key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "8h";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "30d";

// Validation schemas
const auditLogSchema = z.object({
  userId: z.number().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.union([z.string(), z.number()]).optional(),
  details: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  result: z.enum(["success", "failure", "error"]),
});

const securityReportSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  filterUserId: z.number().optional(),
  filterAction: z.string().optional(),
  filterResult: z.enum(["success", "failure", "error"]).optional(),
});

// Sensitive data access schema
const sensitiveDataAccessSchema = z.object({
  userId: z.number(),
  role: z.string(),
  resourceType: z.string(),
  resourceId: z.union([z.string(), z.number()]),
  purpose: z.string().optional(),
  isEmergency: z.boolean().default(false),
});

export class SecurityService {
  // Security settings
  private readonly JWT_SECRET = JWT_SECRET;
  private readonly JWT_EXPIRY = JWT_EXPIRY;
  private readonly REFRESH_TOKEN_EXPIRY = REFRESH_TOKEN_EXPIRY;
  
  // Two-factor authentication settings
  private readonly MFA_ENABLED = true;
  private readonly MFA_EXPIRY_MINUTES = 10;
  
  // Password policy
  private readonly PASSWORD_MIN_LENGTH = 14; // Increased from 10
  private readonly PASSWORD_REQUIRES_MIXED_CASE = true;
  private readonly PASSWORD_REQUIRES_NUMBERS = true;
  private readonly PASSWORD_REQUIRES_SYMBOLS = true;
  
  // Rate limiting
  private readonly LOGIN_ATTEMPT_LIMIT = 5;
  private readonly LOGIN_ATTEMPT_WINDOW_MINUTES = 15;
  private readonly API_RATE_LIMIT = 100; // requests per minute
  
  // Login attempt tracking
  private loginAttempts: Record<string, { count: number, timestamp: number }> = {};
  
  // File integrity monitoring
  private fileHashes: Record<string, string> = {};
  private readonly CRITICAL_DIRECTORIES = [
    'server/services',
    'server/middleware',
    'server/auth.ts',
    'server/storage.ts'
  ];
  
  constructor() {
    // Initialize file integrity monitoring
    this.initializeFileIntegrityMonitoring();
    
    // Schedule regular integrity checks
    setInterval(() => this.performIntegrityCheck(), 15 * 60 * 1000); // Every 15 minutes
  }
  
  // File integrity monitoring
  private initializeFileIntegrityMonitoring(): void {
    console.log("Initializing file integrity monitoring...");
    this.CRITICAL_DIRECTORIES.forEach(dir => {
      this.calculateDirectoryHashes(dir);
    });
    console.log(`File integrity baseline created for ${Object.keys(this.fileHashes).length} files`);
  }
  
  private calculateDirectoryHashes(directory: string): void {
    try {
      const basePath = path.resolve(directory);
      if (!fs.existsSync(basePath)) {
        console.error(`Directory not found: ${basePath}`);
        return;
      }
      
      const isFile = fs.statSync(basePath).isFile();
      if (isFile) {
        this.fileHashes[basePath] = this.calculateFileHash(basePath);
        return;
      }
      
      const files = fs.readdirSync(basePath);
      for (const file of files) {
        const fullPath = path.join(basePath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          this.calculateDirectoryHashes(fullPath);
        } else {
          this.fileHashes[fullPath] = this.calculateFileHash(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error calculating hashes for ${directory}:`, error);
    }
  }
  
  private calculateFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      console.error(`Error calculating hash for ${filePath}:`, error);
      return '';
    }
  }
  
  async performIntegrityCheck(): Promise<{ status: 'ok' | 'compromised', compromisedFiles: string[] }> {
    console.log("Performing file integrity check...");
    const compromisedFiles: string[] = [];
    
    for (const [filePath, originalHash] of Object.entries(this.fileHashes)) {
      if (!fs.existsSync(filePath)) {
        compromisedFiles.push(`${filePath} (missing)`);
        continue;
      }
      
      const currentHash = this.calculateFileHash(filePath);
      if (currentHash !== originalHash) {
        compromisedFiles.push(filePath);
      }
    }
    
    if (compromisedFiles.length > 0) {
      const severity = compromisedFiles.length > 5 ? 'CRITICAL' : 'HIGH';
      console.error(`[${severity} ALERT] File integrity violation detected for ${compromisedFiles.length} files`);
      
      // Create audit log entry
      await this.createAuditLog({
        action: "file_integrity_violation",
        resource: "file_system",
        details: { compromisedFiles },
        result: "failure"
      });
      
      // Notify administrators
      try {
        const { notificationService } = await import('./notifications');
        await notificationService.sendNotification({
          type: 'security_alert',
          priority: 'critical',
          subject: 'File Integrity Violation Detected',
          message: `${compromisedFiles.length} files have been modified unexpectedly. Possible ransomware attack in progress.`,
          recipients: { roles: ['admin'] }
        });
      } catch (error) {
        console.error("Failed to send security notification:", error);
      }
      
      return { status: 'compromised', compromisedFiles };
    }
    
    return { status: 'ok', compromisedFiles: [] };
  }
  
  // Audit log methods
  async createAuditLog(logData: z.infer<typeof auditLogSchema>) {
    try {
      // Validate log data
      const validData = auditLogSchema.parse(logData);
      
      // Add timestamp if not present
      const timestamp = new Date();
      
      // Store the audit log
      // In a real system, this would use a dedicated audit log table
      console.log(`[AUDIT] ${timestamp.toISOString()} | User: ${validData.userId || 'anonymous'} | Action: ${validData.action} | Resource: ${validData.resource} | Result: ${validData.result}`);
      
      // Return the created log entry
      return {
        ...validData,
        timestamp
      };
    } catch (error) {
      console.error("Error creating audit log:", error);
      throw error;
    }
  }
  
  async getAuditLogs(filters: z.infer<typeof securityReportSchema>) {
    try {
      // Validate filters
      const validFilters = securityReportSchema.parse(filters);
      
      // In a real implementation, this would fetch from the database
      // For now, return mock data
      return [
        {
          id: 1,
          userId: 101,
          action: "login",
          resource: "auth_system",
          result: "success",
          timestamp: new Date(),
          ipAddress: "192.168.1.1"
        },
        {
          id: 2,
          userId: 102,
          action: "view_patient",
          resource: "patient_records",
          resourceId: 1001,
          result: "success",
          timestamp: new Date(),
          ipAddress: "192.168.1.2"
        }
      ];
    } catch (error) {
      console.error("Error getting audit logs:", error);
      throw error;
    }
  }
  
  // Login security functions
  checkLoginLimits(username: string, ipAddress: string) {
    const key = `${username}:${ipAddress}`;
    const now = Date.now();
    const windowMs = this.LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000;
    
    // Clean up old entries
    for (const k in this.loginAttempts) {
      if (now - this.loginAttempts[k].timestamp > windowMs) {
        delete this.loginAttempts[k];
      }
    }
    
    const attempts = this.loginAttempts[key] || { count: 0, timestamp: now };
    
    if (attempts.count >= this.LOGIN_ATTEMPT_LIMIT) {
      return {
        allowed: false,
        waitTimeMs: attempts.timestamp + windowMs - now,
        attemptsRemaining: 0
      };
    }
    
    return {
      allowed: true,
      waitTimeMs: 0,
      attemptsRemaining: this.LOGIN_ATTEMPT_LIMIT - attempts.count
    };
  }
  
  async recordLoginAttempt(username: string, ipAddress: string, success: boolean) {
    const key = `${username}:${ipAddress}`;
    const now = Date.now();
    
    if (!this.loginAttempts[key]) {
      this.loginAttempts[key] = { count: 0, timestamp: now };
    }
    
    if (!success) {
      this.loginAttempts[key].count += 1;
      this.loginAttempts[key].timestamp = now;
    } else {
      // Reset on successful login
      delete this.loginAttempts[key];
    }
    
    // Log the attempt
    await this.createAuditLog({
      action: "login_attempt",
      resource: "auth_system",
      details: { username },
      ipAddress,
      result: success ? "success" : "failure"
    });
    
    // If there are suspicious patterns, create a security alert
    if (!success && this.loginAttempts[key].count >= 3) {
      // Import notification service dynamically to avoid circular dependencies
      try {
        const { notificationService } = await import('./notifications');
        await notificationService.sendNotification({
          type: 'security_alert',
          priority: 'high',
          subject: 'Multiple Failed Login Attempts',
          message: `Multiple failed login attempts detected for user ${username} from IP ${ipAddress}`,
          recipients: { roles: ['admin'] }
        });
      } catch (error) {
        console.error("Failed to send security notification:", error);
      }
    }
  }
  
  // Check permissions for sensitive data access
  async checkAccessPermission(accessRequest: z.infer<typeof sensitiveDataAccessSchema>) {
    try {
      // Validate access request
      const validRequest = sensitiveDataAccessSchema.parse(accessRequest);
      
      // Default access levels by role
      const roleAccessLevels: Record<string, string[]> = {
        "doctor": ["patients", "medical_records", "xrays", "treatment_plans", "prescriptions"],
        "staff": ["patients", "appointments", "payments", "insurance"],
        "patient": ["self_records", "appointments", "payments"],
        "admin": ["all"]
      };
      
      // Check if role has access to resource type
      const roleAccess = roleAccessLevels[validRequest.role] || [];
      
      // Admin role has access to everything
      if (validRequest.role === "admin" || roleAccess.includes("all")) {
        // Still log the access for audit purposes
        await this.createAuditLog({
          userId: validRequest.userId,
          action: "access_resource",
          resource: validRequest.resourceType,
          resourceId: validRequest.resourceId,
          details: { role: validRequest.role, purpose: validRequest.purpose },
          result: "success"
        });
        
        return { allowed: true, reason: "Role has required access" };
      }
      
      // Check if the role has access to this resource type
      if (!roleAccess.includes(validRequest.resourceType)) {
        await this.createAuditLog({
          userId: validRequest.userId,
          action: "access_resource",
          resource: validRequest.resourceType,
          resourceId: validRequest.resourceId,
          details: { role: validRequest.role, purpose: validRequest.purpose },
          result: "failure"
        });
        
        return { allowed: false, reason: "Role does not have access to this resource type" };
      }
      
      // For patients, check if they're accessing their own records
      if (validRequest.role === "patient") {
        // If resource type is "self_records", check if the resourceId matches the userId
        if (validRequest.resourceType === "self_records" && validRequest.resourceId !== validRequest.userId) {
          await this.createAuditLog({
            userId: validRequest.userId,
            action: "access_resource",
            resource: validRequest.resourceType,
            resourceId: validRequest.resourceId,
            details: { role: validRequest.role, purpose: validRequest.purpose },
            result: "failure"
          });
          
          return { allowed: false, reason: "Patients can only access their own records" };
        }
      }
      
      // Log the access for audit purposes
      await this.createAuditLog({
        userId: validRequest.userId,
        action: "access_resource",
        resource: validRequest.resourceType,
        resourceId: validRequest.resourceId,
        details: { role: validRequest.role, purpose: validRequest.purpose },
        result: "success"
      });
      
      return { allowed: true, reason: "Access granted" };
    } catch (error) {
      console.error("Error checking access permission:", error);
      throw error;
    }
  }
  
  // Password strength validation
  validatePasswordStrength(password: string) {
    const issues: string[] = [];
    
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      issues.push(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (this.PASSWORD_REQUIRES_MIXED_CASE && !/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      issues.push("Password must contain both uppercase and lowercase letters");
    }
    
    if (this.PASSWORD_REQUIRES_NUMBERS && !/\d/.test(password)) {
      issues.push("Password must contain at least one number");
    }
    
    if (this.PASSWORD_REQUIRES_SYMBOLS && !/[^a-zA-Z0-9]/.test(password)) {
      issues.push("Password must contain at least one special character");
    }
    
    // Check for common passwords
    const commonPasswords = ["password", "123456", "qwerty", "admin", "welcome", "dental", "dentist"];
    if (commonPasswords.includes(password.toLowerCase())) {
      issues.push("Password is too common and easily guessable");
    }
    
    // Calculate password strength score (0-100)
    let strength = 0;
    
    // Base score from length
    strength += Math.min(30, password.length * 2);
    
    // Bonus for character variety
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/\d/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    // Bonus for mixed character types
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 10;
    if (/[a-zA-Z]/.test(password) && /\d/.test(password)) strength += 10;
    if (/[a-zA-Z0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    // Cap at 100
    strength = Math.min(100, strength);
    
    return {
      valid: issues.length === 0,
      strength,
      issues,
      category: strength < 40 ? "weak" : strength < 70 ? "moderate" : "strong"
    };
  }
  
  // Generate secure token
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Hash password with modern algorithm
  async hashPassword(password: string) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  // Compare password with hashed version
  async comparePasswords(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Generate JWT token
  generateJWT(payload: Record<string, any>) {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRY });
  }
  
  // Verify JWT token
  verifyJWT(token: string) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
  
  // Generate HIPAA access report
  async generateHIPAAAccessReport(patientId: number, startDate?: Date, endDate?: Date) {
    try {
      // In a real implementation, this would query the audit logs
      // For now, return mock data
      return {
        patient: { id: patientId, name: "John Doe" },
        accessEvents: [
          {
            id: 1,
            userId: 101,
            userName: "Dr. Smith",
            userRole: "doctor",
            accessType: "view",
            resourceType: "medical_record",
            timestamp: new Date(),
            ipAddress: "192.168.1.100",
            reason: "Treatment planning"
          }
        ],
        reportGenerated: new Date(),
        dateRange: {
          from: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: endDate || new Date()
        }
      };
    } catch (error) {
      console.error("Error generating HIPAA access report:", error);
      throw error;
    }
  }
  
  // Ransomware prevention tools
  async backupEncryptionKeys() {
    // Generate a backup encryption key
    const backupKey = crypto.randomBytes(32).toString('hex');
    
    // In a production system, this would be securely stored
    // For demonstration purposes only
    console.log("Generated new backup encryption key");
    
    return { key: backupKey, generated: new Date() };
  }
  
  // Detect suspicious file operations (potential ransomware behavior)
  async monitorFileOperations(operations: Array<{ path: string, operation: 'read' | 'write' | 'delete' }>) {
    const suspiciousPatterns = [
      { threshold: 20, timeWindow: 60 * 1000, action: "alert" }, // 20 operations in 1 minute
      { threshold: 50, timeWindow: 5 * 60 * 1000, action: "block" } // 50 operations in 5 minutes
    ];
    
    // Implementation would track file operations and detect patterns
    // For demonstration only
    return { suspicious: false, reason: "No suspicious patterns detected" };
  }
}

// Create and export an instance
export const securityService = new SecurityService();
