import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
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
