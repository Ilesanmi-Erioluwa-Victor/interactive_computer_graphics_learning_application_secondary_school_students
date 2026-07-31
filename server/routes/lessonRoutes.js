import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  reorderLessons,
  createLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  uploadLessonMedia,
} from '../controllers/lessonController.js';
import protect from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);

router.post(
  '/modules',
  authorize('teacher', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Module title is required').isLength({ max: 150 }),
    body('description').optional().isLength({ max: 20000 }),
  ],
  validate,
  createModule
);

router.get('/modules', getModules);

router.get(
  '/modules/:id',
  [param('id').isMongoId().withMessage('Invalid module id')],
  validate,
  getModuleById
);

router.put(
  '/modules/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid module id')],
  validate,
  updateModule
);

router.delete(
  '/modules/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid module id')],
  validate,
  deleteModule
);

router.patch(
  '/modules/:id/reorder',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid module id')],
  validate,
  reorderLessons
);

router.post(
  '/modules/:moduleId/lessons',
  authorize('teacher', 'admin'),
  [
    param('moduleId').isMongoId().withMessage('Invalid module id'),
    body('title').trim().notEmpty().withMessage('Lesson title is required').isLength({ max: 200 }),
  ],
  validate,
  createLesson
);

router.get(
  '/lessons/:id',
  [param('id').isMongoId().withMessage('Invalid lesson id')],
  validate,
  getLessonById
);

router.put(
  '/lessons/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid lesson id')],
  validate,
  updateLesson
);

router.delete(
  '/lessons/:id',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid lesson id')],
  validate,
  deleteLesson
);

router.post(
  '/lessons/:id/media',
  authorize('teacher', 'admin'),
  [param('id').isMongoId().withMessage('Invalid lesson id')],
  upload.single('file'),
  uploadLessonMedia
);

export default router;
