import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createTransactionSchema, authorizeTransactionSchema, reverseTransactionSchema } from './transactions.schemas.js';
import * as txnController from './transactions.controller.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.TRANSACTION_READ), txnController.listTransactions);
router.get('/pending', authenticate, requirePermission(PERMISSIONS.TRANSACTION_AUTHORIZE), txnController.getPendingAuthorizations);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.TRANSACTION_READ), txnController.getTransaction);
router.post('/', authenticate, requirePermission(PERMISSIONS.TRANSACTION_CREATE), validate(createTransactionSchema), txnController.createTransaction);
router.post('/:id/authorize', authenticate, requirePermission(PERMISSIONS.TRANSACTION_AUTHORIZE), validate(authorizeTransactionSchema), txnController.authorizeTransaction);
router.post('/:id/reverse', authenticate, requirePermission(PERMISSIONS.TRANSACTION_REVERSE), validate(reverseTransactionSchema), txnController.reverseTransaction);

export default router;
