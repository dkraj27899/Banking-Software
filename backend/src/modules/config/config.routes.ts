import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as configController from './config.controller.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.CONFIG_MANAGE), configController.listConfig);
router.get('/:key', authenticate, requirePermission(PERMISSIONS.CONFIG_MANAGE), configController.getConfig);
router.patch('/:key', authenticate, requirePermission(PERMISSIONS.CONFIG_MANAGE), configController.updateConfig);

export default router;
