import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';

export async function getDailyCash(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = String(req.query['date'] ?? new Date().toISOString().slice(0, 10));

    const result = await query<{
      total_deposits: string;
      total_withdrawals: string;
      txn_count: string;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN transaction_type IN ('cash_deposit','loan_disbursement','interest_posting') THEN amount_paise ELSE 0 END), 0) AS total_deposits,
        COALESCE(SUM(CASE WHEN transaction_type NOT IN ('cash_deposit','loan_disbursement','interest_posting') THEN amount_paise ELSE 0 END), 0) AS total_withdrawals,
        COUNT(*) AS txn_count
       FROM transactions
       WHERE status = 'posted'
         AND posted_at >= $1::date
         AND posted_at < ($1::date + interval '1 day')`,
      [date],
    );

    const row = result.rows[0]!;
    const totalDeposits = Number(row.total_deposits);
    const totalWithdrawals = Number(row.total_withdrawals);

    res.json({
      success: true,
      data: {
        date,
        totalDepositsPaise: totalDeposits,
        totalWithdrawalsPaise: totalWithdrawals,
        netCashPaise: totalDeposits - totalWithdrawals,
        transactionCount: parseInt(row.txn_count, 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const month = String(req.query['month'] ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    const result = await query<{
      day: string;
      total_deposits: string;
      total_withdrawals: string;
      txn_count: string;
    }>(
      `SELECT
        posted_at::date AS day,
        COALESCE(SUM(CASE WHEN transaction_type IN ('cash_deposit','loan_disbursement','interest_posting') THEN amount_paise ELSE 0 END), 0) AS total_deposits,
        COALESCE(SUM(CASE WHEN transaction_type NOT IN ('cash_deposit','loan_disbursement','interest_posting') THEN amount_paise ELSE 0 END), 0) AS total_withdrawals,
        COUNT(*) AS txn_count
       FROM transactions
       WHERE status = 'posted'
         AND posted_at >= ($1 || '-01')::date
         AND posted_at < (($1 || '-01')::date + interval '1 month')
       GROUP BY posted_at::date
       ORDER BY day`,
      [month],
    );

    const totalDepositsPaise = result.rows.reduce((s, r) => s + Number(r.total_deposits), 0);
    const totalWithdrawalsPaise = result.rows.reduce((s, r) => s + Number(r.total_withdrawals), 0);
    const totalTransactions = result.rows.reduce((s, r) => s + parseInt(r.txn_count, 10), 0);

    const byType = await query<{ transaction_type: string; total_paise: string; cnt: string }>(
      `SELECT transaction_type, SUM(amount_paise) AS total_paise, COUNT(*) AS cnt
       FROM transactions
       WHERE status = 'posted'
         AND posted_at >= ($1 || '-01')::date
         AND posted_at < (($1 || '-01')::date + interval '1 month')
       GROUP BY transaction_type
       ORDER BY total_paise DESC`,
      [month],
    );

    res.json({
      success: true,
      data: {
        month,
        totalDepositsPaise,
        totalWithdrawalsPaise,
        netCashPaise: totalDepositsPaise - totalWithdrawalsPaise,
        totalTransactions,
        activeDays: result.rows.length,
        daily: result.rows.map((r) => ({
          date: r.day,
          depositsPaise: Number(r.total_deposits),
          withdrawalsPaise: Number(r.total_withdrawals),
          count: parseInt(r.txn_count, 10),
        })),
        byType: byType.rows.map((r) => ({
          type: r.transaction_type,
          totalPaise: Number(r.total_paise),
          count: parseInt(r.cnt, 10),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMemberGrowth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const months = Number(req.query['months']) || 6;

    const monthly = await query<{ month: string; new_members: string; total_active: string }>(
      `SELECT
        to_char(date_trunc('month', application_date), 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE status IN ('active','pending')) AS new_members,
        0 AS total_active
       FROM members
       WHERE application_date >= (CURRENT_DATE - ($1 || ' months')::interval)
       GROUP BY date_trunc('month', application_date)
       ORDER BY month`,
      [months],
    );

    const totals = await query<{ status: string; cnt: string }>(
      `SELECT status, COUNT(*) AS cnt FROM members GROUP BY status`,
    );

    const byType = await query<{ membership_type: string; cnt: string }>(
      `SELECT membership_type, COUNT(*) AS cnt FROM members WHERE status = 'active' GROUP BY membership_type`,
    );

    const statusMap: Record<string, number> = {};
    for (const r of totals.rows) statusMap[r.status] = parseInt(r.cnt, 10);

    res.json({
      success: true,
      data: {
        totalActive: statusMap['active'] ?? 0,
        totalPending: statusMap['pending'] ?? 0,
        totalInactive: statusMap['inactive'] ?? 0,
        totalRejected: statusMap['rejected'] ?? 0,
        monthly: monthly.rows.map((r) => ({
          month: r.month,
          newMembers: parseInt(r.new_members, 10),
        })),
        byType: byType.rows.map((r) => ({
          type: r.membership_type,
          count: parseInt(r.cnt, 10),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLoanPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await query<{
      status: string;
      cnt: string;
      total_principal: string;
      total_outstanding: string;
    }>(
      `SELECT status, COUNT(*) AS cnt,
        SUM(principal_paise) AS total_principal,
        SUM(outstanding_principal_paise) AS total_outstanding
       FROM loans GROUP BY status`,
    );

    const byProduct = await query<{
      product_name: string;
      cnt: string;
      total_principal: string;
      total_outstanding: string;
      avg_rate_bps: string;
    }>(
      `SELECT lp.name AS product_name, COUNT(*) AS cnt,
        SUM(l.principal_paise) AS total_principal,
        SUM(l.outstanding_principal_paise) AS total_outstanding,
        AVG(l.interest_rate_bps)::int AS avg_rate_bps
       FROM loans l JOIN loan_products lp ON l.product_id = lp.id
       WHERE l.status = 'active'
       GROUP BY lp.name`,
    );

    const overdue = await query<{ cnt: string; total_overdue: string }>(
      `SELECT COUNT(DISTINCT l.id) AS cnt,
        SUM(rs.total_paise - rs.paid_paise) AS total_overdue
       FROM repayment_schedules rs
       JOIN loans l ON rs.loan_id = l.id
       WHERE rs.status = 'overdue' AND l.status = 'active'`,
    );

    const statusMap: Record<string, { count: number; principalPaise: number; outstandingPaise: number }> = {};
    for (const r of summary.rows) {
      statusMap[r.status] = {
        count: parseInt(r.cnt, 10),
        principalPaise: Number(r.total_principal),
        outstandingPaise: Number(r.total_outstanding),
      };
    }

    const active = statusMap['active'] ?? { count: 0, principalPaise: 0, outstandingPaise: 0 };

    res.json({
      success: true,
      data: {
        activeLoans: active.count,
        totalDisbursedPaise: active.principalPaise,
        totalOutstandingPaise: active.outstandingPaise,
        closedLoans: statusMap['closed']?.count ?? 0,
        overdueLoans: parseInt(overdue.rows[0]?.cnt ?? '0', 10),
        totalOverduePaise: Number(overdue.rows[0]?.total_overdue ?? 0),
        byProduct: byProduct.rows.map((r) => ({
          product: r.product_name,
          count: parseInt(r.cnt, 10),
          principalPaise: Number(r.total_principal),
          outstandingPaise: Number(r.total_outstanding),
          avgRateBps: Number(r.avg_rate_bps),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getExpenseSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const month = String(req.query['month'] ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    const byCategory = await query<{
      category_name: string;
      cnt: string;
      total_paise: string;
    }>(
      `SELECT ec.name AS category_name, COUNT(*) AS cnt, SUM(e.amount_paise) AS total_paise
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.status IN ('approved','paid')
         AND e.expense_date >= ($1 || '-01')::date
         AND e.expense_date < (($1 || '-01')::date + interval '1 month')
       GROUP BY ec.name
       ORDER BY total_paise DESC`,
      [month],
    );

    const totalPaise = byCategory.rows.reduce((s, r) => s + Number(r.total_paise), 0);
    const totalCount = byCategory.rows.reduce((s, r) => s + parseInt(r.cnt, 10), 0);

    const prevMonth = await query<{ total_paise: string }>(
      `SELECT COALESCE(SUM(amount_paise), 0) AS total_paise
       FROM expenses
       WHERE status IN ('approved','paid')
         AND expense_date >= (($1 || '-01')::date - interval '1 month')
         AND expense_date < ($1 || '-01')::date`,
      [month],
    );

    res.json({
      success: true,
      data: {
        month,
        totalPaise,
        totalCount,
        previousMonthPaise: Number(prevMonth.rows[0]?.total_paise ?? 0),
        byCategory: byCategory.rows.map((r) => ({
          category: r.category_name,
          count: parseInt(r.cnt, 10),
          totalPaise: Number(r.total_paise),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const asOf = String(req.query['asOf'] ?? new Date().toISOString().slice(0, 10));

    const result = await query<{
      code: string;
      name: string;
      account_type: string;
      normal_balance: string;
      is_header: boolean;
      total_debit: string;
      total_credit: string;
    }>(
      `SELECT
        coa.code, coa.name, coa.account_type, coa.normal_balance, coa.is_header,
        COALESCE(SUM(jel.debit_paise), 0) AS total_debit,
        COALESCE(SUM(jel.credit_paise), 0) AS total_credit
       FROM chart_of_accounts coa
       LEFT JOIN (
         SELECT jel2.account_id, jel2.debit_paise, jel2.credit_paise
         FROM journal_entry_lines jel2
         JOIN journal_entries je ON jel2.journal_entry_id = je.id
         WHERE je.entry_date <= $1::date
       ) jel ON jel.account_id = coa.id
       WHERE coa.is_active = true AND coa.is_header = false
       GROUP BY coa.code, coa.name, coa.account_type, coa.normal_balance, coa.is_header
       ORDER BY coa.code`,
      [asOf],
    );

    let totalDebit = 0;
    let totalCredit = 0;
    const accounts = result.rows.map((r) => {
      const debit = Number(r.total_debit);
      const credit = Number(r.total_credit);
      const net = debit - credit;
      const debitBalance = net > 0 ? net : 0;
      const creditBalance = net < 0 ? -net : 0;
      totalDebit += debitBalance;
      totalCredit += creditBalance;
      return {
        code: r.code,
        name: r.name,
        type: r.account_type,
        debitPaise: debitBalance,
        creditPaise: creditBalance,
      };
    }).filter((a) => a.debitPaise > 0 || a.creditPaise > 0);

    res.json({
      success: true,
      data: {
        asOf,
        accounts,
        totalDebitPaise: totalDebit,
        totalCreditPaise: totalCredit,
        isBalanced: totalDebit === totalCredit,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getGeneralLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountCode = String(req.query['account'] ?? '1000');
    const now = new Date();
    const month = String(req.query['month'] ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    const acct = await query<{ id: string; code: string; name: string; account_type: string; normal_balance: string }>(
      `SELECT id, code, name, account_type, normal_balance FROM chart_of_accounts WHERE code = $1`,
      [accountCode],
    );

    if (acct.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'GL account not found' } });
      return;
    }

    const account = acct.rows[0]!;

    const openingResult = await query<{ balance: string }>(
      `SELECT COALESCE(SUM(jel.debit_paise) - SUM(jel.credit_paise), 0) AS balance
       FROM journal_entry_lines jel
       JOIN journal_entries je ON jel.journal_entry_id = je.id
       WHERE jel.account_id = $1 AND je.entry_date < ($2 || '-01')::date`,
      [account.id, month],
    );

    const entries = await query<{
      entry_date: string;
      entry_number: string;
      description: string;
      debit_paise: string;
      credit_paise: string;
    }>(
      `SELECT je.entry_date, je.entry_number, je.description,
        jel.debit_paise, jel.credit_paise
       FROM journal_entry_lines jel
       JOIN journal_entries je ON jel.journal_entry_id = je.id
       WHERE jel.account_id = $1
         AND je.entry_date >= ($2 || '-01')::date
         AND je.entry_date < (($2 || '-01')::date + interval '1 month')
       ORDER BY je.entry_date, je.entry_number`,
      [account.id, month],
    );

    let runningBalance = Number(openingResult.rows[0]?.balance ?? 0);
    const lines = entries.rows.map((r) => {
      const debit = Number(r.debit_paise);
      const credit = Number(r.credit_paise);
      runningBalance += debit - credit;
      return {
        date: r.entry_date,
        entryNumber: r.entry_number,
        description: r.description,
        debitPaise: debit,
        creditPaise: credit,
        balancePaise: runningBalance,
      };
    });

    const allAccounts = await query<{ code: string; name: string }>(
      `SELECT code, name FROM chart_of_accounts WHERE is_active = true AND is_header = false ORDER BY code`,
    );

    res.json({
      success: true,
      data: {
        account: { code: account.code, name: account.name, type: account.account_type },
        month,
        openingBalancePaise: Number(openingResult.rows[0]?.balance ?? 0),
        closingBalancePaise: runningBalance,
        entries: lines,
        availableAccounts: allAccounts.rows.map((r) => ({ code: r.code, name: r.name })),
      },
    });
  } catch (err) {
    next(err);
  }
}
