import type { Request, Response, NextFunction } from 'express';
import { query, getClient } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';

// === Categories ===

export async function listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query(
      `SELECT ec.id, ec.code, ec.name, ec.is_active, ca.code AS gl_code, ca.name AS gl_name
       FROM expense_categories ec
       LEFT JOIN chart_of_accounts ca ON ec.gl_account_id = ca.id
       ORDER BY ec.code`,
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// === Expenses CRUD ===

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { categoryId, description, amountPaise, expenseDate, paymentMethod, payee, invoiceReference } = req.body as {
      categoryId: string;
      description: string;
      amountPaise: number;
      expenseDate: string;
      paymentMethod?: string;
      payee?: string;
      invoiceReference?: string;
    };

    // Validate category
    const catCheck = await query<{ is_active: boolean }>(
      `SELECT is_active FROM expense_categories WHERE id = $1`, [categoryId],
    );
    if (catCheck.rows.length === 0 || !catCheck.rows[0]!.is_active) {
      res.status(400).json({ success: false, error: { code: 'INVALID_CATEGORY', message: 'Expense category not found or inactive' } });
      return;
    }

    // Generate expense number
    const today = new Date();
    const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM expenses WHERE expense_number LIKE $1`,
      [`EXP-${ymd}-%`],
    );
    const seq = parseInt(countResult.rows[0]!.count, 10) + 1;
    const expenseNumber = `EXP-${ymd}-${String(seq).padStart(4, '0')}`;

    const result = await query<{ id: string }>(
      `INSERT INTO expenses (expense_number, category_id, description, amount_paise, expense_date, payment_method, payee, invoice_reference, branch_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [expenseNumber, categoryId, description, amountPaise, expenseDate, paymentMethod ?? 'cash', payee ?? null, invoiceReference ?? null, req.user!.branchId, req.user!.id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'EXPENSE_CREATE',
      entityType: 'expenses',
      entityId: result.rows[0]!.id,
      details: { expenseNumber, amountPaise, categoryId },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.status(201).json({ success: true, data: { id: result.rows[0]!.id, expenseNumber } });
  } catch (err) {
    next(err);
  }
}

export async function listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, status } = req.query as unknown as { page: number; pageSize: number; status?: string };
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const offset = (p - 1) * ps;

    const params: unknown[] = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE e.status = $${params.length}`;
    }

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM expenses e ${where}`, params);
    const total = parseInt(countResult.rows[0]!.count, 10);

    params.push(ps, offset);
    const result = await query(
      `SELECT e.id, e.expense_number, e.description, e.amount_paise, e.expense_date, e.payment_method, e.payee, e.status, e.created_at,
              ec.name AS category_name, su.full_name AS created_by_name
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.id
       JOIN staff_users su ON e.created_by = su.id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({ success: true, data: result.rows, meta: { page: p, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
  } catch (err) {
    next(err);
  }
}

export async function getExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query(
      `SELECT e.*, ec.name AS category_name, ec.code AS category_code,
              ca.code AS gl_code, ca.name AS gl_name,
              su_created.full_name AS created_by_name,
              su_approved.full_name AS approved_by_name
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.id
       LEFT JOIN chart_of_accounts ca ON ec.gl_account_id = ca.id
       JOIN staff_users su_created ON e.created_by = su_created.id
       LEFT JOIN staff_users su_approved ON e.approved_by = su_approved.id
       WHERE e.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function approveExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    const expResult = await query<{ status: string; created_by: string }>(
      `SELECT status, created_by FROM expenses WHERE id = $1`, [id],
    );
    if (expResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }
    if (expResult.rows[0]!.status !== 'pending') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Only pending expenses can be approved' } });
      return;
    }
    if (expResult.rows[0]!.created_by === req.user!.id) {
      res.status(403).json({ success: false, error: { code: 'SELF_APPROVAL', message: 'Cannot approve your own expense' } });
      return;
    }

    await query(
      `UPDATE expenses SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [req.user!.id, id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'EXPENSE_APPROVE',
      entityType: 'expenses',
      entityId: id,
      details: {},
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Expense approved' } });
  } catch (err) {
    next(err);
  }
}

export async function rejectExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { reason } = req.body as { reason: string };

    const expResult = await query<{ status: string }>(
      `SELECT status FROM expenses WHERE id = $1`, [id],
    );
    if (expResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }
    if (expResult.rows[0]!.status !== 'pending') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Only pending expenses can be rejected' } });
      return;
    }

    await query(
      `UPDATE expenses SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason, id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'EXPENSE_REJECT',
      entityType: 'expenses',
      entityId: id,
      details: { reason },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Expense rejected' } });
  } catch (err) {
    next(err);
  }
}

export async function payExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const id = String(req.params['id']);

    const expResult = await client.query<{
      id: string; status: string; amount_paise: string; expense_number: string; category_id: string; branch_id: string; description: string;
    }>(
      `SELECT id, status, amount_paise, expense_number, category_id, branch_id, description FROM expenses WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (expResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }
    const expense = expResult.rows[0]!;
    if (expense.status !== 'approved') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Expense must be approved before payment' } });
      return;
    }

    // Get GL account for this category
    const glResult = await client.query<{ gl_account_id: string }>(
      `SELECT gl_account_id FROM expense_categories WHERE id = $1`, [expense.category_id],
    );
    const glAccountId = glResult.rows[0]?.gl_account_id;

    // Get current accounting period
    const periodResult = await client.query<{ id: string }>(
      `SELECT id FROM accounting_periods WHERE status = 'open' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE LIMIT 1`,
    );

    // Create journal entry: Debit Expense GL, Credit Cash GL
    const jeNumber = `JE-${Date.now()}`;
    const jeResult = await client.query<{ id: string }>(
      `INSERT INTO journal_entries (entry_number, period_id, entry_date, description, source_type, source_id, created_by, status, posted_at)
       VALUES ($1, $2, CURRENT_DATE, $3, 'expense', $4, $5, 'posted', NOW()) RETURNING id`,
      [jeNumber, periodResult.rows[0]?.id ?? null, `Expense payment: ${expense.expense_number} - ${expense.description}`, expense.id, req.user!.id],
    );
    const jeId = jeResult.rows[0]!.id;

    // Debit: expense account
    if (glAccountId) {
      await client.query(
        `INSERT INTO journal_entry_lines (entry_id, account_id, debit_paise, credit_paise, description) VALUES ($1, $2, $3, 0, $4)`,
        [jeId, glAccountId, expense.amount_paise, expense.description],
      );
    }

    // Credit: cash account (code 1100)
    const cashResult = await client.query<{ id: string }>(
      `SELECT id FROM chart_of_accounts WHERE code = '1100'`,
    );
    if (cashResult.rows.length > 0) {
      await client.query(
        `INSERT INTO journal_entry_lines (entry_id, account_id, debit_paise, credit_paise, description) VALUES ($1, $2, 0, $3, $4)`,
        [jeId, cashResult.rows[0]!.id, expense.amount_paise, `Cash paid: ${expense.expense_number}`],
      );
    }

    // Mark expense as paid
    await client.query(
      `UPDATE expenses SET status = 'paid', journal_entry_id = $1, updated_at = NOW() WHERE id = $2`,
      [jeId, id],
    );

    await client.query('COMMIT');

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'EXPENSE_PAY',
      entityType: 'expenses',
      entityId: id,
      details: { amountPaise: Number(expense.amount_paise), journalEntryId: jeId },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Expense paid', journalEntryId: jeId } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
