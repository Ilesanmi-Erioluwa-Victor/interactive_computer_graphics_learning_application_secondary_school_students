import { Router } from 'express';
import { body, param } from 'express-validator';
import { submitFeedback, getFeedback, respondFeedback } from '../controllers/feedbackController.js';
import { getMyNotifications, markAsRead, markAllRead } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(protect);

router.post(
  '/feedback',
  [
    body('message').trim().notEmpty().withMessage('Feedback message is required').isLength({ max: 2000 }),
    body('rating').optional().isInt({ min: 1, max: 5 }),
  ],
  validate,
  submitFeedback
);

router.get('/feedback', authorize('teacher', 'admin'), getFeedback);

router.put(
  '/feedback/:id/respond',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid feedback id'), body('response').trim().notEmpty().withMessage('Response is required')],
  validate,
  respondFeedback
);

router.get('/notifications/mine', getMyNotifications);
router.put('/notifications/read-all', markAllRead);
router.put(
  '/notifications/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification id')],
  validate,
  markAsRead
);

export default router;
