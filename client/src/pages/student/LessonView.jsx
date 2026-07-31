import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import InteractiveCanvas from '../../components/canvas/InteractiveCanvas.jsx';
import FeedbackForm from '../../components/common/FeedbackForm.jsx';
import { lessonApi } from '../../api/lessons.js';
import { progressApi } from '../../api/progress.js';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startTime = useRef(Date.now());
  const timeLogged = useRef(false);

  useEffect(() => {
    loadLesson();
  }, [id]);

  useEffect(() => {
    return () => logTime();
  }, []);

  const loadLesson = async () => {
    try {
      const { data } = await lessonApi.getLesson(id);
      setLesson(data.data);
      setModule(data.data.module || null);
      progressApi.startLesson(id).catch(() => {});
      startTime.current = Date.now();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lesson not available');
      navigate('/student/modules');
    } finally {
      setLoading(false);
    }
  };

  const logTime = async () => {
    if (timeLogged.current) return;
    timeLogged.current = true;
    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    if (elapsed < 5) return;
    const token = localStorage.getItem('icgla_token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/progress/lesson/${id}/start`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ timeSpentSeconds: elapsed }),
      });
    } catch {
      /* best-effort time logging */
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    timeLogged.current = true;
    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    try {
      await progressApi.completeLesson(id, { timeSpentSeconds: elapsed });
      setCompleted(true);
      toast.success('Lesson marked as complete');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark complete');
    } finally {
      setCompleting(false);
    }
  };

  const lessons = module?.lessons || [];
  const currentIndex = lessons.findIndex((l) => String(l._id) === String(id));
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  if (loading) return <Loader />;
  if (!lesson) return null;

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/student/modules')}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to syllabus
        </button>
        <div className="text-xs font-medium uppercase tracking-wide text-primary-600">
          {module?.title || 'Lesson'}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{lesson.title}</h1>
        {lesson.estimatedMinutes && (
          <p className="mt-1 text-sm text-gray-500">Estimated reading time: ~{lesson.estimatedMinutes} minutes</p>
        )}
      </div>

      <article className="space-y-6">
        <div className="card prose-content max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '<p>No content for this lesson yet.</p>' }} />

        {lesson.mediaAssets?.map((asset, index) => (
          <div key={index} className="card">
            {asset.type === 'video' ? (
              <video src={asset.url} className="mx-auto max-h-96 w-full rounded-lg" controls />
            ) : (
              <img src={asset.url} alt={asset.caption || `Lesson media ${index + 1}`} className="mx-auto max-h-96 rounded-lg" />
            )}
            {asset.caption && <p className="mt-2 text-center text-xs text-gray-500">{asset.caption}</p>}
          </div>
        ))}

        {lesson.interactiveType && lesson.interactiveType !== 'none' && (
          <InteractiveCanvas type={lesson.interactiveType} config={lesson.interactiveConfig} />
        )}

        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className={completed ? 'btn-secondary' : 'btn-primary'}
            onClick={handleComplete}
            disabled={completing || completed}
          >
            {completed ? '✓ Completed' : completing ? 'Marking...' : 'Mark lesson as complete'}
          </button>
          <div className="flex gap-2">
            {prevLesson && (
              <button type="button" className="btn-secondary" onClick={() => navigate(`/student/lessons/${prevLesson._id}`)}>
                ← Previous
              </button>
            )}
            {nextLesson && (
              <button type="button" className="btn-primary" onClick={() => navigate(`/student/lessons/${nextLesson._id}`)}>
                Next →
              </button>
            )}
          </div>
        </div>

        <FeedbackForm targetType="lesson" targetId={lesson._id} />
      </article>
    </DashboardLayout>
  );
};

export default LessonView;
