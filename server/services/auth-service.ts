
import { securityService } from './security';
import { storage } from '../storage';
import { z } from 'zod';

// Input validation schemas
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  mfaCode: z.string().optional()
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['doctor', 'assistant', 'receptionist', 'admin']),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional()
});

class AuthService {
  async login(credentials: z.infer<typeof loginSchema>) {
    try {
      // Validate input
      const validatedInput = loginSchema.parse(credentials);
      
      // Check rate limiting for login attempts
      if (!securityService.checkLoginAttempts(validatedInput.username)) {
        await securityService.createAuditLog({
          action: 'login_attempt',
          resource: 'auth_system',
          result: 'error',
          details: { 
            reason: 'Too many login attempts', 
            username: validatedInput.username 
          }
        });
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      // Find user by username
      const user = await storage.findUserByUsername(validatedInput.username);
      if (!user) {
        await securityService.createAuditLog({
          action: 'login_attempt',
          resource: 'auth_system',
          result: 'error',
          details: { 
            reason: 'User not found', 
            username: validatedInput.username 
          }
        });
        throw new Error('Invalid username or password');
      }
      
      // Verify password
      const isPasswordValid = securityService.verifyPassword(
        user.passwordHash, 
        validatedInput.password
      );
      
      if (!isPasswordValid) {
        await securityService.createAuditLog({
          userId: user.id,
          action: 'login_attempt',
          resource: 'auth_system',
          result: 'error',
          details: { reason: 'Invalid password' }
        });
        throw new Error('Invalid username or password');
      }
      
      // Check for MFA if enabled
      if (user.mfaEnabled) {
        // If MFA is required but code not provided, return MFA challenge
        if (!validatedInput.mfaCode) {
          return {
            status: 'mfa_required',
            userId: user.id
          };
        }
        
        // Verify MFA code
        const isMfaValid = securityService.verifyTOTPCode(
          user.mfaSecret,
          validatedInput.mfaCode
        );
        
        if (!isMfaValid) {
          await securityService.createAuditLog({
            userId: user.id,
            action: 'login_attempt',
            resource: 'auth_system',
            result: 'error',
            details: { reason: 'Invalid MFA code' }
          });
          throw new Error('Invalid MFA code');
        }
      }
      
      // All validations passed, generate tokens
      const token = securityService.generateJWT(user.id, user.role);
      const refreshToken = securityService.generateRefreshToken(user.id);
      
      // Reset login attempts counter
      securityService.resetLoginAttempts(validatedInput.username);
      
      // Log successful login
      await securityService.createAuditLog({
        userId: user.id,
        action: 'login',
        resource: 'auth_system',
        result: 'success'
      });
      
      // Return user data and tokens
      return {
        status: 'success',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          specialization: user.specialization
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async register(userData: z.infer<typeof registerSchema>) {
    try {
      // Validate input
      const validatedInput = registerSchema.parse(userData);
      
      // Check if username already exists
      const existingUser = await storage.findUserByUsername(validatedInput.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Check if email already exists
      const existingEmail = await storage.findUserByEmail(validatedInput.email);
      if (existingEmail) {
        throw new Error('Email already in use');
      }
      
      // Validate password strength
      const passwordCheck = securityService.validatePassword(validatedInput.password);
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.reason || 'Password does not meet requirements');
      }
      
      // Hash password
      const passwordHash = securityService.hashPassword(validatedInput.password);
      
      // Generate MFA secret (even if not enabled yet)
      const mfaSecret = securityService.generateTOTPSecret();
      
      // Create user
      const newUser = await storage.createUser({
        ...validatedInput,
        passwordHash,
        mfaSecret,
        mfaEnabled: false
      });
      
      // Log user creation
      await securityService.createAuditLog({
        userId: newUser.id,
        action: 'register',
        resource: 'auth_system',
        result: 'success'
      });
      
      // Generate initial tokens
      const token = securityService.generateJWT(newUser.id, newUser.role);
      const refreshToken = securityService.generateRefreshToken(newUser.id);
      
      // Return user data and tokens
      return {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          specialization: newUser.specialization
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = securityService.verifyJWT(refreshToken) as any;
      
      if (!decoded || decoded.tokenType !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      
      // Get user data
      const user = await storage.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new tokens
      const newToken = securityService.generateJWT(user.id, user.role);
      const newRefreshToken = securityService.generateRefreshToken(user.id);
      
      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
  
  async setupMFA(userId: number) {
    try {
      // Get user
      const user = await storage.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new MFA secret if needed
      const mfaSecret = user.mfaSecret || securityService.generateTOTPSecret();
      
      // Generate a test code to display to user
      const currentCode = securityService.generateTOTPCode(mfaSecret);
      
      // Save the MFA secret if it's new
      if (!user.mfaSecret) {
        await storage.updateUser(userId, { mfaSecret });
      }
      
      // Return MFA setup info
      return {
        mfaSecret,
        currentCode,
        setupUri: `otpauth://totp/DentaMind:${user.username}?secret=${mfaSecret}&issuer=DentaMind`
      };
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  }
  
  async enableMFA(userId: number, verificationCode: string) {
    try {
      // Get user
      const user = await storage.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify the provided code against the secret
      const isValid = securityService.verifyTOTPCode(user.mfaSecret, verificationCode);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }
      
      // Enable MFA for the user
      await storage.updateUser(userId, { mfaEnabled: true });
      
      // Log MFA enablement
      await securityService.createAuditLog({
        userId,
        action: 'enable_mfa',
        resource: 'auth_system',
        result: 'success'
      });
      
      return { success: true };
    } catch (error) {
      console.error('MFA enable error:', error);
      throw error;
    }
  }
  
  async disableMFA(userId: number, password: string) {
    try {
      // Get user
      const user = await storage.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify password before allowing MFA disable
      const isPasswordValid = securityService.verifyPassword(
        user.passwordHash, 
        password
      );
      
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
      
      // Disable MFA
      await storage.updateUser(userId, { mfaEnabled: false });
      
      // Log MFA disablement
      await securityService.createAuditLog({
        userId,
        action: 'disable_mfa',
        resource: 'auth_system',
        result: 'success'
      });
      
      return { success: true };
    } catch (error) {
      console.error('MFA disable error:', error);
      throw error;
    }
  }
  
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      // Get user
      const user = await storage.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isPasswordValid = securityService.verifyPassword(
        user.passwordHash, 
        currentPassword
      );
      
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Validate new password strength
      const passwordCheck = securityService.validatePassword(newPassword);
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.reason || 'New password does not meet requirements');
      }
      
      // Hash new password
      const passwordHash = securityService.hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(userId, { passwordHash });
      
      // Log password change
      await securityService.createAuditLog({
        userId,
        action: 'change_password',
        resource: 'auth_system',
        result: 'success'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
