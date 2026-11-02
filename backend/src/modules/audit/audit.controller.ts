import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';

interface AuditRow {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  branch_id: string;
  created_at: string;
}

function mapRow(row: AuditRow) {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    ipAddress: row.ip_address,
    branchId: row.branch_id,
    createdAt: row.created_at,
  };
}

export async function listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
    const { action, entityType, actorId, dateFrom, dateTo } = req.query as unknown as {
      action?: string;
      entityType?: string;
      actorId?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (action) {
      params.push(action);
      conditions.push(`a.action = $${params.length}`);
    }
    if (entityType) {
      params.push(entityType);
      conditions.push(`a.entity_type = $${params.length}`);
    }
    if (actorId) {
      params.push(actorId);
      conditions.push(`a.actor_id = $${params.length}::uuid`);
    }
    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`a.created_at >= $${params.length}::timestamptz`);
    }
    if (dateTo) {
      params.push(dateTo);
      conditions.push(`a.created_at <= $${params.length}::timestamptz`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_logs a ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0]!.count, 10);

    params.push(pageSize, offset);
    const dataResult = await query<AuditRow>(
      `SELECT a.id, a.actor_id, COALESCE(a.actor_name, s.full_name, 'Unknown') AS actor_name,
              a.action, a.entity_type, a.entity_id,
              a.details, a.ip_address, a.branch_id, a.created_at
       FROM audit_logs a
       LEFT JOIN staff_users s ON a.actor_id = s.id
       ${whereClause}
       ORDER BY a.created_at DESC
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
