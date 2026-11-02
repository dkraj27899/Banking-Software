import api from './client';
import type { ApiResponse, PaginationParams } from '@bccs/shared';

export interface Transaction {
  id: string;
  transactionNumber: string;
  accountId: string;
  accountNumber: string;
  memberName: string;
  transactionType: string;
  amountPaise: number;
  balanceAfterPaise: number | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  description: string | null;
  status: string;
  enteredBy: string;
  enteredByName: string;
  authorizedBy: string | null;
  authorizedByName: string | null;
  postedAt: string | null;
  createdAt: string;
}

export interface CreateTransactionPayload {
  accountId: string;
  transactionType: string;
  amountPaise: number;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  idempotencyKey: string;
}

export async function listTransactions(params: PaginationParams & {
  status?: string;
  transactionType?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
}) {
  const { data } = await api.get<ApiResponse<Transaction[]>>('/transactions', { params });
  return data;
}

export async function createTransaction(payload: CreateTransactionPayload) {
  const { data } = await api.post<ApiResponse<{
    id: string;
    transactionNumber: string;
    balanceAfterPaise: number;
  }>>('/transactions', payload);
  return data.data;
}

export async function authorizeTransaction(id: string, action: 'authorize' | 'reject' = 'authorize', reason?: string) {
  const { data } = await api.post<ApiResponse>(`/transactions/${id}/authorize`, { action, reason });
  return data;
}

export async function reverseTransaction(id: string, reason: string) {
  const { data } = await api.post<ApiResponse>(`/transactions/${id}/reverse`, { reason });
  return data;
}

export async function listPendingApprovals(params: PaginationParams) {
  const { data } = await api.get<ApiResponse<Transaction[]>>('/transactions', {
    params: { ...params, status: 'pending' },
  });
  return data;
}
