import Notification from '../models/Notification.js';

const notifyUsers = async ({ users, message, type, link = '' }) => {
  if (!users || users.length === 0) return;
  const docs = users.map((userId) => ({ user: userId, message, type, link }));
  await Notification.insertMany(docs);
};

export default notifyUsers;
