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
