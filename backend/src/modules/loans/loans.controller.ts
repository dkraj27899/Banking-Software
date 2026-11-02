import type { Request, Response, NextFunction } from 'express';
import { query, getClient } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';

interface ScheduleEntry {
  installment_number: number;
  due_date: string;
  principal_paise: number;
  interest_paise: number;
  total_paise: number;
}

function generateRepaymentSchedule(
  principalPaise: number,
  interestRateBps: number,
  tenureMonths: number,
  interestType: string,
  startDate: Date,
): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const annualRate = interestRateBps / 10000;
  const monthlyRate = annualRate / 12;

  if (interestType === 'flat') {
    const totalInterest = Math.round(principalPaise * annualRate * tenureMonths / 12);
    const monthlyPrincipal = Math.floor(principalPaise / tenureMonths);
    const monthlyInterest = Math.floor(totalInterest / tenureMonths);
    let principalRemaining = principalPaise;
    let interestRemaining = totalInterest;

    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const isLast = i === tenureMonths;
      const pPaise = isLast ? principalRemaining : monthlyPrincipal;
      const iPaise = isLast ? interestRemaining : monthlyInterest;

      principalRemaining -= pPaise;
      interestRemaining -= iPaise;

      schedule.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0]!,
        principal_paise: pPaise,
        interest_paise: iPaise,
        total_paise: pPaise + iPaise,
      });
    }
  } else {
    // Reducing balance EMI
    // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const rPow = Math.pow(1 + monthlyRate, tenureMonths);
    const emiExact = principalPaise * monthlyRate * rPow / (rPow - 1);
    const emi = Math.round(emiExact);

    let outstanding = principalPaise;

    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const interestForMonth = Math.round(outstanding * monthlyRate);
      const isLast = i === tenureMonths;
      const principalForMonth = isLast ? outstanding : emi - interestForMonth;
      const totalForMonth = isLast ? outstanding + interestForMonth : emi;

      outstanding -= principalForMonth;

      schedule.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0]!,
        principal_paise: principalForMonth,
        interest_paise: interestForMonth,
        total_paise: totalForMonth,
      });
    }
  }

  return schedule;
}

function calculateEmi(principalPaise: number, interestRateBps: number, tenureMonths: number, interestType: string): number {
  const annualRate = interestRateBps / 10000;
  const monthlyRate = annualRate / 12;

  if (interestType === 'flat') {
    const totalInterest = Math.round(principalPaise * annualRate * tenureMonths / 12);
    return Math.round((principalPaise + totalInterest) / tenureMonths);
  }
  const rPow = Math.pow(1 + monthlyRate, tenureMonths);
  return Math.round(principalPaise * monthlyRate * rPow / (rPow - 1));
}

function calculateTotalInterest(principalPaise: number, interestRateBps: number, tenureMonths: number, interestType: string): number {
  const annualRate = interestRateBps / 10000;
  if (interestType === 'flat') {
    return Math.round(principalPaise * annualRate * tenureMonths / 12);
  }
  const emi = calculateEmi(principalPaise, interestRateBps, tenureMonths, interestType);
  return emi * tenureMonths - principalPaise;
}

