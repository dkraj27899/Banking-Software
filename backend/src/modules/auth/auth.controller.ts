import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { logAudit } from '../../middleware/auditLog.js';
import { logger } from '../../utils/logger.js';
import { ROLE_PERMISSIONS } from '@bccs/shared';
import type { RoleCode } from '@bccs/shared';

const REFRESH_TOKEN_PREFIX = 'rt:';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

interface StaffRow {
  id: string;
  username: string;
  full_name: string;
  password_hash: string;
  role: RoleCode;
  branch_id: string;
  branch_name: string;
  is_active: boolean;
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body as { username: string; password: string };

    const result = await query<StaffRow>(
      `SELECT s.id, s.username, s.full_name, s.password_hash, s.role, s.branch_id, b.name AS branch_name, s.is_active
       FROM staff_users s
       JOIN branches b ON s.branch_id = b.id
       WHERE s.username = $1`,
      [username],
    );

    const staff = result.rows[0];

    if (!staff) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
      });
      return;
    }

    if (!staff.is_active) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is deactivated. Contact your administrator.' },
      });
      return;
    }

    const valid = await verifyPassword(password, staff.password_hash);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
      });
      return;
    }

    const permissions = ROLE_PERMISSIONS[staff.role] ?? [];

    const tokenFamily = uuidv4();
    const accessToken = generateAccessToken({
      userId: staff.id,
      username: staff.username,
      fullName: staff.full_name,
      role: staff.role,
      branchId: staff.branch_id,
      branchName: staff.branch_name,
      permissions: [...permissions],
    });
    const refreshToken = generateRefreshToken({
      userId: staff.id,
      tokenFamily,
    });

    await redis.set(
      `${REFRESH_TOKEN_PREFIX}${staff.id}:${tokenFamily}`,
      '1',
      'EX',
      REFRESH_TOKEN_TTL,
    );

    await query(
      `UPDATE staff_users SET last_login_at = NOW() WHERE id = $1`,
      [staff.id],
    );

    logAudit({
      actorId: staff.id,
      actorName: staff.full_name,
      action: 'AUTH_LOGIN',
      entityType: 'staff_users',
      entityId: staff.id,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: staff.branch_id,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: staff.id,
          username: staff.username,
          fullName: staff.full_name,
          role: staff.role,
          permissions: [...permissions],
          branchId: staff.branch_id,
          branchName: staff.branch_name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Invalid refresh token' },
      });
      return;
    }

    const redisKey = `${REFRESH_TOKEN_PREFIX}${payload.userId}:${payload.tokenFamily}`;
    const exists = await redis.exists(redisKey);

    if (!exists) {
      logger.warn('Refresh token reuse detected — revoking all sessions for user', {
        userId: payload.userId,
      });
      const keys = await redis.keys(`${REFRESH_TOKEN_PREFIX}${payload.userId}:*`);
      if (keys.length > 0) await redis.del(...keys);

      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_REVOKED', message: 'Session expired. Please log in again.' },
      });
      return;
    }

    await redis.del(redisKey);

    const staffResult = await query<StaffRow>(
      `SELECT s.id, s.username, s.full_name, s.role, s.branch_id, b.name AS branch_name, s.is_active
       FROM staff_users s
       JOIN branches b ON s.branch_id = b.id
       WHERE s.id = $1`,
      [payload.userId],
    );

    const staff = staffResult.rows[0];
    if (!staff || !staff.is_active) {
      res.status(401).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is no longer active' },
      });
      return;
    }

    const permissions = ROLE_PERMISSIONS[staff.role] ?? [];
    const newFamily = uuidv4();

    const accessToken = generateAccessToken({
      userId: staff.id,
      username: staff.username,
      fullName: staff.full_name,
      role: staff.role,
      branchId: staff.branch_id,
      branchName: staff.branch_name,
      permissions: [...permissions],
    });
    const refreshTokenNew = generateRefreshToken({
      userId: staff.id,
      tokenFamily: newFamily,
    });

    await redis.set(
      `${REFRESH_TOKEN_PREFIX}${staff.id}:${newFamily}`,
      '1',
      'EX',
      REFRESH_TOKEN_TTL,
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenNew,
        user: {
          id: staff.id,
          username: staff.username,
          fullName: staff.full_name,
          role: staff.role,
          permissions: [...permissions],
          branchId: staff.branch_id,
          branchName: staff.branch_name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const keys = await redis.keys(`${REFRESH_TOKEN_PREFIX}${req.user.id}:*`);
    if (keys.length > 0) await redis.del(...keys);

    logAudit({
      actorId: req.user.id,
      actorName: req.user.fullName,
      action: 'AUTH_LOGOUT',
      entityType: 'staff_users',
      entityId: req.user.id,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user.branchId,
    });

    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const result = await query<{ password_hash: string }>(
      `SELECT password_hash FROM staff_users WHERE id = $1`,
      [req.user.id],
    );

    const staff = result.rows[0];
    if (!staff) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const valid = await verifyPassword(currentPassword, staff.password_hash);
    if (!valid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
      });
      return;
    }

    const newHash = await hashPassword(newPassword);

    await query(
      `UPDATE staff_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, req.user.id],
    );

    // Revoke all existing sessions so user re-authenticates with new password
    const keys = await redis.keys(`${REFRESH_TOKEN_PREFIX}${req.user.id}:*`);
    if (keys.length > 0) await redis.del(...keys);

    logAudit({
      actorId: req.user.id,
      actorName: req.user.fullName,
      action: 'AUTH_PASSWORD_CHANGE',
      entityType: 'staff_users',
      entityId: req.user.id,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user.branchId,
    });

    res.json({ success: true, data: { message: 'Password changed. Please log in again.' } });
  } catch (err) {
    next(err);
  }
}
