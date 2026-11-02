import api from './client';
import type { ApiResponse, PaginationParams, StaffUser, CreateStaffRequest } from '@bccs/shared';

export async function listStaff(params: PaginationParams) {
  const { data } = await api.get<ApiResponse<StaffUser[]>>('/staff', { params });
  return data;
}

export async function getStaffMember(id: string) {
  const { data } = await api.get<ApiResponse<StaffUser>>(`/staff/${id}`);
  return data.data;
}

export async function createStaff(payload: CreateStaffRequest) {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/staff', payload);
  return data.data;
}

export async function updateStaff(id: string, payload: Partial<CreateStaffRequest & { isActive: boolean }>) {
  const { data } = await api.patch<ApiResponse>(`/staff/${id}`, payload);
  return data;
}

export async function deactivateStaff(id: string) {
  const { data } = await api.patch<ApiResponse>(`/staff/${id}/deactivate`);
  return data;
}

export async function listBranches() {
  const { data } = await api.get<ApiResponse<Array<{ id: string; code: string; name: string; isActive: boolean }>>>('/branches');
  return data.data ?? [];
}
