import type { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';
import { notifyApprovers } from '../notifications/notifications.service.js';

const PRODUCT_GL_MAP: Record<string, string> = {
  savings: '2100',
  fixed_deposit: '2200',
  recurring_deposit: '2300',
  share_capital: '3000',
  loan: '2500',
};

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query<{
      id: string; code: string; name: string; description: string | null;
      account_type: string; min_balance_paise: string; interest_rate_bps: number;
      is_active: boolean; rules: Record<string, unknown>;
    }>(`SELECT * FROM account_products ORDER BY code`);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        accountType: r.account_type,
        minBalancePaise: Number(r.min_balance_paise),
        interestRateBps: r.interest_rate_bps,
        isActive: r.is_active,
        rules: r.rules,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      code: string; name: string; description?: string;
      accountType: string; minBalancePaise: number; interestRateBps: number;
      rules?: Record<string, unknown>;
    };

    const result = await query<{ id: string }>(
      `INSERT INTO account_products (code, name, description, account_type, min_balance_paise, interest_rate_bps, rules)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [body.code, body.name, body.description ?? null, body.accountType, body.minBalancePaise, body.interestRateBps, JSON.stringify(body.rules ?? {})],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'PRODUCT_CREATE',
      entityType: 'account_products',
      entityId: result.rows[0]!.id,
      details: { code: body.code, name: body.name },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.status(201).json({ success: true, data: { id: result.rows[0]!.id } });
  } catch (err) {
    next(err);
  }
}

export async function listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, memberId, status, search } = req.query as unknown as {
      page: number; pageSize: number; memberId?: string; status?: string; search?: string;
    };

    const pg = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const offset = (pg - 1) * ps;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (memberId) {
      params.push(memberId);
      conditions.push(`a.member_id = $${params.length}`);
    }
    if (status && ['pending', 'active', 'suspended', 'closed'].includes(status)) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(a.account_number ILIKE $${idx} OR m.full_name ILIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM accounts a JOIN members m ON a.member_id = m.id ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0]!.count, 10);

    const dataParams = [...params, ps, offset];
    const dataResult = await query<Record<string, unknown>>(
      `SELECT a.*, m.full_name AS member_name, m.membership_number,
              p.name AS product_name, p.code AS product_code, p.account_type AS product_type,
              b.name AS branch_name
       FROM accounts a
       JOIN members m ON a.member_id = m.id
       JOIN account_products p ON a.product_id = p.id
       JOIN branches b ON a.branch_id = b.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );

    res.json({
      success: true,
      data: dataResult.rows.map((r) => ({
        id: r.id,
        accountNumber: r.account_number,
        memberId: r.member_id,
        memberName: r.member_name,
        membershipNumber: r.membership_number,
        productId: r.product_id,
        productName: r.product_name,
        productCode: r.product_code,
        productType: r.product_type,
        branchId: r.branch_id,
        branchName: r.branch_name,
        status: r.status,
        balancePaise: Number(r.balance_paise),
        openedAt: r.opened_at,
        closedAt: r.closed_at,
        createdAt: r.created_at,
      })),
      meta: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) },
    });
  } catch (err) {
    next(err);
  }
}

function mapAccountRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    accountNumber: r.account_number,
    memberId: r.member_id,
    memberName: r.member_name,
    membershipNumber: r.membership_number,
    productId: r.product_id,
    productName: r.product_name,
    productCode: r.product_code,
    productType: r.product_type,
    minBalancePaise: Number(r.min_balance_paise),
    interestRateBps: r.interest_rate_bps,
    branchId: r.branch_id,
    branchName: r.branch_name,
    status: r.status,
    balancePaise: Number(r.balance_paise),
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    closureReason: r.closure_reason,
    createdBy: r.created_by,
    approvedBy: r.approved_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const ACCOUNT_DETAIL_SQL = `
  SELECT a.*, m.full_name AS member_name, m.membership_number,
         p.name AS product_name, p.code AS product_code, p.account_type AS product_type,
         p.min_balance_paise, p.interest_rate_bps,
         b.name AS branch_name
  FROM accounts a
  JOIN members m ON a.member_id = m.id
  JOIN account_products p ON a.product_id = p.id
  JOIN branches b ON a.branch_id = b.id`;

export async function getAccountByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountNumber = String(req.params['accountNumber']);
    const result = await query<Record<string, unknown>>(
      `${ACCOUNT_DETAIL_SQL} WHERE a.account_number = $1`,
      [accountNumber],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }

    res.json({ success: true, data: mapAccountRow(result.rows[0]!) });
  } catch (err) {
    next(err);
  }
}

export async function getAccountsByMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberId = String(req.params['memberId']);
    const result = await query<Record<string, unknown>>(
      `${ACCOUNT_DETAIL_SQL} WHERE a.member_id = $1 ORDER BY a.created_at DESC`,
      [memberId],
    );

    res.json({ success: true, data: result.rows.map(mapAccountRow) });
  } catch (err) {
    next(err);
  }
}

