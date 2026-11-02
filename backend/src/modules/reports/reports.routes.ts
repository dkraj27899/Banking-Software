import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as reportsController from './reports.controller.js';

const router = Router();

router.get('/daily-cash', authenticate, requirePermission(PERMISSIONS.REPORT_READ), reportsController.getDailyCash);

export default router;
