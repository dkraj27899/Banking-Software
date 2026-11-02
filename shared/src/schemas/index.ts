import { z } from 'zod';
import { ROLES } from '../constants/index.js';

const roleValues = Object.values(ROLES) as [string, ...string[]];

export const loginSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores only'),
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must differ from current password',
  path: ['newPassword'],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createStaffSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  fullName: z.string().min(2).max(200).trim(),
  email: z.string().email().max(200),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  role: z.enum(roleValues),
  branchId: z.string().uuid(),
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(2).max(200).trim().optional(),
  email: z.string().email().max(200).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  role: z.enum(roleValues).optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().max(200).optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});