export async function getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query<Record<string, unknown>>(
      `${ACCOUNT_DETAIL_SQL} WHERE a.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }

    res.json({ success: true, data: mapAccountRow(result.rows[0]!) });
  } catch (err) {
    next(err);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { memberId, productId, branchId } = req.body as {
      memberId: string; productId: string; branchId?: string;
    };

    const memberCheck = await query<{ status: string }>(
      `SELECT status FROM members WHERE id = $1`, [memberId],
    );
    if (memberCheck.rows.length === 0 || memberCheck.rows[0]!.status !== 'active') {
      res.status(400).json({
        success: false,
        error: { code: 'MEMBER_NOT_ACTIVE', message: 'Member must be active to open an account' },
      });
      return;
    }

    const productCheck = await query<{ is_active: boolean }>(
      `SELECT is_active FROM account_products WHERE id = $1`, [productId],
    );
    if (productCheck.rows.length === 0 || !productCheck.rows[0]!.is_active) {
      res.status(400).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found or inactive' },
      });
      return;
    }

    const result = await query<{ id: string }>(
      `INSERT INTO accounts (member_id, product_id, branch_id, created_by)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [memberId, productId, branchId ?? req.user!.branchId, req.user!.id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'ACCOUNT_CREATE',
      entityType: 'accounts',
      entityId: result.rows[0]!.id,
      details: { memberId, productId },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    notifyApprovers(
      req.user!.id,
      'New Account — Approval Required',
      `${req.user!.fullName} opened a new account. Needs your approval.`,
      `/accounts/${result.rows[0]!.id}`,
    );

    res.status(201).json({ success: true, data: { id: result.rows[0]!.id } });
  } catch (err) {
    next(err);
  }
}

export async function approveAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    const accountNumber = await withTransaction(async (client) => {
      const acctResult = await client.query<{ status: string; created_by: string }>(
        `SELECT status, created_by FROM accounts WHERE id = $1 FOR UPDATE`, [id],
      );
      if (acctResult.rows.length === 0) {
        throw Object.assign(new Error('Account not found'), { statusCode: 404, code: 'NOT_FOUND' });
      }
      if (acctResult.rows[0]!.status !== 'pending') {
        throw Object.assign(new Error('Only pending accounts can be approved'), { statusCode: 400, code: 'NOT_PENDING' });
      }

      const configResult = await client.query<{ value: unknown }>(
        `SELECT value FROM system_configuration WHERE key = 'account_number_prefix'`,
      );
      const prefix = configResult.rows[0]
        ? String(typeof configResult.rows[0].value === 'string' ? configResult.rows[0].value : JSON.parse(String(configResult.rows[0].value)))
        : 'BCCS';

      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM accounts WHERE account_number IS NOT NULL`,
      );
      const seq = parseInt(countResult.rows[0]!.count, 10) + 1;
      const acctNum = `${prefix}${String(seq).padStart(8, '0')}`;

      await client.query(
        `UPDATE accounts SET status = 'active', account_number = $1, opened_at = CURRENT_DATE,
         approved_by = $2, updated_at = NOW() WHERE id = $3`,
        [acctNum, req.user!.id, id],
      );

      return acctNum;
    });

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'ACCOUNT_APPROVE',
      entityType: 'accounts',
      entityId: id,
      details: { accountNumber },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { accountNumber, message: 'Account approved and activated' } });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function closeAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { closureReason } = req.body as { closureReason: string };

    const acctCheck = await query<{ status: string; balance_paise: string }>(
      `SELECT status, balance_paise FROM accounts WHERE id = $1`, [id],
    );
    if (acctCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }
    if (acctCheck.rows[0]!.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'NOT_ACTIVE', message: 'Only active accounts can be closed' } });
      return;
    }
    if (Number(acctCheck.rows[0]!.balance_paise) !== 0) {
      res.status(400).json({ success: false, error: { code: 'BALANCE_NOT_ZERO', message: 'Account balance must be zero before closing' } });
      return;
    }

    await query(
      `UPDATE accounts SET status = 'closed', closed_at = CURRENT_DATE, closure_reason = $1, updated_at = NOW() WHERE id = $2`,
      [closureReason, id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'ACCOUNT_CLOSE',
      entityType: 'accounts',
      entityId: id,
      details: { closureReason },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Account closed' } });
  } catch (err) {
    next(err);
  }
}

export async function changeProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { productId } = req.body as { productId: string };

    const acctCheck = await query<{ status: string }>(
      `SELECT status FROM accounts WHERE id = $1`, [id],
    );
    if (acctCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
      return;
    }
    if (acctCheck.rows[0]!.status !== 'pending') {
      res.status(400).json({ success: false, error: { code: 'NOT_PENDING', message: 'Product can only be changed on pending accounts' } });
      return;
    }

    const productCheck = await query<{ is_active: boolean; name: string }>(
      `SELECT is_active, name FROM account_products WHERE id = $1`, [productId],
    );
    if (productCheck.rows.length === 0 || !productCheck.rows[0]!.is_active) {
      res.status(400).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found or inactive' } });
      return;
    }

    await query(
      `UPDATE accounts SET product_id = $1, updated_at = NOW() WHERE id = $2`,
      [productId, id],
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'ACCOUNT_CHANGE_PRODUCT',
      entityType: 'accounts',
      entityId: id,
      details: { newProductId: productId, newProductName: productCheck.rows[0]!.name },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Product updated' } });
  } catch (err) {
    next(err);
  }
}

export { PRODUCT_GL_MAP };
