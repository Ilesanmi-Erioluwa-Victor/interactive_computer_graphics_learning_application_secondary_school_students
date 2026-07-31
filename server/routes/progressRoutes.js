import { Router } from 'express';
import { param } from 'express-validator';
import {
  startLesson,
  completeLesson,
  getMine,
  getStudent,
  getClassSummary,
} from '../controllers/progressController.js';
import protect from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(protect);

router.post(
  '/progress/lesson/:id/start',
  authorize('student'),
  [param('id').isMongoId().withMessage('Invalid lesson id')],
  validate,
  startLesson
);

router.post(
  '/progress/lesson/:id/complete',
  authorize('student'),
  [param('id').isMongoId().withMessage('Invalid lesson id')],
  validate,
  completeLesson
);

router.get('/progress/mine', authorize('student'), getMine);

router.get(
  '/progress/student/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid student id')],
  validate,
  getStudent
);

router.get(
  '/progress/class/:classId/summary',
  authorize('teacher', 'admin'),
  [param('classId').isMongoId().withMessage('Invalid class id')],
  validate,
  getClassSummary
);

export default router;