async function nextSeq(prefix: string, table: string, column: string): Promise<string> {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const pattern = `${prefix}-${ymd}-%`;
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${table} WHERE ${column} LIKE $1`,
    [pattern],
  );
  const seq = parseInt(result.rows[0]!.count, 10) + 1;
  return `${prefix}-${ymd}-${String(seq).padStart(4, '0')}`;
}

// === Loan Products ===

export async function listLoanProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query(
      `SELECT id, code, name, description, min_amount_paise, max_amount_paise,
              interest_rate_bps, interest_type, max_tenure_months, processing_fee_bps, is_active
       FROM loan_products ORDER BY code`,
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// === Loan Applications ===

export async function createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { memberId, accountId, productId, requestedAmountPaise, tenureMonths, purpose, guarantorName, guarantorMemberId, collateralDescription } = req.body as {
      memberId: string;
      accountId: string;
      productId: string;
      requestedAmountPaise: number;
      tenureMonths: number;
      purpose?: string;
      guarantorName?: string;
      guarantorMemberId?: string;
      collateralDescription?: string;
    };

    // Validate member is active
    const memberCheck = await query<{ status: string }>(
      `SELECT status FROM members WHERE id = $1`, [memberId],
    );
    if (memberCheck.rows.length === 0 || memberCheck.rows[0]!.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'INVALID_MEMBER', message: 'Member must be active' } });
      return;
    }

    // Validate account is active and belongs to member
    const accountCheck = await query<{ status: string; member_id: string }>(
      `SELECT status, member_id FROM accounts WHERE id = $1`, [accountId],
    );
    if (accountCheck.rows.length === 0 || accountCheck.rows[0]!.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'INVALID_ACCOUNT', message: 'Account must be active' } });
      return;
    }
    if (accountCheck.rows[0]!.member_id !== memberId) {
      res.status(400).json({ success: false, error: { code: 'ACCOUNT_MISMATCH', message: 'Account does not belong to this member' } });
      return;
    }

    // Validate product and amount bounds
    const productCheck = await query<{ min_amount_paise: string; max_amount_paise: string; max_tenure_months: number; is_active: boolean }>(
      `SELECT min_amount_paise, max_amount_paise, max_tenure_months, is_active FROM loan_products WHERE id = $1`, [productId],
    );
    if (productCheck.rows.length === 0 || !productCheck.rows[0]!.is_active) {
      res.status(400).json({ success: false, error: { code: 'INVALID_PRODUCT', message: 'Loan product not found or inactive' } });
      return;
    }
    const product = productCheck.rows[0]!;
    if (requestedAmountPaise < Number(product.min_amount_paise) || requestedAmountPaise > Number(product.max_amount_paise)) {
      res.status(400).json({ success: false, error: { code: 'AMOUNT_OUT_OF_RANGE', message: `Amount must be between ₹${Number(product.min_amount_paise) / 100} and ₹${Number(product.max_amount_paise) / 100}` } });
      return;
    }
    if (tenureMonths > product.max_tenure_months) {
      res.status(400).json({ success: false, error: { code: 'TENURE_EXCEEDED', message: `Maximum tenure is ${product.max_tenure_months} months` } });
      return;
    }

    const applicationNumber = await nextSeq('LA', 'loan_applications', 'application_number');

    const result = await query<{ id: string }>(
      `INSERT INTO loan_applications (application_number, member_id, account_id, product_id, requested_amount_paise, tenure_months, purpose, guarantor_name, guarantor_member_id, collateral_description, applied_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [applicationNumber, memberId, accountId, productId, requestedAmountPaise, tenureMonths, purpose ?? null, guarantorName ?? null, guarantorMemberId ?? null, collateralDescription ?? null, req.user!.id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'LOAN_APPLICATION_CREATE',
      entityType: 'loan_applications',
      entityId: result.rows[0]!.id,
      details: { applicationNumber, memberId, productId, requestedAmountPaise, tenureMonths },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.status(201).json({ success: true, data: { id: result.rows[0]!.id, applicationNumber } });
  } catch (err) {
    next(err);
  }
}

export async function listApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, status } = req.query as unknown as { page: number; pageSize: number; status?: string };
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const offset = (p - 1) * ps;

    const params: unknown[] = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE la.status = $${params.length}`;
    }

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM loan_applications la ${where}`, params);
    const total = parseInt(countResult.rows[0]!.count, 10);

    params.push(ps, offset);
    const result = await query(
      `SELECT la.id, la.application_number, la.requested_amount_paise, la.approved_amount_paise, la.tenure_months, la.status, la.created_at,
              m.full_name AS member_name, m.membership_number, lp.name AS product_name
       FROM loan_applications la
       JOIN members m ON la.member_id = m.id
       JOIN loan_products lp ON la.product_id = lp.id
       ${where}
       ORDER BY la.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({ success: true, data: result.rows, meta: { page: p, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
  } catch (err) {
    next(err);
  }
}

export async function getApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query(
      `SELECT la.*, m.full_name AS member_name, m.membership_number, a.account_number,
              lp.name AS product_name, lp.code AS product_code, lp.interest_rate_bps, lp.interest_type,
              su_applied.full_name AS applied_by_name,
              su_approved.full_name AS approved_by_name,
              su_rejected.full_name AS rejected_by_name
       FROM loan_applications la
       JOIN members m ON la.member_id = m.id
       JOIN accounts a ON la.account_id = a.id
       JOIN loan_products lp ON la.product_id = lp.id
       JOIN staff_users su_applied ON la.applied_by = su_applied.id
       LEFT JOIN staff_users su_approved ON la.approved_by = su_approved.id
       LEFT JOIN staff_users su_rejected ON la.rejected_by = su_rejected.id
       WHERE la.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loan application not found' } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function approveApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { approvedAmountPaise } = req.body as { approvedAmountPaise: number };

    const appResult = await query<{ status: string; applied_by: string; requested_amount_paise: string }>(
      `SELECT status, applied_by, requested_amount_paise FROM loan_applications WHERE id = $1`, [id],
    );
    if (appResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loan application not found' } });
      return;
    }
    const app = appResult.rows[0]!;
    if (app.status !== 'pending') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Cannot approve application in '${app.status}' status` } });
      return;
    }
    if (app.applied_by === req.user!.id) {
      res.status(403).json({ success: false, error: { code: 'SELF_APPROVAL', message: 'Cannot approve your own loan application' } });
      return;
    }
    if (approvedAmountPaise > Number(app.requested_amount_paise)) {
      res.status(400).json({ success: false, error: { code: 'AMOUNT_EXCEEDED', message: 'Approved amount cannot exceed requested amount' } });
      return;
    }

    await query(
      `UPDATE loan_applications SET status = 'approved', approved_amount_paise = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3`,
      [approvedAmountPaise, req.user!.id, id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'LOAN_APPLICATION_APPROVE',
      entityType: 'loan_applications',
      entityId: id,
      details: { approvedAmountPaise },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Loan application approved' } });
  } catch (err) {
    next(err);
  }
}

export async function rejectApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { reason } = req.body as { reason: string };

    const appResult = await query<{ status: string }>(
      `SELECT status FROM loan_applications WHERE id = $1`, [id],
    );
    if (appResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loan application not found' } });
      return;
    }
    if (appResult.rows[0]!.status !== 'pending') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Can only reject pending applications' } });
      return;
    }

    await query(
      `UPDATE loan_applications SET status = 'rejected', rejected_by = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
      [req.user!.id, reason, id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'LOAN_APPLICATION_REJECT',
      entityType: 'loan_applications',
      entityId: id,
      details: { reason },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Loan application rejected' } });
  } catch (err) {
    next(err);
  }
}

