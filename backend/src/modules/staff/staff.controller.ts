import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { hashPassword } from '../../utils/password.js';
import { logAudit } from '../../middleware/auditLog.js';
import type { RoleCode } from '@bccs/shared';

interface StaffRow {
  id: string;
  username: string;
  full_name: string;
  email: string;
  mobile: string;
  role: RoleCode;
  branch_id: string;
  branch_name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: StaffRow) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    mobile: row.mobile,
    role: row.role,
    branchId: row.branch_id,
    branchName: row.branch_name,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, sortBy, sortOrder, search } = req.query as unknown as {
      page: number;
      pageSize: number;
      sortBy?: string;
      sortOrder: string;
      search?: string;
    };

    const allowedSortColumns = ['full_name', 'username', 'role', 'created_at'];
    const sortColumn = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE s.full_name ILIKE $${params.length} OR s.username ILIKE $${params.length}`;
    }

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM staff_users s ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0]!.count, 10);

    params.push(pageSize, offset);
    const dataResult = await query<StaffRow>(
      `SELECT s.id, s.username, s.full_name, s.email, s.mobile, s.role, s.branch_id, b.name AS branch_name,
              s.is_active, s.last_login_at, s.created_at, s.updated_at
       FROM staff_users s
       JOIN branches b ON s.branch_id = b.id
       ${whereClause}
       ORDER BY s.${sortColumn} ${order}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({
      success: true,
      data: dataResult.rows.map(mapRow),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query<StaffRow>(
      `SELECT s.id, s.username, s.full_name, s.email, s.mobile, s.role, s.branch_id, b.name AS branch_name,
              s.is_active, s.last_login_at, s.created_at, s.updated_at
       FROM staff_users s
       JOIN branches b ON s.branch_id = b.id
       WHERE s.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff member not found' },
      });
      return;
    }

    res.json({ success: true, data: mapRow(result.rows[0]!) });
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password, fullName, email, mobile, role, branchId } = req.body as {
      username: string;
      password: string;
      fullName: string;
      email: string;
      mobile: string;
      role: RoleCode;
      branchId: string;
    };

    const passwordHash = await hashPassword(password);

    const result = await query<{ id: string }>(
      `INSERT INTO staff_users (username, password_hash, full_name, email, mobile, role, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [username, passwordHash, fullName, email, mobile, role, branchId],
    );

    const staffId = result.rows[0]!.id;

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'STAFF_CREATE',
      entityType: 'staff_users',
      entityId: staffId,
      details: { username, role, branchId },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.status(201).json({
      success: true,
      data: { id: staffId, message: 'Staff member created successfully' },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const updates = req.body as Record<string, unknown>;

    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      email: 'email',
      mobile: 'mobile',
      role: 'role',
      branchId: 'branch_id',
      isActive: 'is_active',
    };

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const column = fieldMap[key];
      if (column && value !== undefined) {
        params.push(value);
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_CHANGES', message: 'No valid fields to update' },
      });
      return;
    }

    params.push(id);
    setClauses.push('updated_at = NOW()');

    const result = await query(
      `UPDATE staff_users SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING id`,
      params,
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff member not found' },
      });
      return;
    }

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'STAFF_UPDATE',
      entityType: 'staff_users',
      entityId: id,
      details: updates,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Staff member updated' } });
  } catch (err) {
    next(err);
  }
}

export async function deactivateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    if (id === req.user!.id) {
      res.status(400).json({
        success: false,
        error: { code: 'SELF_DEACTIVATION', message: 'Cannot deactivate your own account' },
      });
      return;
    }

    const result = await query(
      `UPDATE staff_users SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING id`,
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff member not found or already inactive' },
      });
      return;
    }

    // Revoke all sessions
    const keys = await redis.keys(`rt:${id}:*`);
    if (keys.length > 0) await redis.del(...keys);

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'STAFF_DEACTIVATE',
      entityType: 'staff_users',
      entityId: id,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Staff member deactivated and sessions revoked' } });
  } catch (err) {
    next(err);
  }
}
