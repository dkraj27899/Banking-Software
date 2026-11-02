import api from './client';

export interface DashboardStats {
  members: { total: number; active: number; pending: number };
  accounts: { total: number; active: number; totalBalancePaise: number };
  depositBreakdown: Array<{ productType: string; count: number; balancePaise: number }>;
  pendingAuthorizations: { count: number; totalAmountPaise: number };
  today: { transactionCount: number; depositsPaise: number; withdrawalsPaise: number };
  recentTransactions: Array<{
    id: string;
    transactionNumber: string;
    transactionType: string;
    amountPaise: number;
    status: string;
    memberName: string;
    accountNumber: string;
    createdAt: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/dashboard/stats');
  return data.data;
}
