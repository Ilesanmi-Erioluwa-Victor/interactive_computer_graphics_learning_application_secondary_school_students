import { useState } from 'react';
import { toast } from 'react-toastify';
import { feedbackApi } from '../../api/feedback.js';

const FeedbackForm = ({ targetType, targetId }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please write a short message');
      return;
    }
    setSending(true);
    try {
      await feedbackApi.submit({
        targetType: targetType || 'general',
        targetId: targetId || null,
        message,
        rating: rating || null,
      });
      toast.success('Feedback submitted. Thank you!');
      setMessage('');
      setRating(0);
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Share feedback about this content
        </button>
      ) : (
        <form onSubmit={submit}>
          <div className="mb-2 flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star`}
                className={`text-xl transition-colors ${n <= rating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-400">Optional rating</span>
          </div>
          <textarea
            rows={3}
            className="input-field"
            placeholder="What did you think of this lesson/quiz?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Feedback message"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? 'Submitting...' : 'Submit feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;