export async function disburseLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const id = String(req.params['id']);

    const appResult = await client.query<{
      id: string; status: string; member_id: string; account_id: string; product_id: string;
      approved_amount_paise: string; tenure_months: number; application_number: string;
    }>(
      `SELECT la.id, la.status, la.member_id, la.account_id, la.product_id, la.approved_amount_paise, la.tenure_months, la.application_number
       FROM loan_applications la WHERE la.id = $1 FOR UPDATE`, [id],
    );
    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loan application not found' } });
      return;
    }
    const app = appResult.rows[0]!;
    if (app.status !== 'approved') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Loan must be approved before disbursement' } });
      return;
    }

    const productResult = await client.query<{ interest_rate_bps: number; interest_type: string }>(
      `SELECT interest_rate_bps, interest_type FROM loan_products WHERE id = $1`, [app.product_id],
    );
    const product = productResult.rows[0]!;

    const principalPaise = Number(app.approved_amount_paise);
    const emiPaise = calculateEmi(principalPaise, product.interest_rate_bps, app.tenure_months, product.interest_type);
    const totalInterestPaise = calculateTotalInterest(principalPaise, product.interest_rate_bps, app.tenure_months, product.interest_type);

    const loanNumber = await nextSeq('LN', 'loans', 'loan_number');
    const disbursedAt = new Date();

    const loanResult = await client.query<{ id: string }>(
      `INSERT INTO loans (loan_number, application_id, member_id, account_id, product_id, principal_paise, interest_rate_bps, interest_type, tenure_months, emi_paise, total_interest_paise, outstanding_principal_paise, outstanding_interest_paise, disbursed_by, disbursed_at, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, $13, $14, $15) RETURNING id`,
      [loanNumber, app.id, app.member_id, app.account_id, app.product_id, principalPaise, product.interest_rate_bps, product.interest_type, app.tenure_months, emiPaise, totalInterestPaise, principalPaise, req.user!.id, disbursedAt, (() => { const d = new Date(disbursedAt); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })()],
    );
    const loanId = loanResult.rows[0]!.id;

    // Generate and insert repayment schedule
    const schedule = generateRepaymentSchedule(principalPaise, product.interest_rate_bps, app.tenure_months, product.interest_type, disbursedAt);
    for (const entry of schedule) {
      await client.query(
        `INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_paise, interest_paise, total_paise) VALUES ($1, $2, $3, $4, $5, $6)`,
        [loanId, entry.installment_number, entry.due_date, entry.principal_paise, entry.interest_paise, entry.total_paise],
      );
    }

    // Create disbursement transaction on the member's account
    const txnNumber = `TXN-${Date.now()}`;
    await client.query(
      `INSERT INTO transactions (transaction_number, account_id, transaction_type, amount_paise, balance_after_paise, payment_method, description, status, entered_by, authorized_by, authorized_at, posted_at, branch_id)
       VALUES ($1, $2, 'loan_disbursement', $3, (SELECT balance_paise FROM accounts WHERE id = $2) + $3, 'internal', $4, 'posted', $5, $5, NOW(), NOW(), $6)`,
      [txnNumber, app.account_id, principalPaise, `Loan disbursement: ${loanNumber}`, req.user!.id, req.user!.branchId],
    );

    // Credit the member's account
    await client.query(
      `UPDATE accounts SET balance_paise = balance_paise + $1, updated_at = NOW() WHERE id = $2`,
      [principalPaise, app.account_id],
    );

    // Update application status
    await client.query(
      `UPDATE loan_applications SET status = 'disbursed', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await client.query('COMMIT');

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'LOAN_DISBURSE',
      entityType: 'loans',
      entityId: loanId,
      details: { loanNumber, principalPaise, emiPaise, tenureMonths: app.tenure_months },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.status(201).json({ success: true, data: { id: loanId, loanNumber, emiPaise, totalInterestPaise } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// === Active Loans ===

export async function listLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, status } = req.query as unknown as { page: number; pageSize: number; status?: string };
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const offset = (p - 1) * ps;

    const params: unknown[] = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE l.status = $${params.length}`;
    }

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM loans l ${where}`, params);
    const total = parseInt(countResult.rows[0]!.count, 10);

    params.push(ps, offset);
    const result = await query(
      `SELECT l.id, l.loan_number, l.principal_paise, l.emi_paise, l.outstanding_principal_paise, l.outstanding_interest_paise,
              l.interest_rate_bps, l.interest_type, l.tenure_months, l.status, l.disbursed_at, l.next_due_date,
              m.full_name AS member_name, m.membership_number, lp.name AS product_name
       FROM loans l
       JOIN members m ON l.member_id = m.id
       JOIN loan_products lp ON l.product_id = lp.id
       ${where}
       ORDER BY l.disbursed_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({ success: true, data: result.rows, meta: { page: p, pageSize: ps, total, totalPages: Math.ceil(total / ps) } });
  } catch (err) {
    next(err);
  }
}

