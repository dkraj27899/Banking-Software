import api from './client';
import type { ApiResponse, PaginationParams } from '@bccs/shared';

export interface Member {
  id: string;
  membershipNumber: string | null;
  fullName: string;
  fatherGuardianName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  email: string | null;
  aadhaarLast4: string | null;
  aadhaarVerified: boolean;
  panVerified: boolean;
  membershipType: string;
  status: string;
  applicationDate: string;
  approvalDate: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  branchId: string;
  branchName: string;
  createdAt: string;
}

export interface CreateMemberPayload {
  fullName: string;
  fatherGuardianName?: string;
  dateOfBirth?: string;
  gender?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  email?: string;
  aadhaarLast4?: string;
  membershipType: string;
}

export async function listMembers(params: PaginationParams & { status?: string }) {
  const { data } = await api.get<ApiResponse<Member[]>>('/members', { params });
  return data;
}

export async function getMember(id: string) {
  const { data } = await api.get<ApiResponse<Member>>(`/members/${id}`);
  return data.data;
}

export async function createMember(payload: CreateMemberPayload) {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/members', payload);
  return data.data;
}

export async function approveMember(id: string) {
  const { data } = await api.post<ApiResponse<{ membershipNumber: string }>>(`/members/${id}/approve`);
  return data.data;
}

export async function rejectMember(id: string, rejectionReason: string) {
  const { data } = await api.post<ApiResponse>(`/members/${id}/reject`, { rejectionReason });
  return data;
}

export async function updateMember(id: string, payload: Partial<CreateMemberPayload>) {
  const { data } = await api.patch<ApiResponse>(`/members/${id}`, payload);
  return data;
}
