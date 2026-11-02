import { Router } from 'express';
import { PERMISSIONS } from '@bccs/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createMemberSchema, updateMemberSchema, rejectMemberSchema } from './members.schemas.js';
import * as membersController from './members.controller.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.MEMBER_READ), membersController.listMembers);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.MEMBER_READ), membersController.getMember);
router.post('/', authenticate, requirePermission(PERMISSIONS.MEMBER_CREATE), validate(createMemberSchema), membersController.createMember);
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.MEMBER_UPDATE), validate(updateMemberSchema), membersController.updateMember);
router.post('/:id/approve', authenticate, requirePermission(PERMISSIONS.MEMBER_APPROVE), membersController.approveMember);
router.post('/:id/reject', authenticate, requirePermission(PERMISSIONS.MEMBER_APPROVE), validate(rejectMemberSchema), membersController.rejectMember);

export default router;
