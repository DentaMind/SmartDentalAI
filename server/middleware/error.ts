import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuditLogService } from '../services/audit-log';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  // Log the error
  await AuditLogService.logAction(
    req.user?.id || 0,
    req.user?.email || 'system',
    req.user?.role || 'system',
    'error',
    'error',
    err.message,
    {
      path: req.path,
      method: req.method,
      error: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  );

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}; 