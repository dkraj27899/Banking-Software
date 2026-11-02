import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';

interface BranchRow {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

function mapRow(row: BranchRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query<BranchRow>(
      `SELECT id, code, name, address, city, state, pincode, phone, is_active, created_at
       FROM branches ORDER BY code ASC`,
    );
    res.json({ success: true, data: result.rows.map(mapRow) });
  } catch (err) {
    next(err);
  }
}

export async function getBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query<BranchRow>(
      `SELECT id, code, name, address, city, state, pincode, phone, is_active, created_at
       FROM branches WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branch not found' },
      });
      return;
    }

    res.json({ success: true, data: mapRow(result.rows[0]!) });
  } catch (err) {
    next(err);
  }
}

export async function createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, name, address, city, state, pincode, phone } = req.body as {
      code: string;
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    };

    const result = await query<{ id: string }>(
      `INSERT INTO branches (code, name, address, city, state, pincode, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [code, name, address, city, state, pincode, phone],
    );

    const branchId = result.rows[0]!.id;

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'BRANCH_CREATE',
      entityType: 'branches',
      entityId: branchId,
      details: { code, name },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.status(201).json({
      success: true,
      data: { id: branchId, message: 'Branch created' },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const updates = req.body as Record<string, unknown>;

    const fieldMap: Record<string, string> = {
      name: 'name',
      address: 'address',
      city: 'city',
      state: 'state',
      pincode: 'pincode',
      phone: 'phone',
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
    const result = await query(
      `UPDATE branches SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING id`,
      params,
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branch not found' },
      });
      return;
    }

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'BRANCH_UPDATE',
      entityType: 'branches',
      entityId: id,
      details: updates,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Branch updated' } });
  } catch (err) {
    next(err);
  }
}
