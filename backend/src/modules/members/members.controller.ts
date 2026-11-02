import type { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLog.js';
import { notifyApprovers } from '../notifications/notifications.service.js';

interface MemberRow {
  id: string;
  membership_number: string | null;
  full_name: string;
  father_guardian_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  email: string | null;
  aadhaar_last4: string | null;
  aadhaar_verified: boolean;
  pan_verified: boolean;
  membership_type: string;
  status: string;
  application_date: string;
  approval_date: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  rejection_reason: string | null;
  branch_id: string;
  branch_name: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

function mapMember(row: MemberRow) {
  return {
    id: row.id,
    membershipNumber: row.membership_number,
    fullName: row.full_name,
    fatherGuardianName: row.father_guardian_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    mobile: row.mobile,
    email: row.email,
    aadhaarLast4: row.aadhaar_last4,
    aadhaarVerified: row.aadhaar_verified,
    panVerified: row.pan_verified,
    membershipType: row.membership_type,
    status: row.status,
    applicationDate: row.application_date,
    approvalDate: row.approval_date,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    rejectionReason: row.rejection_reason,
    branchId: row.branch_id,
    branchName: row.branch_name,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, search, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      status?: string;
    };

    const pg = Number(page) || 1;
    const ps = Number(pageSize) || 20;
    const offset = (pg - 1) * ps;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(m.full_name ILIKE $${idx} OR m.mobile ILIKE $${idx} OR m.membership_number ILIKE $${idx})`);
    }

    if (status && ['pending', 'active', 'inactive', 'rejected'].includes(status)) {
      params.push(status);
      conditions.push(`m.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM members m ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0]!.count, 10);

    const dataParams = [...params, ps, offset];
    const dataResult = await query<MemberRow>(
      `SELECT m.*, b.name AS branch_name,
              cb.full_name AS created_by_name,
              ab.full_name AS approved_by_name
       FROM members m
       JOIN branches b ON m.branch_id = b.id
       JOIN staff_users cb ON m.created_by = cb.id
       LEFT JOIN staff_users ab ON m.approved_by = ab.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );

    res.json({
      success: true,
      data: dataResult.rows.map(mapMember),
      meta: { page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const result = await query<MemberRow>(
      `SELECT m.*, b.name AS branch_name,
              cb.full_name AS created_by_name,
              ab.full_name AS approved_by_name
       FROM members m
       JOIN branches b ON m.branch_id = b.id
       JOIN staff_users cb ON m.created_by = cb.id
       LEFT JOIN staff_users ab ON m.approved_by = ab.id
       WHERE m.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
      return;
    }

    res.json({ success: true, data: mapMember(result.rows[0]!) });
  } catch (err) {
    next(err);
  }
}

