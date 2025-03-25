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
  specialization?: string;
};

// Extend Express User interface for TypeScript type checking
declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
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

        // For the updated DB structure, direct access password field
        const isValidPassword = await comparePasswords(password, user.password || "");
        console.log(`Password validation result for ${username}: ${isValidPassword}`);

        if (!isValidPassword) {
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
          specialization: user.specialization,
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
        specialization: user.specialization,
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

      // Create an AuthUser object for session login
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
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
        return res.status(400).json({ message: "Username and password are required" });
      }

      passport.authenticate("local", (err: Error | null, user: AuthUser | false, info: { message: string } | undefined) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }

        if (!user) {
          console.log("Login failed:", info?.message);
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }

        req.login(user, (err) => {
          if (err) {
            console.error("Session error:", err);
            return next(err);
          }
          console.log(`User logged in successfully: ${user.username}`);
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