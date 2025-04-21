import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";
import { MemStorage } from '../storage.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const storage = new MemStorage();

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In a real app, verify JWT token here
    // For now, we'll just get the user from storage
    const userId = parseInt(token); // Using token as userId for demo
    const user = await storage.getEntity('user', userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  };
};

// Middleware to ensure users can only access their own data
export const requireOwnership = (paramIdField: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const resourceId = parseInt(req.params[paramIdField]);
    const user = req.user!;

    // Doctors and staff can access all records
    if (user.role === "doctor" || user.role === "staff") {
      return next();
    }

    // Patients can only access their own records
    if (user.role === "patient" && resourceId !== user.id) {
      return res.status(403).json({ message: "Forbidden: Cannot access other patients' data" });
    }

    next();
  };
};

// Helper to check if user has required role
export const hasRole = (user: User, roles: string[]): boolean => {
  return roles.includes(user.role);
};
