import Feedback from '../models/Feedback.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import notifyUsers from '../utils/notify.js';

const submitFeedback = async (req, res, next) => {
  try {
    const { targetType, targetId, message, rating } = req.body;

    if (targetType !== 'general' && targetId) {
      const model = targetType === 'lesson' ? Lesson : Quiz;
      const exists = await model.findById(targetId);
      if (!exists) throw new ApiError(404, `${targetType} not found`);
    }

    const feedback = await Feedback.create({
      fromUser: req.user._id,
      targetType: ['lesson', 'quiz', 'general'].includes(targetType) ? targetType : 'general',
      targetId: targetId || null,
      message,
      rating: rating || null,
    });

    return sendSuccess(res, 201, feedback, 'Feedback submitted. Thank you!');
  } catch (error) {
    return next(error);
  }
};

const getFeedback = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate('fromUser', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      200,
      { feedback, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Feedback fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const respondFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) throw new ApiError(404, 'Feedback not found');

    feedback.response = response || '';
    feedback.respondedBy = req.user._id;
    feedback.status = 'resolved';
    await feedback.save();

    await notifyUsers({
      users: [feedback.fromUser],
      message: 'Your feedback received a response from staff.',
      type: 'feedback-response',
      link: '/student/progress',
    });

    return sendSuccess(res, 200, feedback, 'Feedback responded');
  } catch (error) {
    return next(error);
  }
};

export { submitFeedback, getFeedback, respondFeedback };
