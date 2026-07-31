import User from '../models/User.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import Class from '../models/Class.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import notifyUsers from '../utils/notify.js';

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;
    if (req.query.approval === 'pending') {
      filter.role = 'teacher';
      filter.isApproved = false;
    }
    if (req.query.search) {
      const q = new RegExp(req.query.search, 'i');
      filter.$or = [{ fullName: q }, { email: q }, { className: q }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -emailVerifyToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      200,
      {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Users fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password -resetPasswordToken -emailVerifyToken');
    if (!user) throw new ApiError(404, 'User not found');
    return sendSuccess(res, 200, user, 'User fetched');
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user._id) && req.body.isActive === false) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }

    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    const allowed = ['fullName', 'role', 'isActive', 'isApproved', 'school', 'className', 'avatarUrl'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (user.role !== 'teacher') user.isApproved = true;

    await user.save();
    return sendSuccess(res, 200, user.toSafeJSON(), 'User updated');
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user._id)) {
      throw new ApiError(400, 'You cannot delete your own account');
    }

    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    user.isActive = false;
    await user.save();

    return sendSuccess(res, 200, null, 'User deactivated (soft delete)');
  } catch (error) {
    return next(error);
  }
};

const approveTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role !== 'teacher') throw new ApiError(400, 'Only teacher accounts require approval');

    user.isApproved = true;
    await user.save();

    await notifyUsers({
      users: [user._id],
      message: 'Your teacher account has been approved. You can now create lessons and quizzes.',
      type: 'account',
      link: '/teacher',
    });

    return sendSuccess(res, 200, user.toSafeJSON(), 'Teacher approved');
  } catch (error) {
    return next(error);
  }
};

const getReportsOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeStudents,
      teachers,
      pendingTeachers,
      modules,
      lessonsPublished,
      quizzes,
      attempts,
      classes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'teacher', isApproved: false }),
      Module.countDocuments({ archived: false }),
      Lesson.countDocuments({ isPublished: true, archived: false }),
      Quiz.countDocuments({ isPublished: true, archived: false }),
      Attempt.countDocuments({ submittedAt: { $ne: null } }),
      Class.countDocuments(),
    ]);

    const passedAttempts = await Attempt.countDocuments({ passed: true, submittedAt: { $ne: null } });
    const avgPassRate = attempts > 0 ? Math.round((passedAttempts / attempts) * 100) : 0;

    const avgScoreAgg = await Attempt.aggregate([
      { $match: { submittedAt: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } },
    ]);
    const avgScore = avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avg) : 0;

    const mostViewedModules = await Module.aggregate([
      { $match: { archived: false } },
      {
        $lookup: {
          from: 'progresses',
          localField: '_id',
          foreignField: 'module',
          as: 'progress',
        },
      },
      { $project: { title: 1, views: { $size: '$progress' } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
    ]);

    const modulePerformance = await Quiz.aggregate([
      { $match: { archived: false } },
      {
        $lookup: {
          from: 'attempts',
          localField: '_id',
          foreignField: 'quiz',
          as: 'attempts',
        },
      },
      {
        $lookup: {
          from: 'modules',
          localField: 'module',
          foreignField: '_id',
          as: 'moduleInfo',
        },
      },
      { $unwind: '$moduleInfo' },
      {
        $project: {
          moduleTitle: '$moduleInfo.title',
          quizTitle: '$title',
          attempts: { $size: '$attempts' },
          passed: {
            $size: { $filter: { input: '$attempts', as: 'a', cond: { $eq: ['$$a.passed', true] } } },
          },
          avgScore: {
            $avg: { $ifNull: ['$attempts.percentage', null] },
          },
        },
      },
      { $sort: { attempts: -1 } },
      { $limit: 10 },
    ]);

    return sendSuccess(
      res,
      200,
      {
        totalUsers,
        activeStudents,
        teachers,
        pendingTeachers,
        modules,
        lessonsPublished,
        quizzes,
        attempts,
        classes,
        avgPassRate,
        avgScore,
        mostViewedModules,
        modulePerformance,
      },
      'Reports overview fetched'
    );
  } catch (error) {
    return next(error);
  }
};

export { getUsers, getUserById, updateUser, deleteUser, approveTeacher, getReportsOverview };
