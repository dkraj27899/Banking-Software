import type { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';
import { notifyApprovers } from '../notifications/notifications.service.js';

const GL_ACCOUNT_MAP: Record<string, string> = {
  savings: '2100',
  fixed_deposit: '2200',
  recurring_deposit: '2300',
  share_capital: '3000',
  loan: '2500',
};

async function resolveGlAccountId(client: import('pg').PoolClient, code: string): Promise<string> {
  const r = await client.query<{ id: string }>(
    `SELECT id FROM chart_of_accounts WHERE code = $1`, [code],
  );
  if (r.rows.length === 0) throw new Error(`GL account ${code} not found`);
  return r.rows[0]!.id;
}

async function getOrCreatePeriod(client: import('pg').PoolClient, date: Date): Promise<string> {
  const fy_start_month = 4;
  let fyStart: Date;
  let fyEnd: Date;
  if (date.getMonth() + 1 >= fy_start_month) {
    fyStart = new Date(date.getFullYear(), fy_start_month - 1, 1);
    fyEnd = new Date(date.getFullYear() + 1, fy_start_month - 1, 0);
  } else {
    fyStart = new Date(date.getFullYear() - 1, fy_start_month - 1, 1);
    fyEnd = new Date(date.getFullYear(), fy_start_month - 1, 0);
  }

  const startStr = fyStart.toISOString().slice(0, 10);
  const endStr = fyEnd.toISOString().slice(0, 10);

  const existing = await client.query<{ id: string }>(
    `SELECT id FROM accounting_periods WHERE start_date = $1 AND end_date = $2`,
    [startStr, endStr],
  );
  if (existing.rows.length > 0) return existing.rows[0]!.id;

  const name = `FY ${fyStart.getFullYear()}-${String(fyEnd.getFullYear()).slice(2)}`;
  const created = await client.query<{ id: string }>(
    `INSERT INTO accounting_periods (name, start_date, end_date)
     VALUES ($1, $2, $3) RETURNING id`,
    [name, startStr, endStr],
  );
  return created.rows[0]!.id;
}

async function generateTxnNumber(client: import('pg').PoolClient): Promise<string> {
  const now = new Date();
  const prefix = `TXN${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const r = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM transactions WHERE transaction_number LIKE $1`,
    [`${prefix}%`],
  );
  const seq = parseInt(r.rows[0]!.count, 10) + 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

async function generateJournalNumber(client: import('pg').PoolClient): Promise<string> {
  const now = new Date();
  const prefix = `JE${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const r = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM journal_entries WHERE entry_number LIKE $1`,
    [`${prefix}%`],
  );
  const seq = parseInt(r.rows[0]!.count, 10) + 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

export async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      accountId: string; transactionType: string; amountPaise: number;
      paymentMethod: string; referenceNumber?: string; description?: string;
      idempotencyKey: string;
    };

    const existing = await query<{ id: string; status: string }>(
      `SELECT id, status FROM transactions WHERE idempotency_key = $1`,
      [body.idempotencyKey],
    );
    if (existing.rows.length > 0) {
      res.status(200).json({
        success: true,
        data: { id: existing.rows[0]!.id, status: existing.rows[0]!.status, message: 'Transaction already exists (idempotent)' },
      });
      return;
    }

    const acctCheck = await query<{ status: string; account_type: string }>(
      `SELECT a.status, p.account_type FROM accounts a JOIN account_products p ON a.product_id = p.id WHERE a.id = $1`,
      [body.accountId],
    );
    if (acctCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }
    if (acctCheck.rows[0]!.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'ACCOUNT_NOT_ACTIVE', message: 'Account is not active' } });
      return;
    }

    const initialStatus = 'pending';

    const txnNumber = await withTransaction(async (client) => {
      const num = await generateTxnNumber(client);

      await client.query(
        `INSERT INTO transactions (
          transaction_number, account_id, transaction_type, amount_paise,
          payment_method, reference_number, description, idempotency_key,
          status, entered_by, branch_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          num, body.accountId, body.transactionType, body.amountPaise,
          body.paymentMethod, body.referenceNumber ?? null, body.description ?? null,
          body.idempotencyKey, initialStatus, req.user!.id, req.user!.branchId,
        ],
      );

      return num;
    });

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'TRANSACTION_CREATE',
      entityType: 'transactions',
      entityId: txnNumber,
      details: {
        accountId: body.accountId,
        type: body.transactionType,
        amountPaise: body.amountPaise,
      },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    const amountRupees = (body.amountPaise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    notifyApprovers(
      req.user!.id,
      'New Transaction — Approval Required',
      `${req.user!.fullName} created ${body.transactionType.replace(/_/g, ' ')} of ${amountRupees} (${txnNumber}). Needs your approval.`,
      '/transactions',
    );

    res.status(201).json({
      success: true,
      data: {
        transactionNumber: txnNumber,
        status: 'pending',
        message: 'Transaction created — pending authorization',
      },
    });
  } catch (err) {
    next(err);
  }
}

async function postTransaction(
  client: import('pg').PoolClient,
  txnNumber: string,
  userId: string,
): Promise<void> {
  const txnResult = await client.query<{
    id: string; account_id: string; transaction_type: string;
    amount_paise: string; status: string;
  }>(
    `SELECT id, account_id, transaction_type, amount_paise, status
     FROM transactions WHERE transaction_number = $1 FOR UPDATE`,
    [txnNumber],
  );
  const txn = txnResult.rows[0]!;
  const amountPaise = Number(txn.amount_paise);

  const acctResult = await client.query<{
    balance_paise: string; product_type: string;
  }>(
    `SELECT a.balance_paise, p.account_type AS product_type
     FROM accounts a
     JOIN account_products p ON a.product_id = p.id
     WHERE a.id = $1 FOR UPDATE`,
    [txn.account_id],
  );
  const acct = acctResult.rows[0]!;
  const currentBalance = Number(acct.balance_paise);

  let newBalance: number;
  const isCredit = ['cash_deposit', 'loan_disbursement', 'interest_posting'].includes(txn.transaction_type);
  const isDebit = ['cash_withdrawal', 'loan_repayment', 'fee_charge'].includes(txn.transaction_type);

  if (isCredit) {
    newBalance = currentBalance + amountPaise;
  } else if (isDebit) {
    if (currentBalance < amountPaise) {
      throw Object.assign(new Error('Insufficient balance'), { statusCode: 400, code: 'INSUFFICIENT_BALANCE' });
    }
    newBalance = currentBalance - amountPaise;
  } else {
    throw new Error(`Unsupported transaction type: ${txn.transaction_type}`);
  }

  await client.query(
    `UPDATE accounts SET balance_paise = $1, updated_at = NOW() WHERE id = $2`,
    [newBalance, txn.account_id],
  );

  const now = new Date();
  const periodId = await getOrCreatePeriod(client, now);
  const jeNumber = await generateJournalNumber(client);
  const dateStr = now.toISOString().slice(0, 10);

  const jeResult = await client.query<{ id: string }>(
    `INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, period_id, posted_by)
     VALUES ($1, $2, $3, 'transaction', $4, $5, $6) RETURNING id`,
    [jeNumber, dateStr, `${txn.transaction_type}: ${txnNumber}`, txn.id, periodId, userId],
  );
  const jeId = jeResult.rows[0]!.id;

  const cashGlId = await resolveGlAccountId(client, '1000');
  const productGlCode = GL_ACCOUNT_MAP[acct.product_type] ?? '2100';
  const productGlId = await resolveGlAccountId(client, productGlCode);

  if (isCredit) {
    await client.query(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_paise, credit_paise, description)
       VALUES ($1, $2, $3, 0, $4), ($1, $5, 0, $3, $4)`,
      [jeId, cashGlId, amountPaise, txnNumber, productGlId],
    );
  } else {
    await client.query(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_paise, credit_paise, description)
       VALUES ($1, $2, $3, 0, $4), ($1, $5, 0, $3, $4)`,
      [jeId, productGlId, amountPaise, txnNumber, cashGlId],
    );
  }

  await client.query(
    `UPDATE transactions SET
      status = 'posted', balance_after_paise = $1,
      journal_entry_id = $2, posted_at = NOW(), updated_at = NOW()
     WHERE transaction_number = $3`,
    [newBalance, jeId, txnNumber],
  );
}

export async function authorizeTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { action, reason } = req.body as { action: 'authorize' | 'reject'; reason?: string };

    const result = await withTransaction(async (client) => {
      const txnResult = await client.query<{
        id: string; transaction_number: string; status: string;
        entered_by: string; amount_paise: string;
      }>(
        `SELECT id, transaction_number, status, entered_by, amount_paise
         FROM transactions WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (txnResult.rows.length === 0) {
        throw Object.assign(new Error('Transaction not found'), { statusCode: 404, code: 'NOT_FOUND' });
      }
      const txn = txnResult.rows[0]!;
      if (txn.status !== 'pending') {
        throw Object.assign(new Error('Only pending transactions can be authorized'), { statusCode: 400, code: 'NOT_PENDING' });
      }
      if (txn.entered_by === req.user!.id) {
        throw Object.assign(new Error('Cannot authorize own transaction (maker-checker)'), { statusCode: 403, code: 'SELF_AUTHORIZATION' });
      }

      if (action === 'reject') {
        await client.query(
          `UPDATE transactions SET status = 'failed', description = COALESCE(description, '') || ' [REJECTED: ' || $1 || ']',
           authorized_by = $2, authorized_at = NOW(), updated_at = NOW() WHERE id = $3`,
          [reason ?? 'No reason given', req.user!.id, id],
        );
        return { status: 'failed', transactionNumber: txn.transaction_number };
      }

      await client.query(
        `UPDATE transactions SET authorized_by = $1, authorized_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [req.user!.id, id],
      );

      await postTransaction(client, txn.transaction_number, req.user!.id);
      return { status: 'posted', transactionNumber: txn.transaction_number };
    });

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: action === 'authorize' ? 'TRANSACTION_AUTHORIZE' : 'TRANSACTION_REJECT',
      entityType: 'transactions',
      entityId: id,
      details: { action, reason },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function reverseTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { reason } = req.body as { reason: string };

    const reversalNumber = await withTransaction(async (client) => {
      const txnResult = await client.query<{
        id: string; transaction_number: string; account_id: string;
        transaction_type: string; amount_paise: string; status: string;
        balance_after_paise: string; journal_entry_id: string;
      }>(
        `SELECT id, transaction_number, account_id, transaction_type, amount_paise,
                status, balance_after_paise, journal_entry_id
         FROM transactions WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (txnResult.rows.length === 0) {
        throw Object.assign(new Error('Transaction not found'), { statusCode: 404, code: 'NOT_FOUND' });
      }
      const orig = txnResult.rows[0]!;
      if (orig.status !== 'posted') {
        throw Object.assign(new Error('Only posted transactions can be reversed'), { statusCode: 400, code: 'NOT_POSTED' });
      }

      const amountPaise = Number(orig.amount_paise);
      const isCredit = ['cash_deposit', 'loan_disbursement', 'interest_posting'].includes(orig.transaction_type);

      const acctResult = await client.query<{ balance_paise: string; product_type: string }>(
        `SELECT a.balance_paise, p.account_type AS product_type
         FROM accounts a JOIN account_products p ON a.product_id = p.id
         WHERE a.id = $1 FOR UPDATE`,
        [orig.account_id],
      );
      const currentBalance = Number(acctResult.rows[0]!.balance_paise);
      const productType = acctResult.rows[0]!.product_type;

      let newBalance: number;
      if (isCredit) {
        if (currentBalance < amountPaise) {
          throw Object.assign(new Error('Insufficient balance for reversal'), { statusCode: 400, code: 'INSUFFICIENT_BALANCE' });
        }
        newBalance = currentBalance - amountPaise;
      } else {
        newBalance = currentBalance + amountPaise;
      }

      await client.query(
        `UPDATE accounts SET balance_paise = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, orig.account_id],
      );

      const revNum = await generateTxnNumber(client);

      const now = new Date();
      const periodId = await getOrCreatePeriod(client, now);
      const jeNumber = await generateJournalNumber(client);
      const dateStr = now.toISOString().slice(0, 10);

      const jeResult = await client.query<{ id: string }>(
        `INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, period_id, is_reversal, reversal_of, posted_by)
         VALUES ($1, $2, $3, 'transaction', $4, $5, true, $6, $7) RETURNING id`,
        [jeNumber, dateStr, `Reversal of ${orig.transaction_number}: ${reason}`, orig.id, periodId, orig.journal_entry_id, req.user!.id],
      );
      const jeId = jeResult.rows[0]!.id;

      const cashGlId = await resolveGlAccountId(client, '1000');
      const productGlCode = GL_ACCOUNT_MAP[productType] ?? '2100';
      const productGlId = await resolveGlAccountId(client, productGlCode);

      if (isCredit) {
        await client.query(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_paise, credit_paise, description)
           VALUES ($1, $2, $3, 0, $4), ($1, $5, 0, $3, $4)`,
          [jeId, productGlId, amountPaise, `REV: ${orig.transaction_number}`, cashGlId],
        );
      } else {
        await client.query(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_paise, credit_paise, description)
           VALUES ($1, $2, $3, 0, $4), ($1, $5, 0, $3, $4)`,
          [jeId, cashGlId, amountPaise, `REV: ${orig.transaction_number}`, productGlId],
        );
      }

      await client.query(
        `INSERT INTO transactions (
          transaction_number, account_id, transaction_type, amount_paise,
          balance_after_paise, status, journal_entry_id, reversal_of,
          description, entered_by, branch_id, posted_at
        ) VALUES ($1,$2,'reversal',$3,$4,'posted',$5,$6,$7,$8,$9,NOW())`,
        [revNum, orig.account_id, amountPaise, newBalance, jeId, orig.id,
         `Reversal of ${orig.transaction_number}: ${reason}`, req.user!.id, req.user!.branchId],
      );

      await client.query(
        `UPDATE transactions SET status = 'reversed', reversed_by = (SELECT id FROM transactions WHERE transaction_number = $1), updated_at = NOW()
         WHERE id = $2`,
        [revNum, orig.id],
      );

      return revNum;
    });

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'TRANSACTION_REVERSE',
      entityType: 'transactions',
      entityId: id,
      details: { reason, reversalNumber },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { reversalTransactionNumber: reversalNumber, message: 'Transaction reversed' } });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, accountId, status, type } = req.query as unknown as {
      page: number; pageSize: number; accountId?: string; status?: string; type?: string;
    };

    const pg = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const offset = (pg - 1) * ps;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (accountId) {
      params.push(accountId);
      conditions.push(`t.account_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`t.transaction_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM transactions t ${whereClause}`, params,
    );
    const total = parseInt(countResult.rows[0]!.count, 10);

    const dataParams = [...params, ps, offset];
    const dataResult = await query<Record<string, unknown>>(
      `SELECT t.*, a.account_number, m.full_name AS member_name,
              eb.full_name AS entered_by_name, ab.full_name AS authorized_by_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       JOIN members m ON a.member_id = m.id
       JOIN staff_users eb ON t.entered_by = eb.id
       LEFT JOIN staff_users ab ON t.authorized_by = ab.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );

    res.json({
      success: true,
      data: dataResult.rows.map((r) => ({
        id: r.id,
        transactionNumber: r.transaction_number,
        accountId: r.account_id,
        accountNumber: r.account_number,
        memberName: r.member_name,
        transactionType: r.transaction_type,
        amountPaise: Number(r.amount_paise),
        balanceAfterPaise: r.balance_after_paise ? Number(r.balance_after_paise) : null,
        paymentMethod: r.payment_method,
        referenceNumber: r.reference_number,
        description: r.description,
        status: r.status,
        enteredBy: r.entered_by,
        enteredByName: r.entered_by_name,
        authorizedBy: r.authorized_by,
        authorizedByName: r.authorized_by_name,
        postedAt: r.posted_at,
        createdAt: r.created_at,
      })),
      meta: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query<Record<string, unknown>>(
      `SELECT t.*, a.account_number, m.full_name AS member_name, m.membership_number,
              p.name AS product_name,
              eb.full_name AS entered_by_name, ab.full_name AS authorized_by_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       JOIN members m ON a.member_id = m.id
       JOIN account_products p ON a.product_id = p.id
       JOIN staff_users eb ON t.entered_by = eb.id
       LEFT JOIN staff_users ab ON t.authorized_by = ab.id
       WHERE t.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
      return;
    }

    const r = result.rows[0]!;
    res.json({
      success: true,
      data: {
        id: r.id,
        transactionNumber: r.transaction_number,
        accountId: r.account_id,
        accountNumber: r.account_number,
        memberName: r.member_name,
        membershipNumber: r.membership_number,
        productName: r.product_name,
        transactionType: r.transaction_type,
        amountPaise: Number(r.amount_paise),
        balanceAfterPaise: r.balance_after_paise ? Number(r.balance_after_paise) : null,
        paymentMethod: r.payment_method,
        referenceNumber: r.reference_number,
        description: r.description,
        idempotencyKey: r.idempotency_key,
        status: r.status,
        journalEntryId: r.journal_entry_id,
        reversalOf: r.reversal_of,
        reversedBy: r.reversed_by,
        enteredBy: r.entered_by,
        enteredByName: r.entered_by_name,
        authorizedBy: r.authorized_by,
        authorizedByName: r.authorized_by_name,
        authorizedAt: r.authorized_at,
        postedAt: r.posted_at,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingAuthorizations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query<Record<string, unknown>>(
      `SELECT t.*, a.account_number, m.full_name AS member_name,
              eb.full_name AS entered_by_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       JOIN members m ON a.member_id = m.id
       JOIN staff_users eb ON t.entered_by = eb.id
       WHERE t.status = 'pending'
       ORDER BY t.created_at ASC`,
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        transactionNumber: r.transaction_number,
        accountNumber: r.account_number,
        memberName: r.member_name,
        transactionType: r.transaction_type,
        amountPaise: Number(r.amount_paise),
        enteredByName: r.entered_by_name,
        enteredBy: r.entered_by,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}
