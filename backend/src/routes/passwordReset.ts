import { Router } from 'express';
import { body } from 'express-validator';
import { requestPasswordReset, resetPassword, validateResetToken } from '../controllers/passwordReset';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/request',
  [
    body('email').isEmail().normalizeEmail(),
    validate
  ],
  requestPasswordReset
);

router.post(
  '/reset',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
    validate
  ],
  resetPassword
);

router.get('/validate', validateResetToken);

export { router as passwordResetRouter };
