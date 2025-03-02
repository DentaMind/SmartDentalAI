
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Custom error class for API errors
export class APIError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "APIError";
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: err.errors.map(e => ({
        path: e.path.join("."),
        message: e.message
      }))
    });
  }
  
  // Handle API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message
    });
  }
  
  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token"
    });
  }
  
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired"
    });
  }
  
  // Handle database errors
  if (err.message.includes("duplicate key")) {
    return res.status(409).json({
      status: "error",
      message: "Resource already exists"
    });
  }
  
  // Handle unknown errors
  const statusCode = err instanceof APIError ? err.statusCode : 500;
  const message = statusCode === 500 
    ? "Internal server error"
    : err.message;
  
  res.status(statusCode).json({
    status: "error",
    message
  });
};

// Rate limiting error handler
export const handleRateLimitError = (
  req: Request,
  res: Response
) => {
  res.status(429).json({
    status: "error",
    message: "Too many requests, please try again later"
  });
};

// Not found handler
export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.path}`
  });
};
