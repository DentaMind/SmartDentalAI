import { Request, Response, NextFunction } from 'express';

// Validates that a parameter is a valid MongoDB ObjectId
export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const objectId = req.params[paramName];
    
    // Basic ObjectId validation (24 character hex string)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectId || !objectIdPattern.test(objectId)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: `The ${paramName} parameter must be a valid ObjectId`
      });
    }
    
    next();
  };
}; 