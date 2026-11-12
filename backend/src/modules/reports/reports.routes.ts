import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as reportsController from './reports.controller.js';

const router = Router();

router.get('/daily-cash', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getDailyCash);
router.get('/monthly-transactions', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getMonthlyTransactions);
router.get('/member-growth', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getMemberGrowth);
router.get('/loan-portfolio', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getLoanPortfolio);
router.get('/expense-summary', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getExpenseSummary);
router.get('/trial-balance', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getTrialBalance);
router.get('/general-ledger', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getGeneralLedger);

export default router;
