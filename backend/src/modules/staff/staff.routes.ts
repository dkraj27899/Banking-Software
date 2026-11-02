import { Router } from 'express';
import { createStaffSchema, updateStaffSchema, paginationSchema, uuidParamSchema, PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as staffController from './staff.controller.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.STAFF_MANAGE));

router.get('/', validate(paginationSchema, 'query'), staffController.listStaff);
router.get('/:id', validate(uuidParamSchema, 'params'), staffController.getStaff);
router.post('/', validate(createStaffSchema), staffController.createStaff);
router.patch('/:id', validate(uuidParamSchema, 'params'), validate(updateStaffSchema), staffController.updateStaff);
router.patch('/:id/deactivate', validate(uuidParamSchema, 'params'), staffController.deactivateStaff);

export default router;
