import { z } from 'zod';

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  transactionType: z.enum([
    'cash_deposit', 'cash_withdrawal', 'internal_transfer',
    'loan_disbursement', 'loan_repayment', 'interest_posting', 'fee_charge',
  ]),
  amountPaise: z.number().int().positive(),
  paymentMethod: z.enum(['cash', 'cheque', 'neft', 'rtgs', 'upi', 'internal']).default('cash'),
  referenceNumber: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1).max(100),
});

export const authorizeTransactionSchema = z.object({
  action: z.enum(['authorize', 'reject']),
  reason: z.string().max(500).optional(),
});

export const reverseTransactionSchema = z.object({
  reason: z.string().min(1).max(500),
});
