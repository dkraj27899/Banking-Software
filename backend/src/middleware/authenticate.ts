import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '@bccs/shared';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
      permissions: payload.permissions,
      branchId: payload.branchId,
      branchName: payload.branchName,
    };
    next();
  } catch (err) {
    logger.warn('Invalid access token presented', {
      ip: req.ip,
      error: err instanceof Error ? err.message : 'unknown',
    });
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' },
    });
  }
}
