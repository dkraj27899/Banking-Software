import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';

export async function getPassbook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountId = String(req.params['accountId']);
    const { fromDate, toDate, page, pageSize } = req.query as unknown as {
      fromDate?: string; toDate?: string; page: number; pageSize: number;
    };

    const pg = Number(page) || 1;
    const ps = Math.min(Number(pageSize) || 50, 100);
    const offset = (pg - 1) * ps;

    const acctResult = await query<{
      id: string; account_number: string; balance_paise: string;
      member_name: string; membership_number: string;
      product_name: string; product_type: string;
      branch_name: string;
    }>(
      `SELECT a.id, a.account_number, a.balance_paise,
              m.full_name AS member_name, m.membership_number,
              p.name AS product_name, p.account_type AS product_type,
              b.name AS branch_name
       FROM accounts a
       JOIN members m ON a.member_id = m.id
       JOIN account_products p ON a.product_id = p.id
       JOIN branches b ON a.branch_id = b.id
       WHERE a.id = $1`,
      [accountId],
    );

    if (acctResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }

    const acct = acctResult.rows[0]!;
    const conditions = [`t.account_id = $1`, `t.status = 'posted'`];
    const params: unknown[] = [accountId];

    if (fromDate) {
      params.push(fromDate);
      conditions.push(`t.posted_at >= $${params.length}::date`);
    }
    if (toDate) {
      params.push(toDate);
      conditions.push(`t.posted_at < ($${params.length}::date + interval '1 day')`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM transactions t ${whereClause}`, params,
    );
    const total = parseInt(countResult.rows[0]!.count, 10);

    const dataParams = [...params, ps, offset];
    const txnResult = await query<{
      id: string; transaction_number: string; transaction_type: string;
      amount_paise: string; balance_after_paise: string;
      description: string | null; payment_method: string;
      reference_number: string | null; posted_at: string;
    }>(
      `SELECT t.id, t.transaction_number, t.transaction_type,
              t.amount_paise, t.balance_after_paise,
              t.description, t.payment_method, t.reference_number, t.posted_at
       FROM transactions t
       ${whereClause}
       ORDER BY t.posted_at ASC, t.created_at ASC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );

    const isCredit = (type: string) =>
      ['cash_deposit', 'loan_disbursement', 'interest_posting'].includes(type);

    const entries = txnResult.rows.map((r) => {
      const amt = Number(r.amount_paise);
      return {
        id: r.id,
        transactionNumber: r.transaction_number,
        date: r.posted_at,
        description: r.description ?? r.transaction_type.replace(/_/g, ' '),
        type: r.transaction_type,
        paymentMethod: r.payment_method,
        referenceNumber: r.reference_number,
        depositPaise: isCredit(r.transaction_type) ? amt : 0,
        withdrawalPaise: isCredit(r.transaction_type) ? 0 : amt,
        balancePaise: Number(r.balance_after_paise),
      };
    });

    res.json({
      success: true,
      data: {
        account: {
          accountNumber: acct.account_number,
          memberName: acct.member_name,
          membershipNumber: acct.membership_number,
          productName: acct.product_name,
          productType: acct.product_type,
          currentBalancePaise: Number(acct.balance_paise),
          branchName: acct.branch_name,
        },
        entries,
        meta: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAccountStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountId = String(req.params['accountId']);
    const { fromDate, toDate } = req.query as unknown as { fromDate: string; toDate: string };

    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_DATES', message: 'fromDate and toDate are required' },
      });
      return;
    }

    const acctResult = await query<{
      account_number: string; balance_paise: string;
      member_name: string; membership_number: string; product_name: string;
    }>(
      `SELECT a.account_number, a.balance_paise,
              m.full_name AS member_name, m.membership_number,
              p.name AS product_name
       FROM accounts a
       JOIN members m ON a.member_id = m.id
       JOIN account_products p ON a.product_id = p.id
       WHERE a.id = $1`,
      [accountId],
    );

    if (acctResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }

    const openingResult = await query<{ balance: string }>(
      `SELECT COALESCE(
        (SELECT balance_after_paise FROM transactions
         WHERE account_id = $1 AND status = 'posted' AND posted_at < $2::date
         ORDER BY posted_at DESC, created_at DESC LIMIT 1),
        0
       ) AS balance`,
      [accountId, fromDate],
    );
    const openingBalance = Number(openingResult.rows[0]!.balance);

    const txnResult = await query<{
      transaction_number: string; transaction_type: string;
      amount_paise: string; balance_after_paise: string;
      description: string | null; posted_at: string;
    }>(
      `SELECT transaction_number, transaction_type, amount_paise,
              balance_after_paise, description, posted_at
       FROM transactions
       WHERE account_id = $1 AND status = 'posted'
         AND posted_at >= $2::date AND posted_at < ($3::date + interval '1 day')
       ORDER BY posted_at ASC, created_at ASC`,
      [accountId, fromDate, toDate],
    );

    const isCredit = (type: string) =>
      ['cash_deposit', 'loan_disbursement', 'interest_posting'].includes(type);

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    const transactions = txnResult.rows.map((r) => {
      const amt = Number(r.amount_paise);
      if (isCredit(r.transaction_type)) {
        totalDeposits += amt;
      } else {
        totalWithdrawals += amt;
      }
      return {
        transactionNumber: r.transaction_number,
        date: r.posted_at,
        description: r.description ?? r.transaction_type.replace(/_/g, ' '),
        type: r.transaction_type,
        depositPaise: isCredit(r.transaction_type) ? amt : 0,
        withdrawalPaise: isCredit(r.transaction_type) ? 0 : amt,
        balancePaise: Number(r.balance_after_paise),
      };
    });

    const acct = acctResult.rows[0]!;
    res.json({
      success: true,
      data: {
        account: {
          accountNumber: acct.account_number,
          memberName: acct.member_name,
          membershipNumber: acct.membership_number,
          productName: acct.product_name,
        },
        period: { from: fromDate, to: toDate },
        openingBalancePaise: openingBalance,
        closingBalancePaise: transactions.length > 0
          ? transactions[transactions.length - 1]!.balancePaise
          : openingBalance,
        totalDepositsPaise: totalDeposits,
        totalWithdrawalsPaise: totalWithdrawals,
        transactionCount: transactions.length,
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
}
