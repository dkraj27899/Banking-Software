import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as ctrl from './notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listNotifications);
router.get('/count', ctrl.getUnreadCount);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);

export default router;
