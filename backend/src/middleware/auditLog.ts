import type { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface AuditParams {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  branchId: string;
}

export function logAudit(params: AuditParams): void {
  const { actorId, actorName, action, entityType, entityId, details, ipAddress, branchId } = params;

  query(
    `INSERT INTO audit_logs (actor_id, actor_name, action, entity_type, entity_id, details, ip_address, branch_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [actorId, actorName, action, entityType, entityId, JSON.stringify(details ?? {}), ipAddress, branchId],
  ).catch((err) => {
    logger.error('Failed to write audit log', {
      error: err instanceof Error ? err.message : 'unknown',
      action,
      entityType,
      entityId,
    });
  });
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      logAudit({
        actorId: req.user.id,
        actorName: req.user.fullName,
        action: `${req.method} ${req.originalUrl}`,
        entityType: req.originalUrl.split('/')[2] ?? 'unknown',
        entityId: String(req.params['id'] ?? ''),
        details: { statusCode: res.statusCode },
        ipAddress: (typeof req.ip === 'string' ? req.ip : req.ip?.[0]) ?? 'unknown',
        branchId: req.user.branchId,
      });
    }
    return originalJson(body);
  };

  next();
}
