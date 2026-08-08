import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      console.warn('[Validation] Request body validation failed:', error.errors || error.message);
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid request body parameters',
        errors: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        })) || error.message
      });
    }
  };
};
