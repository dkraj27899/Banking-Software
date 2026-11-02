import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as loansController from './loans.controller.js';

const router = Router();

router.use(authenticate);

// Loan Products
router.get('/products', requirePermission('loan:read'), loansController.listLoanProducts);

// Loan Applications
router.post('/applications', requirePermission('loan:create'), loansController.createApplication);
router.get('/applications', requirePermission('loan:read'), loansController.listApplications);
router.get('/applications/:id', requirePermission('loan:read'), loansController.getApplication);
router.post('/applications/:id/approve', requirePermission('loan:approve'), loansController.approveApplication);
router.post('/applications/:id/reject', requirePermission('loan:approve'), loansController.rejectApplication);
router.post('/applications/:id/disburse', requirePermission('loan:disburse'), loansController.disburseLoan);

// Active Loans
router.get('/', requirePermission('loan:read'), loansController.listLoans);
router.get('/:id', requirePermission('loan:read'), loansController.getLoan);
router.get('/:id/schedule', requirePermission('loan:read'), loansController.getLoanSchedule);
router.post('/:id/repayment', requirePermission('transaction:create'), loansController.recordRepayment);

export default router;
