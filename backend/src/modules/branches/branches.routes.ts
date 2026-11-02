import { Router } from 'express';
import { z } from 'zod';
import { paginationSchema, uuidParamSchema, PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as branchesController from './branches.controller.js';

const createBranchSchema = z.object({
  code: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
  name: z.string().min(2).max(200).trim(),
  address: z.string().min(5).max(500).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/),
  phone: z.string().min(10).max(15),
});

const updateBranchSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  address: z.string().min(5).max(500).trim().optional(),
  city: z.string().min(2).max(100).trim().optional(),
  state: z.string().min(2).max(100).trim().optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  phone: z.string().min(10).max(15).optional(),
  isActive: z.boolean().optional(),
});

const router = Router();

router.use(authenticate);

router.get('/', branchesController.listBranches);
router.get('/:id', validate(uuidParamSchema, 'params'), branchesController.getBranch);
router.post('/', requirePermission(PERMISSIONS.BRANCH_MANAGE), validate(createBranchSchema), branchesController.createBranch);
router.patch('/:id', requirePermission(PERMISSIONS.BRANCH_MANAGE), validate(uuidParamSchema, 'params'), validate(updateBranchSchema), branchesController.updateBranch);

export default router;
