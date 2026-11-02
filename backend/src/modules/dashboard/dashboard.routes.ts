import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/stats', authenticate, dashboardController.getDashboardStats);
router.get('/ledger', authenticate, requirePermission(PERMISSIONS.LEDGER_READ), dashboardController.getLedgerSummary);

export default router;
