import Notification from '../models/Notification.js';
import { sendSuccess } from '../utils/apiResponse.js';

const getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 50;

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ user: req.user._id }),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return sendSuccess(
      res,
      200,
      { notifications, total, unread, hasMore: page * limit < total },
      'Notifications fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, user: req.user._id });
    if (!notification) {
      return sendSuccess(res, 200, null, 'Notification not found');
    }
    notification.isRead = true;
    await notification.save();
    return sendSuccess(res, 200, notification, 'Notification marked as read');
  } catch (error) {
    return next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
    return sendSuccess(res, 200, null, 'All notifications marked as read');
  } catch (error) {
    return next(error);
  }
};

export { getMyNotifications, markAsRead, markAllRead };
