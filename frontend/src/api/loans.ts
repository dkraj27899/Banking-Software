import api from './client';
import type { ApiResponse, PaginationParams } from '@bccs/shared';

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  interestRateBps: number;
  maxTenureMonths: number;
  minAmountPaise: number;
  maxAmountPaise: number;
  processingFeeBps: number;
  isActive: boolean;
}

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  memberId: string;
  memberName: string;
  accountId: string;
  accountNumber: string;
  productId: string;
  productName: string;
  requestedAmountPaise: number;
  approvedAmountPaise: number | null;
  interestRateBps: number;
  tenureMonths: number;
  emiPaise: number | null;
  purpose: string | null;
  guarantorName: string | null;
  collateralDescription: string | null;
  status: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  memberId: string;
  memberName: string;
  accountNumber: string;
  productName: string;
  principalPaise: number;
  outstandingPaise: number;
  interestRateBps: number;
  tenureMonths: number;
  emiPaise: number;
  nextDueDate: string | null;
  status: string;
  disbursedAt: string | null;
  createdAt: string;
}

export interface RepaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  principalPaise: number;
  interestPaise: number;
  totalPaise: number;
  paidPaise: number;
  status: string;
}

export async function listLoanProducts() {
  const { data } = await api.get<ApiResponse<LoanProduct[]>>('/loans/products');
  return data.data ?? [];
}

export async function listLoanApplications(params: PaginationParams & { status?: string }) {
  const { data } = await api.get<ApiResponse<LoanApplication[]>>('/loans/applications', { params });
  return data;
}

export async function createLoanApplication(payload: {
  memberId: string;
  accountId: string;
  productId: string;
  requestedAmountPaise: number;
  tenureMonths: number;
  purpose?: string;
  guarantorName?: string;
  collateralDescription?: string;
}) {
  const { data } = await api.post<ApiResponse<{ id: string; applicationNumber: string }>>('/loans/applications', payload);
  return data.data;
}

export async function approveLoanApplication(id: string, approvedAmountPaise: number) {
  const { data } = await api.post<ApiResponse>(`/loans/applications/${id}/approve`, { approvedAmountPaise });
  return data;
}

export async function rejectLoanApplication(id: string, reason: string) {
  const { data } = await api.post<ApiResponse>(`/loans/applications/${id}/reject`, { reason });
  return data;
}

export async function disburseLoan(id: string) {
  const { data } = await api.post<ApiResponse<{ loanNumber: string }>>(`/loans/applications/${id}/disburse`);
  return data.data;
}

export async function listActiveLoans(params: PaginationParams) {
  const { data } = await api.get<ApiResponse<Loan[]>>('/loans', { params });
  return data;
}

export async function getLoan(id: string) {
  const { data } = await api.get<ApiResponse<Loan & { schedule: RepaymentScheduleItem[] }>>(`/loans/${id}`);
  return data.data;
}

export async function recordRepayment(loanId: string, amountPaise: number) {
  const { data } = await api.post<ApiResponse>(`/loans/${loanId}/repayment`, { amountPaise });
  return data;
}
