import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  saveQuestions,
  deleteQuestion,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptById,
} from '../controllers/quizController.js';
import protect from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(protect);

router.post(
  '/quizzes',
  authorize('teacher', 'admin'),
  [
    body('module').isMongoId().withMessage('Invalid module id'),
    body('title').trim().notEmpty().withMessage('Quiz title is required').isLength({ max: 200 }),
  ],
  validate,
  createQuiz
);

router.get('/quizzes', getQuizzes);

router.get('/quizzes/:id', [param('id').isMongoId().withMessage('Invalid quiz id')], validate, getQuizById);

router.put(
  '/quizzes/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid quiz id')],
  validate,
  updateQuiz
);

router.delete(
  '/quizzes/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid quiz id')],
  validate,
  deleteQuiz
);

router.post(
  '/quizzes/:id/questions',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid quiz id')],
  validate,
  saveQuestions
);

router.delete(
  '/quizzes/questions/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid question id')],
  validate,
  deleteQuestion
);

router.post(
  '/quizzes/:id/start',
  authorize('student'),
  [param('id').isMongoId().withMessage('Invalid quiz id')],
  validate,
  startAttempt
);

router.post(
  '/quizzes/:id/submit',
  authorize('student'),
  [
    param('id').isMongoId().withMessage('Invalid quiz id'),
    body('attemptId').isMongoId().withMessage('Invalid attempt id'),
  ],
  validate,
  submitAttempt
);

router.get(
  '/quizzes/:id/attempts/mine',
  authorize('student'),
  [param('id').isMongoId().withMessage('Invalid quiz id')],
  validate,
  getMyAttempts
);

router.get(
  '/quizzes/:id/attempts/:attemptId',
  [param('id').isMongoId().withMessage('Invalid quiz id'), param('attemptId').isMongoId().withMessage('Invalid attempt id')],
  validate,
  getAttemptById
);

export default router;
