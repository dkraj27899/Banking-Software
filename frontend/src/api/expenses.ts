import api from './client';
import type { ApiResponse, PaginationParams } from '@bccs/shared';

export interface Expense {
  id: string;
  referenceNumber: string;
  category: string;
  description: string;
  amountPaise: number;
  expenseDate: string;
  paymentMethod: string;
  payee: string | null;
  invoiceReference: string | null;
  status: string;
  createdByName: string;
  approvedByName: string | null;
  createdAt: string;
}

export async function listExpenses(params: PaginationParams & { status?: string; category?: string }) {
  const { data } = await api.get<ApiResponse<Expense[]>>('/expenses', { params });
  return data;
}

export async function createExpense(payload: {
  category: string;
  description: string;
  amountPaise: number;
  expenseDate: string;
  paymentMethod: string;
  payee?: string;
  invoiceReference?: string;
}) {
  const { data } = await api.post<ApiResponse<{ id: string; referenceNumber: string }>>('/expenses', payload);
  return data.data;
}

export async function approveExpense(id: string) {
  const { data } = await api.post<ApiResponse>(`/expenses/${id}/approve`);
  return data;
}

export async function rejectExpense(id: string, reason: string) {
  const { data } = await api.post<ApiResponse>(`/expenses/${id}/reject`, { reason });
  return data;
}

export async function markExpensePaid(id: string) {
  const { data } = await api.post<ApiResponse>(`/expenses/${id}/pay`);
  return data;
}
