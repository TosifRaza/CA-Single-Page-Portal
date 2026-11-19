import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Handler]:', err);

  // Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: err.errors[0]?.message || 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    const field = Array.isArray(err.meta?.target) ? err.meta.target[0] : err.meta?.target || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      field,
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(400).json({
      success: false,
      message: 'The requested record was not found.',
    });
    return;
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