export async function getLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    const loanResult = await query(
      `SELECT l.*, m.full_name AS member_name, m.membership_number, a.account_number,
              lp.name AS product_name, lp.code AS product_code
       FROM loans l
       JOIN members m ON l.member_id = m.id
       JOIN accounts a ON l.account_id = a.id
       JOIN loan_products lp ON l.product_id = lp.id
       WHERE l.id = $1`,
      [id],
    );
    if (loanResult.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loan not found' } });
      return;
    }

    const scheduleResult = await query(
      `SELECT * FROM repayment_schedules WHERE loan_id = $1 ORDER BY installment_number`, [id],
    );

    const repaymentsResult = await query(
      `SELECT lr.*, su.full_name AS received_by_name FROM loan_repayments lr JOIN staff_users su ON lr.received_by = su.id WHERE lr.loan_id = $1 ORDER BY lr.created_at DESC`, [id],
    );

    res.json({
      success: true,
      data: {
        ...loanResult.rows[0],
        schedule: scheduleResult.rows,
        repayments: repaymentsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLoanSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query(
      `SELECT * FROM repayment_schedules WHERE loan_id = $1 ORDER BY installment_number`, [id],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function recordRepayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const loanId = String(req.params['id']);
    const { amountPaise } = req.body as { amountPaise: number };

    // Lock the loan row
    const loanResult = await client.query<{
      id: string; loan_number: string; account_id: string; outstanding_principal_paise: string;
      outstanding_interest_paise: string; status: string;
    }>(
      `SELECT id, loan_number, account_id, outstanding_principal_paise, outstanding_interest_paise, status FROM loans WHERE id = $1 FOR UPDATE`, [loanId],
    );
    if (loanResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loan not found' } });
      return;
    }
    const loan = loanResult.rows[0]!;
    if (loan.status !== 'active') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: { code: 'LOAN_NOT_ACTIVE', message: 'Loan is not active' } });
      return;
    }

    // Find the next due/overdue schedule entry
    const scheduleResult = await client.query<{
      id: string; installment_number: number; principal_paise: string; interest_paise: string;
      total_paise: string; paid_paise: string; due_date: string;
    }>(
      `SELECT id, installment_number, principal_paise, interest_paise, total_paise, paid_paise, due_date
       FROM repayment_schedules WHERE loan_id = $1 AND status IN ('upcoming','due','overdue','partial') ORDER BY installment_number LIMIT 1`,
      [loanId],
    );

    if (scheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: { code: 'NO_DUE', message: 'No pending installments found' } });
      return;
    }

    const sched = scheduleResult.rows[0]!;
    const remaining = Number(sched.total_paise) - Number(sched.paid_paise);

    // Allocate: interest first, then principal
    const interestDue = Number(sched.interest_paise);
    const principalDue = Number(sched.principal_paise);
    const paidSoFar = Number(sched.paid_paise);

    // For simplicity: pay toward this installment
    const payToward = Math.min(amountPaise, remaining);
    const interestComponent = Math.min(payToward, Math.max(0, interestDue - Math.min(paidSoFar, interestDue)));
    const principalComponent = payToward - interestComponent;

    const newPaid = paidSoFar + payToward;
    const schedStatus = newPaid >= Number(sched.total_paise) ? 'paid' : 'partial';

    await client.query(
      `UPDATE repayment_schedules SET paid_paise = $1, status = $2, paid_at = CASE WHEN $2 = 'paid' THEN NOW() ELSE paid_at END WHERE id = $3`,
      [newPaid, schedStatus, sched.id],
    );

    // Create loan repayment record
    const txnNumber = `TXN-${Date.now()}`;
    const txnResult = await client.query<{ id: string }>(
      `INSERT INTO transactions (transaction_number, account_id, transaction_type, amount_paise, balance_after_paise, payment_method, description, status, entered_by, authorized_by, authorized_at, posted_at, branch_id)
       VALUES ($1, $2, 'loan_repayment', $3, (SELECT balance_paise FROM accounts WHERE id = $2) - $3, 'cash', $4, 'posted', $5, $5, NOW(), NOW(), $6) RETURNING id`,
      [txnNumber, loan.account_id, payToward, `Loan repayment: ${loan.loan_number} #${sched.installment_number}`, req.user!.id, req.user!.branchId],
    );

    // Debit the member's account
    await client.query(
      `UPDATE accounts SET balance_paise = balance_paise - $1, updated_at = NOW() WHERE id = $2`,
      [payToward, loan.account_id],
    );

    await client.query(
      `INSERT INTO loan_repayments (loan_id, schedule_id, transaction_id, amount_paise, principal_component_paise, interest_component_paise, received_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [loanId, sched.id, txnResult.rows[0]!.id, payToward, principalComponent, interestComponent, req.user!.id],
    );

    // Update loan outstanding
    const newOutstandingPrincipal = Number(loan.outstanding_principal_paise) - principalComponent;
    const newOutstandingInterest = Number(loan.outstanding_interest_paise) - interestComponent;

    // Find next due date
    const nextDueResult = await client.query<{ due_date: string }>(
      `SELECT due_date FROM repayment_schedules WHERE loan_id = $1 AND status IN ('upcoming','due','overdue','partial') ORDER BY installment_number LIMIT 1`,
      [loanId],
    );
    const nextDueDate = nextDueResult.rows[0]?.due_date ?? null;

    // Check if loan is fully paid
    const allPaidResult = await client.query<{ unpaid: string }>(
      `SELECT COUNT(*) AS unpaid FROM repayment_schedules WHERE loan_id = $1 AND status != 'paid'`, [loanId],
    );
    const loanClosed = parseInt(allPaidResult.rows[0]!.unpaid, 10) === 0;

    await client.query(
      `UPDATE loans SET outstanding_principal_paise = $1, outstanding_interest_paise = GREATEST(0, $2), next_due_date = $3, status = $4, closed_at = $5 WHERE id = $6`,
      [Math.max(0, newOutstandingPrincipal), Math.max(0, newOutstandingInterest), nextDueDate, loanClosed ? 'closed' : 'active', loanClosed ? new Date().toISOString() : null, loanId],
    );

    await client.query('COMMIT');

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'LOAN_REPAYMENT',
      entityType: 'loans',
      entityId: loanId,
      details: { amountPaise: payToward, principalComponent, interestComponent, installment: sched.installment_number, loanClosed },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({
      success: true,
      data: {
        message: loanClosed ? 'Loan fully repaid and closed' : 'Repayment recorded',
        paid: payToward,
        principalComponent,
        interestComponent,
        installmentStatus: schedStatus,
        loanClosed,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
