import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as expensesController from './expenses.controller.js';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', requirePermission('expense:read'), expensesController.listCategories);

// Expenses
router.post('/', requirePermission('expense:create'), expensesController.createExpense);
router.get('/', requirePermission('expense:read'), expensesController.listExpenses);
router.get('/:id', requirePermission('expense:read'), expensesController.getExpense);
router.post('/:id/approve', requirePermission('expense:approve'), expensesController.approveExpense);
router.post('/:id/reject', requirePermission('expense:approve'), expensesController.rejectExpense);
router.post('/:id/pay', requirePermission('expense:approve'), expensesController.payExpense);

export default router;
