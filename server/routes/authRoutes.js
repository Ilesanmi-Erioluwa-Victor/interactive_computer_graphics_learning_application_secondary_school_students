import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  registerStudent,
  registerTeacher,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters');

router.post(
  '/register/student',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Please provide a valid email'),
    passwordRule,
    body('classCode').trim().notEmpty().withMessage('Class code is required'),
  ],
  validate,
  registerStudent
);

router.post(
  '/register/teacher',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Please provide a valid email'),
    passwordRule,
  ],
  validate,
  registerTeacher
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [passwordRule],
  validate,
  resetPassword
);

export default router;
