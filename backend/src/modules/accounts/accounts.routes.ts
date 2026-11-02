import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, createAccountSchema, changeProductSchema, closeAccountSchema } from './accounts.schemas.js';
import * as accountsController from './accounts.controller.js';

const router = Router();

router.get('/products', authenticate, requirePermission(PERMISSIONS.ACCOUNT_READ), accountsController.listProducts);
router.post('/products', authenticate, requirePermission(PERMISSIONS.CONFIG_MANAGE), validate(createProductSchema), accountsController.createProduct);

router.get('/', authenticate, requirePermission(PERMISSIONS.ACCOUNT_READ), accountsController.listAccounts);
router.get('/by-number/:accountNumber', authenticate, requirePermission(PERMISSIONS.ACCOUNT_READ), accountsController.getAccountByNumber);
router.get('/by-member/:memberId', authenticate, requirePermission(PERMISSIONS.ACCOUNT_READ), accountsController.getAccountsByMember);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.ACCOUNT_READ), accountsController.getAccount);
router.post('/', authenticate, requirePermission(PERMISSIONS.ACCOUNT_CREATE), validate(createAccountSchema), accountsController.createAccount);
router.post('/:id/approve', authenticate, requirePermission(PERMISSIONS.ACCOUNT_CREATE), accountsController.approveAccount);
router.patch('/:id/product', authenticate, requirePermission(PERMISSIONS.ACCOUNT_CREATE), validate(changeProductSchema), accountsController.changeProduct);
router.post('/:id/close', authenticate, requirePermission(PERMISSIONS.ACCOUNT_CLOSE), validate(closeAccountSchema), accountsController.closeAccount);

export default router;
