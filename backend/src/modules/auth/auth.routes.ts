import { Router } from 'express';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from '@bccs/shared';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
