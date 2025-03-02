
import { storage } from "../storage";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

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

class SecurityService {
  // JWT Configuration
  private readonly JWT_SECRET = process.env.JWT_SECRET || "dentamind-dev-secret-key";
  private readonly JWT_EXPIRY = "8h";
  private readonly REFRESH_TOKEN_EXPIRY = "30d";
  
  // Two-factor authentication settings
  private readonly MFA_ENABLED = true;
  private readonly MFA_EXPIRY_MINUTES = 10;
  
  // Password policy
  private readonly PASSWORD_MIN_LENGTH = 10;
  private readonly PASSWORD_REQUIRES_MIXED_CASE = true;
  private readonly PASSWORD_REQUIRES_NUMBERS = true;
  private readonly PASSWORD_REQUIRES_SYMBOLS = true;
  
  // Rate limiting
  private readonly LOGIN_ATTEMPT_LIMIT = 5;
  private readonly LOGIN_ATTEMPT_WINDOW_MINUTES = 15;
  private readonly API_RATE_LIMIT = 100; // requests per minute
  
  // Login attempt tracking
  private loginAttempts: Record<string, { count: number, timestamp: number }> = {};
  
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
        timestamp,
        id: crypto.randomUUID()
      };
    } catch (error) {
      console.error("Audit log error:", error);
      // Don't throw errors from audit logging - just report them
      return {
        action: "audit_log_error",
        resource: "audit_system",
        result: "error",
        timestamp: new Date(),
        id: crypto.randomUUID(),
        details: { error: error instanceof Error ? error.message : "Unknown error" }
      };
    }
  }
  
  async getAuditLogs(reportParams: z.infer<typeof securityReportSchema>) {
    try {
      // Validate report parameters
      const validParams = securityReportSchema.parse(reportParams);
      
      // In a real system, this would query the audit log table with filters
      console.log(`Getting audit logs with filters:`, validParams);
      
      // Mock audit log data
      return {
        logs: [
          {
            id: "audit-1",
            timestamp: new Date(),
            userId: 1,
            action: "login",
            resource: "auth_system",
            result: "success",
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0"
          },
          {
            id: "audit-2",
            timestamp: new Date(),
            userId: 2,
            action: "view_record",
            resource: "patients",
            resourceId: 123,
            result: "success",
            ipAddress: "192.168.1.2",
            userAgent: "Mozilla/5.0"
          }
        ],
        totalCount: 2,
        filteredCount: 2
      };
    } catch (error) {
      console.error("Audit log retrieval error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to retrieve audit logs");
    }
  }
  
  // Password security
  validatePasswordStrength(password: string) {
    const checks = {
      length: password.length >= this.PASSWORD_MIN_LENGTH,
      mixedCase: !this.PASSWORD_REQUIRES_MIXED_CASE || 
                 (password.match(/[a-z]/) !== null && password.match(/[A-Z]/) !== null),
      numbers: !this.PASSWORD_REQUIRES_NUMBERS || password.match(/[0-9]/) !== null,
      symbols: !this.PASSWORD_REQUIRES_SYMBOLS || password.match(/[^A-Za-z0-9]/) !== null
    };
    
    const passed = Object.values(checks).every(c => c);
    
    return {
      passed,
      checks,
      score: Object.values(checks).filter(c => c).length,
      message: passed ? 
        "Password meets security requirements" : 
        "Password does not meet security requirements"
    };
  }
  
  hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }
  
  verifyPassword(storedPassword: string, suppliedPassword: string) {
    const [salt, hash] = storedPassword.split(':');
    const suppliedHash = crypto
      .pbkdf2Sync(suppliedPassword, salt, 10000, 64, 'sha512')
      .toString('hex');
    return hash === suppliedHash;
  }
  
  // Authentication tokens
  generateAuthTokens(userId: number, role: string) {
    const payload = { userId, role };
    
    const accessToken = jwt.sign(
      payload,
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { ...payload, tokenType: 'refresh' },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
    
    return { accessToken, refreshToken };
  }
  
  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: number, role: string };
    } catch (error) {
      return null;
    }
  }
  
  // Login security
  async checkLoginAttempts(username: string, ipAddress: string) {
    const key = `${username}:${ipAddress}`;
    const now = Date.now();
    const windowMs = this.LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000;
    
    // Clean up old attempts
    Object.keys(this.loginAttempts).forEach(k => {
      if (now - this.loginAttempts[k].timestamp > windowMs) {
        delete this.loginAttempts[k];
      }
    });
    
    // Check current attempts
    const attempts = this.loginAttempts[key] || { count: 0, timestamp: now };
    
    if (attempts.count >= this.LOGIN_ATTEMPT_LIMIT) {
      const timeLeft = Math.ceil((attempts.timestamp + windowMs - now) / 60000);
      return {
        allowed: false,
        attemptsRemaining: 0,
        timeLeftMinutes: timeLeft
      };
    }
    
    return {
      allowed: true,
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
      const hasAccess = roleAccess.includes("all") || roleAccess.includes(validRequest.resourceType);
      
      if (!hasAccess) {
        // Log unauthorized access attempt
        await this.createAuditLog({
          userId: validRequest.userId,
          action: "access_denied",
          resource: validRequest.resourceType,
          resourceId: validRequest.resourceId,
          details: { 
            reason: "insufficient_permissions",
            role: validRequest.role
          },
          result: "failure"
        });
        
        return {
          granted: false,
          reason: "insufficient_permissions"
        };
      }
      
      // For patient role, check if they're accessing their own data
      if (validRequest.role === "patient" && validRequest.resourceType !== "self_records") {
        // Check if the resource belongs to this patient
        const isOwnResource = await this.checkResourceOwnership(
          validRequest.userId,
          validRequest.resourceType,
          validRequest.resourceId
        );
        
        if (!isOwnResource) {
          // Log unauthorized access attempt
          await this.createAuditLog({
            userId: validRequest.userId,
            action: "access_denied",
            resource: validRequest.resourceType,
            resourceId: validRequest.resourceId,
            details: { 
              reason: "not_resource_owner",
              role: validRequest.role
            },
            result: "failure"
          });
          
          return {
            granted: false,
            reason: "not_resource_owner"
          };
        }
      }
      
      // If emergency access is requested, record special audit log
      if (validRequest.isEmergency) {
        await this.createAuditLog({
          userId: validRequest.userId,
          action: "emergency_access",
          resource: validRequest.resourceType,
          resourceId: validRequest.resourceId,
          details: { 
            purpose: validRequest.purpose || "emergency_access",
            role: validRequest.role
          },
          result: "success"
        });
      } else {
        // Standard access log
        await this.createAuditLog({
          userId: validRequest.userId,
          action: "access_resource",
          resource: validRequest.resourceType,
          resourceId: validRequest.resourceId,
          details: { 
            purpose: validRequest.purpose,
            role: validRequest.role
          },
          result: "success"
        });
      }
      
      return {
        granted: true,
        accessLevel: validRequest.isEmergency ? "emergency" : "standard"
      };
    } catch (error) {
      console.error("Access permission check error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to check access permission");
    }
  }
  
  // HIPAA compliance functions
  async logRecordAccess(userId: number, patientId: number, recordType: string, recordId: any, purpose: string) {
    return this.createAuditLog({
      userId,
      action: "view_record",
      resource: recordType,
      resourceId: recordId,
      details: { 
        patientId,
        purpose
      },
      result: "success"
    });
  }
  
  async generateHIPAAAccessReport(patientId: number, startDate?: Date, endDate?: Date) {
    try {
      // In a real system, this would query the audit log for all access to this patient's records
      console.log(`Generating HIPAA access report for patient ${patientId}`);
      
      // Mock report data
      return {
        patientId,
        reportDate: new Date(),
        dateRange: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: endDate || new Date()
        },
        accessEvents: [
          {
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            userId: 1,
            userName: "Dr. Smith",
            userRole: "doctor",
            recordType: "medical_records",
            purpose: "treatment"
          },
          {
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            userId: 2,
            userName: "Jane Admin",
            userRole: "staff",
            recordType: "appointments",
            purpose: "scheduling"
          }
        ]
      };
    } catch (error) {
      console.error("HIPAA report generation error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate HIPAA access report");
    }
  }
  
  // Private helper methods
  private async checkResourceOwnership(userId: number, resourceType: string, resourceId: number | string) {
    // This would check if the resource belongs to the user
    // For example, if a patient is trying to access an appointment,
    // check if the appointment belongs to them
    
    // Mock implementation - in a real system this would query the database
    return true;
  }
}

export const securityService = new SecurityService();
