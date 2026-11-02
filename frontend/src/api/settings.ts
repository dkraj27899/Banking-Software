import api from './client';
import type { ApiResponse } from '@bccs/shared';

export interface SystemConfig {
  key: string;
  value: unknown;
  description: string | null;
  module: string;
  updatedAt: string;
}

export async function listConfig() {
  const { data } = await api.get<ApiResponse<SystemConfig[]>>('/config');
  return data.data ?? [];
}

export async function updateConfig(key: string, value: unknown) {
  const { data } = await api.patch<ApiResponse>(`/config/${key}`, { value });
  return data;
}
