import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";
import { requireAuth } from "./middleware/auth";

// Define a simplified user type for authentication purposes
type AuthUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialization: string | null;
};

// Extend Express User interface for TypeScript type checking
declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(8).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // For test accounts and development environment, allow direct comparison
    // This makes dev/testing easier while maintaining security in production
    if (process.env.NODE_ENV !== 'production') {
      // Direct match for testing (stored password IS the password)
      if (stored === supplied) {
        console.log('Development mode: Direct password match');
        return true;
      }
      
      // Test account special handling
      if (supplied === 'password' && ['dentist', 'drabdin', 'maryrdh', 'patient1', 'patient2', 'patient3', 'patient4', 'patient5'].some(
        username => stored.includes(username) || stored === 'password'
      )) {
        console.log('Development mode: Allowing test account password match');
        return true;
      }
    }

    // Make sure we have a valid stored password format
    if (!stored || !stored.includes(".")) {
      console.log("Stored password doesn't use salt separator format, trying bcrypt comparison");
      
      // Try with bcrypt format (used by some scripts)
      try {
        const bcrypt = require('bcrypt');
        if (stored.startsWith('$2')) { // bcrypt hash format
          return await bcrypt.compare(supplied, stored);
        }
      } catch (e) {
        console.log("Not a bcrypt format or bcrypt isn't available");
      }
      
      console.error("Invalid stored password format, missing salt separator");
      return false;
    }

    const [hashed, salt] = stored.split(".");
    
    // Validate both parts exist before attempting comparison
    if (!hashed || !salt) {
      console.error("Invalid stored password parts, either hash or salt is missing");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(router: express.Router) {
  // Use a default session secret in development mode
  const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret-dentamind-app';

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  router.use(session(sessionSettings));
  router.use(passport.initialize());
  router.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for user: ${username}`);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }

        // Handle both possible password field names (password and passwordHash)
        // First try 'password' field, then fall back to 'passwordHash' if it exists
        let storedPassword = user.password;
        if (!storedPassword && 'passwordHash' in user) {
          storedPassword = (user as any).passwordHash;
          console.log(`Using passwordHash field for user ${username}`);
        }
        
        if (!storedPassword) {
          console.error(`No password field found for user ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isValidPassword = await comparePasswords(password, storedPassword);
        console.log(`Password validation result for ${username}: ${isValidPassword}`);

        if (!isValidPassword) {
          console.log(`Password validation failed for ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }

        // Create an AuthUser object with only the needed properties
        const authUser: AuthUser = {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          // Handle specialization properly - it may not exist in the user object schema
          specialization: user.specialization || null,
        };

        return done(null, authUser);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Create an AuthUser object with only the needed properties
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role,
        // Handle specialization properly - it may not exist in the user object schema
        specialization: null,
      };
      
      done(null, authUser);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error);
    }
  });

  router.post("/auth/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", { username: req.body.username });

      if (!req.body.username || !req.body.password || !req.body.firstName || !req.body.lastName || !req.body.email) {
        return res.status(400).json({ 
          message: "Username, password, firstName, lastName, and email are required" 
        });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user object matching the InsertUser schema
      const userToCreate: InsertUser = {
        username: req.body.username,
        password: hashedPassword,
        role: (req.body.role as "doctor" | "staff" | "patient") || "doctor",
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        language: req.body.language || "en",
        phoneNumber: req.body.phoneNumber || null,
        dateOfBirth: req.body.dateOfBirth || null,
        insuranceProvider: req.body.insuranceProvider || null,
        insuranceNumber: req.body.insuranceNumber || null,
        specialization: req.body.specialization || null,
        licenseNumber: req.body.licenseNumber || null,
      };

      // Process subscription data for provider accounts
      if (req.body.role === "doctor" && req.body.subscriptionPlan) {
        console.log(`Provider registration with subscription plan: ${req.body.subscriptionPlan}`);
        
        // In a production environment, this would integrate with a payment processor
        // like Stripe to handle the payment details and create a subscription
        
        // Payment information verification would happen here
        const paymentData = {
          cardName: req.body.cardName,
          cardNumber: req.body.cardNumber,
          expirationDate: req.body.expirationDate,
          cvv: req.body.cvv,
          billingAddress: req.body.billingAddress,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode
        };
        
        // For security reasons, we don't want to log full card details
        console.log("Processing payment for subscription:", {
          plan: req.body.subscriptionPlan,
          cardName: paymentData.cardName,
          // Only log last 4 digits if card number exists
          lastFourDigits: paymentData.cardNumber ? 
            paymentData.cardNumber.slice(-4) : 'none'
        });
        
        // For demo purposes, we'll simulate a successful subscription creation
        const subscriptionDetails = {
          plan: req.body.subscriptionPlan,
          startDate: new Date(),
          status: 'active',
          // Calculate end date as 30 days from now
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
        
        // In a real app, we would store the subscription in the database
        console.log("Created subscription:", subscriptionDetails);
        
        // Extend the user object with subscription information
        // This would be added to the user profile in a real app
        userToCreate.metadata = {
          subscription: {
            plan: subscriptionDetails.plan,
            status: subscriptionDetails.status,
          }
        };
      }
      
      const user = await storage.createUser(userToCreate);

      console.log(`User registered successfully: ${user.username}`);

      // If this is a staff or doctor account, assign required training modules
      if (['doctor', 'staff', 'admin'].includes(user.role)) {
        try {
          // Check if the training module assignment endpoint exists and is accessible
          console.log(`Assigning required training modules to new ${user.role} user: ${user.username} (${user.id})`);
          
          // Determine role-specific training requirements
          const roleBasedModuleTypes = [];
          
          // Common training for all staff
          roleBasedModuleTypes.push('hipaa', 'osha', 'emergency_protocols');
          
          // Role-specific training
          if (user.role === 'doctor') {
            roleBasedModuleTypes.push('ada', 'infection_control', 'cpr');
          } else if (user.role === 'staff') {
            // Determine if clinical or administrative staff based on specialization
            if (user.specialization && ['hygienist', 'dental_assistant', 'nurse'].includes(user.specialization)) {
              roleBasedModuleTypes.push('infection_control', 'cpr');
            }
          }
          
          // Use the database directly to avoid circular imports
          const { db } = require('./db');
          const { trainingModules, userCertifications } = require('../shared/schema');
          const { and, eq, sql } = require('drizzle-orm');
          
          // Find all active modules that match the required types for this role
          const modules = await db.select()
            .from(trainingModules)
            .where(
              and(
                eq(trainingModules.isActive, true),
                sql`${trainingModules.moduleType} IN (${roleBasedModuleTypes})`
              )
            );
          
          console.log(`Found ${modules.length} training modules to assign to user ${user.id}`);
          
          // Assign each module to the user
          for (const module of modules) {
            await db.insert(userCertifications).values({
              userId: user.id,
              moduleId: module.id,
              status: 'not_started',
              progress: 0,
              assignedAt: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
            });
            console.log(`Assigned training module: ${module.title} to user ${user.id}`);
          }
          
          console.log(`Successfully assigned ${modules.length} training modules to user ${user.id}`);
        } catch (error) {
          console.error(`Error assigning training modules to new user ${user.id}:`, error);
          // We don't want to fail registration if training assignment fails
        }
      }

      // Create an AuthUser object for session login
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        // Handle specialization properly - it may not exist in the user object schema
        specialization: user.specialization || null,
      };

      req.login(authUser, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        res.status(201).json(authUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  router.post("/auth/login", (req, res, next) => {
    try {
      console.log("Login attempt:", { username: req.body.username });

      if (!req.body.username || !req.body.password) {
        console.log("Login rejected - missing credentials");
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Log the test account recognition for debugging
      if (req.body.username === 'dentist' && req.body.password === 'password') {
        console.log("Recognized test account: dentist");
      } else if (req.body.username === 'drabdin' && req.body.password === 'password') {
        console.log("Recognized test account: drabdin");
      } else if (req.body.username === 'maryrdh' && req.body.password === 'password') {
        console.log("Recognized test account: maryrdh");
      } else if (req.body.username === 'patient1' && req.body.password === 'password') {
        console.log("Recognized test account: patient1");
      } else if (req.body.username === 'patient2' && req.body.password === 'password') {
        console.log("Recognized test account: patient2");
      } else if (req.body.username === 'patient3' && req.body.password === 'password') {
        console.log("Recognized test account: patient3");
      } else if (req.body.username === 'patient4' && req.body.password === 'password') {
        console.log("Recognized test account: patient4");
      } else if (req.body.username === 'patient5' && req.body.password === 'password') {
        console.log("Recognized test account: patient5");
      }

      passport.authenticate("local", (err: Error | null, user: AuthUser | false, info: { message: string } | undefined) => {
        if (err) {
          console.error("Login authentication error:", err);
          return next(err);
        }

        if (!user) {
          console.log("Login failed:", info?.message);
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }

        console.log("Authentication successful, establishing session for:", user.username);
        
        req.login(user, (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return next(err);
          }
          
          // Validate session was created properly
          if (!req.user) {
            console.error("Session creation failed - no user in request after login");
            return res.status(500).json({ message: "Failed to establish session" });
          }
          
          console.log(`User logged in successfully: ${user.username} (${user.role})`);
          
          // Return user data for client-side state
          res.status(200).json(user);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Unexpected login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  router.post("/auth/logout", (req, res, next) => {
    const username = req.user?.username;
    console.log(`Logout attempt for user: ${username}`);

    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      console.log(`User logged out successfully: ${username}`);
      res.sendStatus(200);
    });
  });

  // MFA setup endpoint
  router.post("/auth/mfa/setup", requireAuth, async (req, res) => {
    try {
      // This would actually generate MFA secrets and QR codes in a production app
      // For demo purposes, we're just returning mock data
      const mfaSecret = randomBytes(20).toString('hex');
      res.json({
        mfaSecret,
        currentCode: "123456", // This would be generated based on the secret
        setupUri: `otpauth://totp/DentaMind:${req.user?.username}?secret=${mfaSecret}&issuer=DentaMind`
      });
    } catch (error) {
      console.error("MFA setup error:", error);
      res.status(500).json({ message: "Failed to setup MFA" });
    }
  });

  // MFA enable endpoint
  router.post("/auth/mfa/enable", requireAuth, (req, res) => {
    try {
      const { verificationCode } = req.body;
      
      if (!verificationCode) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      
      // In a real app, this would verify the code against the user's MFA secret
      // and then enable MFA for their account
      res.json({ success: true });
    } catch (error) {
      console.error("MFA enable error:", error);
      res.status(500).json({ message: "Failed to enable MFA" });
    }
  });

  // MFA disable endpoint
  router.post("/auth/mfa/disable", requireAuth, (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // In a real app, this would verify the password and disable MFA
      res.json({ success: true });
    } catch (error) {
      console.error("MFA disable error:", error);
      res.status(500).json({ message: "Failed to disable MFA" });
    }
  });

  // Password change endpoint
  router.post("/auth/password/change", requireAuth, (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      
      // In a real app, this would verify the current password and update to the new one
      res.json({ success: true });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  router.get("/user", (req, res) => {
    // Log the request without sensitive details
    console.log(`User endpoint accessed. Authenticated: ${req.isAuthenticated()}`);
    
    if (!req.isAuthenticated()) {
      // Create an audit log
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      console.log(`[AUDIT] ${new Date().toISOString()} | User: anonymous | Action: api_request | Resource: /user | Result: success`);
      console.log("Unauthenticated user tried to access /user");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // User is authenticated, return user data
    res.json(req.user);
  });
}