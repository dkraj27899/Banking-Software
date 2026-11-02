import { Router } from 'express';
import { paginationSchema, PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as auditController from './audit.controller.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.AUDIT_READ));

router.get('/', validate(paginationSchema, 'query'), auditController.listAuditLogs);

export default router;
