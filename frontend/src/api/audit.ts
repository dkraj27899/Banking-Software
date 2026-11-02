import api from './client';
import type { ApiResponse, AuditLogEntry, PaginationParams } from '@bccs/shared';

export async function listAuditLogs(params: PaginationParams & {
  action?: string;
  entityType?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { data } = await api.get<ApiResponse<AuditLogEntry[]>>('/audit', { params });
  return data;
}
