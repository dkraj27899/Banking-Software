import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as statementsController from './statements.controller.js';

const router = Router();

router.get('/:accountId/passbook', authenticate, requirePermission(PERMISSIONS.TRANSACTION_READ), statementsController.getPassbook);
router.get('/:accountId/statement', authenticate, requirePermission(PERMISSIONS.TRANSACTION_READ), statementsController.getAccountStatement);

export default router;
