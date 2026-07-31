import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { notificationApi } from '../../api/feedback.js';

const typeColor = {
  'new-lesson': 'bg-blue-100 text-blue-700',
  'quiz-graded': 'bg-green-100 text-green-700',
  'feedback-response': 'bg-purple-100 text-purple-700',
  'class-announcement': 'bg-amber-100 text-amber-700',
  account: 'bg-gray-100 text-gray-700',
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const load = async () => {
    try {
      const { data } = await notificationApi.getMine();
      setNotifications(data.data.notifications || []);
      setUnread(data.data.unread || 0);
    } catch {
      /* notification loading is best-effort */
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const goTo = async (notification) => {
    setOpen(false);
    if (!notification.isRead) {
      try {
        await notificationApi.markRead(notification._id);
        setUnread((u) => Math.max(0, u - 1));
        setNotifications((n) => n.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
      } catch {
        /* ignore */
      }
    }
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <button type="button" className="text-xs font-medium text-primary-600 hover:text-primary-700" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No notifications yet.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => goTo(n)}
                  className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${!n.isRead ? 'bg-primary-50/40' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeColor[n.type] || 'bg-gray-100 text-gray-600'}`}>
                      {n.type.replace('-', ' ')}
                    </span>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Unread" />}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