export async function createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      fullName: string;
      fatherGuardianName?: string;
      dateOfBirth?: string;
      gender?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      mobile: string;
      email?: string;
      aadhaarLast4?: string;
      membershipType: string;
    };

    const dupCheck = await query<{ id: string }>(
      `SELECT id FROM members WHERE mobile = $1 AND status IN ('pending','active')`,
      [body.mobile],
    );
    if (dupCheck.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_MOBILE', message: 'A member with this mobile number already exists' },
      });
      return;
    }

    const result = await query<{ id: string }>(
      `INSERT INTO members (
        full_name, father_guardian_name, date_of_birth, gender,
        address_line1, address_line2, city, state, pincode,
        mobile, email, aadhaar_last4, membership_type,
        branch_id, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id`,
      [
        body.fullName,
        body.fatherGuardianName ?? null,
        body.dateOfBirth ?? null,
        body.gender ?? null,
        body.addressLine1,
        body.addressLine2 ?? null,
        body.city,
        body.state,
        body.pincode,
        body.mobile,
        body.email ?? null,
        body.aadhaarLast4 ?? null,
        body.membershipType,
        req.user!.branchId,
        req.user!.id,
      ],
    );

    const memberId = result.rows[0]!.id;

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'MEMBER_CREATE',
      entityType: 'members',
      entityId: memberId,
      details: { fullName: body.fullName, mobile: body.mobile },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    notifyApprovers(
      req.user!.id,
      'New Member — Approval Required',
      `${req.user!.fullName} added new member "${body.fullName}". Needs your approval.`,
      '/members',
    );

    res.status(201).json({ success: true, data: { id: memberId, message: 'Member application submitted' } });
  } catch (err) {
    next(err);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const updates = req.body as Record<string, unknown>;

    const existing = await query<{ status: string }>(
      `SELECT status FROM members WHERE id = $1`,
      [id],
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
      return;
    }
    if (existing.rows[0]!.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_EDITABLE', message: 'Only pending members can be updated' },
      });
      return;
    }

    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      fatherGuardianName: 'father_guardian_name',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      addressLine1: 'address_line1',
      addressLine2: 'address_line2',
      city: 'city',
      state: 'state',
      pincode: 'pincode',
      mobile: 'mobile',
      email: 'email',
      aadhaarLast4: 'aadhaar_last4',
      membershipType: 'membership_type',
    };

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const column = fieldMap[key];
      if (column && value !== undefined) {
        params.push(value);
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      res.status(400).json({ success: false, error: { code: 'NO_CHANGES', message: 'No valid fields to update' } });
      return;
    }

    params.push(id);
    setClauses.push('updated_at = NOW()');

    await query(
      `UPDATE members SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
      params,
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'MEMBER_UPDATE',
      entityType: 'members',
      entityId: id,
      details: updates,
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Member updated' } });
  } catch (err) {
    next(err);
  }
}

export async function approveMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    const result = await withTransaction(async (client) => {
      const memberResult = await client.query<{ status: string; created_by: string }>(
        `SELECT status, created_by FROM members WHERE id = $1 FOR UPDATE`,
        [id],
      );

      if (memberResult.rows.length === 0) {
        throw Object.assign(new Error('Member not found'), { statusCode: 404, code: 'NOT_FOUND' });
      }
      if (memberResult.rows[0]!.status !== 'pending') {
        throw Object.assign(new Error('Only pending members can be approved'), { statusCode: 400, code: 'NOT_PENDING' });
      }

      const configResult = await client.query<{ value: unknown }>(
        `SELECT value FROM system_configuration WHERE key = 'membership_number_prefix'`,
      );
      const prefix = configResult.rows[0]
        ? String(typeof configResult.rows[0].value === 'string' ? configResult.rows[0].value : JSON.parse(String(configResult.rows[0].value)))
        : 'BCCS';

      const year = new Date().getFullYear();
      const pattern = `${prefix}-${year}-%`;

      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM members WHERE membership_number LIKE $1`,
        [pattern],
      );
      const seq = parseInt(countResult.rows[0]!.count, 10) + 1;
      const membershipNumber = `${prefix}-${year}-${String(seq).padStart(5, '0')}`;

      await client.query(
        `UPDATE members SET
          status = 'active',
          membership_number = $1,
          approval_date = CURRENT_DATE,
          approved_by = $2,
          updated_at = NOW()
        WHERE id = $3`,
        [membershipNumber, req.user!.id, id],
      );

      return membershipNumber;
    });

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'MEMBER_APPROVE',
      entityType: 'members',
      entityId: id,
      details: { membershipNumber: result },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { membershipNumber: result, message: 'Member approved' } });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function rejectMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { rejectionReason } = req.body as { rejectionReason: string };

    const result = await query(
      `UPDATE members SET
        status = 'rejected',
        rejection_reason = $1,
        updated_at = NOW()
      WHERE id = $2 AND status = 'pending'
      RETURNING id`,
      [rejectionReason, id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pending member not found' },
      });
      return;
    }

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      action: 'MEMBER_REJECT',
      entityType: 'members',
      entityId: id,
      details: { rejectionReason },
      ipAddress: String(req.ip ?? 'unknown'),
      branchId: req.user!.branchId,
    });

    res.json({ success: true, data: { message: 'Member rejected' } });
  } catch (err) {
    next(err);
  }
}
