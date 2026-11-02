import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';

export async function listConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query<{
      key: string; value: unknown; description: string | null; updated_at: string;
    }>(`SELECT key, value, description, updated_at FROM system_configuration ORDER BY key`);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        key: r.key,
        value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value),
        description: r.description,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = String(req.params['key']);
    const result = await query<{
      key: string; value: unknown; description: string | null; updated_at: string;
    }>(`SELECT key, value, description, updated_at FROM system_configuration WHERE key = $1`, [key]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Configuration key not found' } });
      return;
    }

    const r = result.rows[0]!;
    res.json({
      success: true,
      data: {
        key: r.key,
        value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value),
        description: r.description,
        updatedAt: r.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = String(req.params['key']);
    const { value, description } = req.body as { value: string; description?: string };

    const existing = await query<{ value: unknown }>(
      `SELECT value FROM system_configuration WHERE key = $1`, [key],
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Configuration key not found' } });
      return;
    }

    const oldValue = existing.rows[0]!.value;

    if (description !== undefined) {
      await query(
        `UPDATE system_configuration SET value = $1::jsonb, description = $2, updated_at = NOW() WHERE key = $3`,
        [JSON.stringify(value), description, key],
      );
    } else {
      await query(
        `UPDATE system_configuration SET value = $1::jsonb, updated_at = NOW() WHERE key = $2`,
        [JSON.stringify(value), key],
      );
    }

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'CONFIG_UPDATE',
      entityType: 'system_configuration',
      entityId: key,
      details: { key, oldValue, newValue: value },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: `Configuration '${key}' updated` } });
  } catch (err) {
    next(err);
  }
}
