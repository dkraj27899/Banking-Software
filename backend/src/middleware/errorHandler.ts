import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface PgError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // PostgreSQL unique constraint violation
  const pgErr = err as PgError;
  if (pgErr.code === '23505') {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with the given identifier already exists',
      },
    });
    return;
  }

  // PostgreSQL foreign key violation
  if (pgErr.code === '23503') {
    res.status(400).json({
      success: false,
      error: {
        code: 'REFERENCE_ERROR',
        message: 'Referenced record does not exist',
      },
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token',
      },
    });
    return;
  }

  // Application errors with a status code
  if ('statusCode' in err) {
    const statusCode = (err as Error & { statusCode: number }).statusCode;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'APP_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Unhandled errors
  logger.error('Unhandled error', {
    error: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'An internal error occurred'
        : err.message,
    },
  });
}
