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
