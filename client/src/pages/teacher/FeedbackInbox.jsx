import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { feedbackApi } from '../../api/feedback.js';

const FeedbackInbox = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || 'teacher';
  const [feedback, setFeedback] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    load();
  }, [status]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const { data } = await feedbackApi.getAll(params);
      setFeedback(data.data.feedback);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const respond = async (item) => {
    const text = (responses[item._id] || '').trim();
    if (!text) {
      toast.error('Write a response first');
      return;
    }
    setSaving(item._id);
    try {
      await feedbackApi.respond(item._id, text);
      toast.success('Response sent');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond');
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Inbox</h1>
          <p className="text-sm text-gray-500">Feedback and questions from students.</p>
        </div>
        <select className="input-field w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All feedback</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <Loader fullScreen={false} />
      ) : feedback.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No feedback to show.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div key={item._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{item.fromUser?.fullName}</span>
                    <span className="text-xs text-gray-400">({item.fromUser?.role})</span>
                    {item.rating && <span className="text-sm text-amber-400">{'★'.repeat(item.rating)}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{item.targetType}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        item.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-700">{item.message}</p>

              {item.status === 'resolved' && item.response && (
                <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm text-gray-700">
                  <span className="font-semibold text-primary-700">Response:</span> {item.response}
                </div>
              )}

              {item.status === 'open' && (
                <div className="mt-3">
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Write a response..."
                    value={responses[item._id] || ''}
                    onChange={(e) => setResponses({ ...responses, [item._id]: e.target.value })}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => respond(item)}
                      disabled={saving === item._id}
                    >
                      {saving === item._id ? 'Sending...' : 'Respond & resolve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default FeedbackInbox;
