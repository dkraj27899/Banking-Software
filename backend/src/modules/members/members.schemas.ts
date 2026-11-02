import { z } from 'zod';

export const createMemberSchema = z.object({
  fullName: z.string().min(2).max(200).trim(),
  fatherGuardianName: z.string().max(200).trim().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  addressLine1: z.string().min(1).max(500).trim(),
  addressLine2: z.string().max(500).trim().optional(),
  city: z.string().min(1).max(100).trim(),
  state: z.string().min(1).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Must be 6-digit pincode'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  email: z.string().email().max(200).optional(),
  aadhaarLast4: z.string().regex(/^\d{4}$/).optional(),
  membershipType: z.enum(['individual', 'joint', 'minor', 'corporate']).default('individual'),
});

export const updateMemberSchema = z.object({
  fullName: z.string().min(2).max(200).trim().optional(),
  fatherGuardianName: z.string().max(200).trim().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  addressLine1: z.string().min(1).max(500).trim().optional(),
  addressLine2: z.string().max(500).trim().optional(),
  city: z.string().min(1).max(100).trim().optional(),
  state: z.string().min(1).max(100).trim().optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().email().max(200).optional(),
  aadhaarLast4: z.string().regex(/^\d{4}$/).optional(),
  membershipType: z.enum(['individual', 'joint', 'minor', 'corporate']).optional(),
});

export const rejectMemberSchema = z.object({
  rejectionReason: z.string().min(1).max(1000).trim(),
});
