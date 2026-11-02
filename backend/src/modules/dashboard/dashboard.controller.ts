import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [members, accounts, deposits, pendingTxns, todayTxns, recentTxns] = await Promise.all([
      query<{ total: string; active: string; pending: string }>(
        `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending
         FROM members`,
      ),
      query<{ total: string; active: string; total_balance: string }>(
        `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COALESCE(SUM(balance_paise) FILTER (WHERE status = 'active'), 0) AS total_balance
         FROM accounts`,
      ),
      query<{ product_type: string; count: string; balance: string }>(
        `SELECT p.account_type AS product_type, COUNT(*) AS count,
                COALESCE(SUM(a.balance_paise), 0) AS balance
         FROM accounts a
         JOIN account_products p ON a.product_id = p.id
         WHERE a.status = 'active'
         GROUP BY p.account_type`,
      ),
      query<{ count: string; total_amount: string }>(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount_paise), 0) AS total_amount
         FROM transactions WHERE status = 'pending'`,
      ),
      query<{ count: string; deposits: string; withdrawals: string }>(
        `SELECT
          COUNT(*) AS count,
          COALESCE(SUM(amount_paise) FILTER (WHERE transaction_type IN ('cash_deposit','loan_disbursement','interest_posting')), 0) AS deposits,
          COALESCE(SUM(amount_paise) FILTER (WHERE transaction_type IN ('cash_withdrawal','loan_repayment','fee_charge')), 0) AS withdrawals
         FROM transactions
         WHERE status = 'posted' AND posted_at >= CURRENT_DATE`,
      ),
      query<{
        id: string; transaction_number: string; transaction_type: string;
        amount_paise: string; status: string; member_name: string;
        account_number: string; created_at: string;
      }>(
        `SELECT t.id, t.transaction_number, t.transaction_type,
                t.amount_paise, t.status, m.full_name AS member_name,
                a.account_number, t.created_at
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         JOIN members m ON a.member_id = m.id
         ORDER BY t.created_at DESC LIMIT 10`,
      ),
    ]);

    const memberStats = members.rows[0]!;
    const accountStats = accounts.rows[0]!;
    const pendingStats = pendingTxns.rows[0]!;
    const todayStats = todayTxns.rows[0]!;

    const depositBreakdown = deposits.rows.map((r) => ({
      productType: r.product_type,
      count: parseInt(r.count, 10),
      balancePaise: Number(r.balance),
    }));

    res.json({
      success: true,
      data: {
        members: {
          total: parseInt(memberStats.total, 10),
          active: parseInt(memberStats.active, 10),
          pending: parseInt(memberStats.pending, 10),
        },
        accounts: {
          total: parseInt(accountStats.total, 10),
          active: parseInt(accountStats.active, 10),
          totalBalancePaise: Number(accountStats.total_balance),
        },
        depositBreakdown,
        pendingAuthorizations: {
          count: parseInt(pendingStats.count, 10),
          totalAmountPaise: Number(pendingStats.total_amount),
        },
        today: {
          transactionCount: parseInt(todayStats.count, 10),
          depositsPaise: Number(todayStats.deposits),
          withdrawalsPaise: Number(todayStats.withdrawals),
        },
        recentTransactions: recentTxns.rows.map((r) => ({
          id: r.id,
          transactionNumber: r.transaction_number,
          transactionType: r.transaction_type,
          amountPaise: Number(r.amount_paise),
          status: r.status,
          memberName: r.member_name,
          accountNumber: r.account_number,
          createdAt: r.created_at,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLedgerSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query<{
      code: string; name: string; account_type: string; normal_balance: string;
      total_debit: string; total_credit: string;
    }>(
      `SELECT c.code, c.name, c.account_type, c.normal_balance,
              COALESCE(SUM(jel.debit_paise), 0) AS total_debit,
              COALESCE(SUM(jel.credit_paise), 0) AS total_credit
       FROM chart_of_accounts c
       LEFT JOIN journal_entry_lines jel ON jel.account_id = c.id
       WHERE c.is_header = false AND c.is_active = true
       GROUP BY c.id, c.code, c.name, c.account_type, c.normal_balance
       ORDER BY c.code`,
    );

    const totalDebits = result.rows.reduce((sum, r) => sum + Number(r.total_debit), 0);
    const totalCredits = result.rows.reduce((sum, r) => sum + Number(r.total_credit), 0);

    res.json({
      success: true,
      data: {
        accounts: result.rows.map((r) => {
          const debit = Number(r.total_debit);
          const credit = Number(r.total_credit);
          const balance = r.normal_balance === 'debit' ? debit - credit : credit - debit;
          return {
            code: r.code,
            name: r.name,
            accountType: r.account_type,
            normalBalance: r.normal_balance,
            totalDebitPaise: debit,
            totalCreditPaise: credit,
            balancePaise: balance,
          };
        }),
        trialBalance: {
          totalDebitsPaise: totalDebits,
          totalCreditsPaise: totalCredits,
          isBalanced: totalDebits === totalCredits,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
