import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { securityService } from '../services/security';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.path}`
  });
};

// Function to wrap async route handlers to catch errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Centralized error handler
export const errorHandler = (
  err: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);

    // Log validation error
    securityService.createAuditLog({
      userId: (req as any).user?.userId,
      action: 'validation_error',
      resource: req.path,
      result: 'error',
      details: { 
        error: validationError.message,
        path: req.path,
        method: req.method 
      }
    });

    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      details: validationError.details
    });
  }

  // Handle known API errors
  if (err instanceof ApiError) {
    // Log API error if it's significant
    if (err.statusCode >= 500 || err.statusCode === 401 || err.statusCode === 403) {
      securityService.createAuditLog({
        userId: (req as any).user?.userId,
        action: 'api_error',
        resource: req.path,
        result: 'error',
        details: { 
          statusCode: err.statusCode,
          message: err.message,
          path: req.path,
          method: req.method 
        }
      });
    }

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON'
    });
  }

  // Handle JWT errors from express-jwt if used
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  // Log unknown errors
  securityService.createAuditLog({
    userId: (req as any).user?.userId,
    action: 'server_error',
    resource: req.path,
    result: 'error',
    details: { 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method 
    }
  });

  // Default to 500 server error for unhandled errors
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};