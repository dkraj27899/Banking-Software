import { z } from 'zod';

export const createProductSchema = z.object({
  code: z.string().min(1).max(20).trim(),
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  accountType: z.enum(['savings', 'fixed_deposit', 'recurring_deposit', 'share_capital', 'loan']),
  minBalancePaise: z.number().int().min(0).default(0),
  interestRateBps: z.number().int().min(0).max(5000).default(0),
  rules: z.record(z.unknown()).optional(),
});

export const createAccountSchema = z.object({
  memberId: z.string().uuid(),
  productId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
});

export const updateAccountSchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
});

export const changeProductSchema = z.object({
  productId: z.string().uuid(),
});

export const closeAccountSchema = z.object({
  closureReason: z.string().min(1).max(1000).trim(),
});
