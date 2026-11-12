import api from './client';
import type { ApiResponse } from '@bccs/shared';

export interface PassbookEntry {
  date: string;
  reference: string;
  description: string;
  debitPaise: number;
  creditPaise: number;
  balancePaise: number;
}

export interface PassbookData {
  accountNumber: string;
  memberName: string;
  productName: string;
  branchName: string;
  openingBalancePaise: number;
  closingBalancePaise: number;
  entries: PassbookEntry[];
}

export async function getPassbook(accountId: string, params?: { dateFrom?: string; dateTo?: string }): Promise<PassbookData | undefined> {
  const { data } = await api.get<ApiResponse<{
    account: {
      accountNumber: string;
      memberName: string;
      membershipNumber: string;
      productName: string;
      productType: string;
      currentBalancePaise: number;
      branchName: string;
    };
    entries: Array<{
      transactionNumber: string;
      date: string;
      description: string;
      type: string;
      paymentMethod: string;
      referenceNumber: string | null;
      depositPaise: number;
      withdrawalPaise: number;
      balancePaise: number;
    }>;
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>>(`/statements/${accountId}/passbook`, {
    params: {
      fromDate: params?.dateFrom,
      toDate: params?.dateTo,
    },
  });

  const raw = data.data;
  if (!raw) return undefined;

  const entries = raw.entries ?? [];
  const openingBalance = entries.length > 0
    ? entries[0]!.balancePaise - entries[0]!.depositPaise + entries[0]!.withdrawalPaise
    : raw.account.currentBalancePaise;
  const closingBalance = entries.length > 0
    ? entries[entries.length - 1]!.balancePaise
    : raw.account.currentBalancePaise;

  return {
    accountNumber: raw.account.accountNumber,
    memberName: raw.account.memberName,
    productName: raw.account.productName,
    branchName: raw.account.branchName ?? '',
    openingBalancePaise: openingBalance,
    closingBalancePaise: closingBalance,
    entries: entries.map((e) => ({
      date: e.date,
      reference: e.referenceNumber ?? e.transactionNumber,
      description: e.description,
      debitPaise: e.withdrawalPaise,
      creditPaise: e.depositPaise,
      balancePaise: e.balancePaise,
    })),
  };
}

export async function getReportDailyCash(date?: string) {
  const { data } = await api.get<ApiResponse<{
    date: string;
    totalDepositsPaise: number;
    totalWithdrawalsPaise: number;
    netCashPaise: number;
    transactionCount: number;
  }>>('/reports/daily-cash', { params: { date } });
  return data.data;
}

export async function getMonthlyTransactions(month?: string) {
  const { data } = await api.get<ApiResponse<{
    month: string;
    totalDepositsPaise: number;
    totalWithdrawalsPaise: number;
    netCashPaise: number;
    totalTransactions: number;
    activeDays: number;
    daily: { date: string; depositsPaise: number; withdrawalsPaise: number; count: number }[];
    byType: { type: string; totalPaise: number; count: number }[];
  }>>('/reports/monthly-transactions', { params: { month } });
  return data.data;
}

export async function getMemberGrowth(months?: number) {
  const { data } = await api.get<ApiResponse<{
    totalActive: number;
    totalPending: number;
    totalInactive: number;
    totalRejected: number;
    monthly: { month: string; newMembers: number }[];
    byType: { type: string; count: number }[];
  }>>('/reports/member-growth', { params: { months } });
  return data.data;
}

export async function getLoanPortfolio() {
  const { data } = await api.get<ApiResponse<{
    activeLoans: number;
    totalDisbursedPaise: number;
    totalOutstandingPaise: number;
    closedLoans: number;
    overdueLoans: number;
    totalOverduePaise: number;
    byProduct: { product: string; count: number; principalPaise: number; outstandingPaise: number; avgRateBps: number }[];
  }>>('/reports/loan-portfolio');
  return data.data;
}

export async function getExpenseSummary(month?: string) {
  const { data } = await api.get<ApiResponse<{
    month: string;
    totalPaise: number;
    totalCount: number;
    previousMonthPaise: number;
    byCategory: { category: string; count: number; totalPaise: number }[];
  }>>('/reports/expense-summary', { params: { month } });
  return data.data;
}

export async function getTrialBalance(asOf?: string) {
  const { data } = await api.get<ApiResponse<{
    asOf: string;
    accounts: { code: string; name: string; type: string; debitPaise: number; creditPaise: number }[];
    totalDebitPaise: number;
    totalCreditPaise: number;
    isBalanced: boolean;
  }>>('/reports/trial-balance', { params: { asOf } });
  return data.data;
}

export async function getGeneralLedger(account?: string, month?: string) {
  const { data } = await api.get<ApiResponse<{
    account: { code: string; name: string; type: string };
    month: string;
    openingBalancePaise: number;
    closingBalancePaise: number;
    entries: { date: string; entryNumber: string; description: string; debitPaise: number; creditPaise: number; balancePaise: number }[];
    availableAccounts: { code: string; name: string }[];
  }>>('/reports/general-ledger', { params: { account, month } });
  return data.data;
}
