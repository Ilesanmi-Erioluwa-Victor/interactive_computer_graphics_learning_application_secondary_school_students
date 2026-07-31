import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  approveTeacher,
  getReportsOverview,
} from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';
import validate from '../middleware/validateMiddleware.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.get('/users/:id', [param('id').isMongoId().withMessage('Invalid user id')], validate, getUserById);

router.put(
  '/users/:id',
  [param('id').isMongoId().withMessage('Invalid user id')],
  validate,
  updateUser
);

router.delete(
  '/users/:id',
  [param('id').isMongoId().withMessage('Invalid user id')],
  validate,
  deleteUser
);

router.put(
  '/users/:id/approve',
  [param('id').isMongoId().withMessage('Invalid user id')],
  validate,
  approveTeacher
);

router.get('/reports/overview', getReportsOverview);

export default router;
