import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createClass,
  getMyClasses,
  getClassStudents,
  updateClass,
  removeStudent,
  joinClass,
  deleteClass,
} from '../controllers/classController.js';
import protect from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(protect);

router.post(
  '/classes',
  authorize('teacher', 'admin'),
  [body('name').trim().notEmpty().withMessage('Class name is required')],
  validate,
  createClass
);

router.get('/classes/mine', getMyClasses);

router.put(
  '/classes/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid class id'), body('name').trim().notEmpty().withMessage('Class name is required')],
  validate,
  updateClass
);

router.get(
  '/classes/:id/students',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid class id')],
  validate,
  getClassStudents
);

router.delete(
  '/classes/:id/students/:studentId',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid class id'), param('studentId').isMongoId().withMessage('Invalid student id')],
  validate,
  removeStudent
);

router.delete(
  '/classes/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid class id')],
  validate,
  deleteClass
);

router.post(
  '/classes/join',
  authorize('student'),
  [body('classCode').trim().notEmpty().withMessage('Class code is required')],
  validate,
  joinClass
);

export default router;
