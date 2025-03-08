import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";

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

        // We need to access the passwordHash property from storage
        const isValidPassword = await comparePasswords(password, user.passwordHash);
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

  router.post("/register", async (req, res, next) => {
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

  router.post("/login", (req, res, next) => {
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

  router.post("/logout", (req, res, next) => {
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

  router.get("/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthenticated user tried to access /user");
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}