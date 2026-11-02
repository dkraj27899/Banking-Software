import api from './client';
import type { ApiResponse, PaginationParams } from '@bccs/shared';

export interface AccountProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  accountType: string;
  minBalancePaise: number;
  interestRateBps: number;
  isActive: boolean;
}

export interface Account {
  id: string;
  accountNumber: string | null;
  memberId: string;
  memberName: string;
  membershipNumber: string;
  productId: string;
  productName: string;
  productType: string;
  branchId: string;
  branchName: string;
  status: string;
  balancePaise: number;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

export async function listAccounts(params: PaginationParams & { status?: string; productId?: string }) {
  const { data } = await api.get<ApiResponse<Account[]>>('/accounts', { params });
  return data;
}

export async function getAccount(id: string) {
  const { data } = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
  return data.data;
}

export async function getAccountByNumber(accountNumber: string) {
  const { data } = await api.get<ApiResponse<Account>>(`/accounts/by-number/${accountNumber}`);
  return data.data;
}

export async function getAccountsByMember(memberId: string) {
  const { data } = await api.get<ApiResponse<Account[]>>(`/accounts/by-member/${memberId}`);
  return data.data ?? [];
}

export async function createAccount(payload: { memberId: string; productId: string }) {
  const { data } = await api.post<ApiResponse<{ id: string; accountNumber: string }>>('/accounts', payload);
  return data.data;
}

export async function approveAccount(id: string) {
  const { data } = await api.post<ApiResponse<{ accountNumber: string }>>(`/accounts/${id}/approve`);
  return data.data;
}

export async function changeAccountProduct(id: string, productId: string) {
  const { data } = await api.patch<ApiResponse>(`/accounts/${id}/product`, { productId });
  return data;
}

export async function closeAccount(id: string, closureReason: string) {
  const { data } = await api.post<ApiResponse>(`/accounts/${id}/close`, { closureReason });
  return data;
}

export async function listAccountProducts() {
  const { data } = await api.get<ApiResponse<AccountProduct[]>>('/accounts/products');
  return data.data ?? [];
}
