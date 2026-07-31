import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import FeedbackForm from '../../components/common/FeedbackForm.jsx';
import { quizApi } from '../../api/quizzes.js';

const QuizView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const answerRef = useRef(answers);
  answerRef.current = answers;

  useEffect(() => {
    loadQuiz();
  }, [id]);

  useEffect(() => {
    if (phase !== 'taking' || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const loadQuiz = async () => {
    try {
      const { data } = await quizApi.getQuiz(id);
      setQuiz(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Quiz not available');
      navigate('/student/modules');
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setLoading(true);
    try {
      const { data } = await quizApi.startAttempt(id);
      const attemptData = data.data;
      setAttempt(attemptData.attempt);
      setQuestions(attemptData.questions);
      const initialAnswers = {};
      attemptData.questions.forEach((q) => {
        initialAnswers[q._id] = [];
      });
      setAnswers(initialAnswers);
      if (attemptData.timeLimitMinutes > 0) {
        setSecondsLeft(attemptData.timeLimitMinutes * 60);
      }
      setPhase('taking');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start quiz');
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (questionId, optionId) => {
    const q = questions.find((item) => String(item._id) === String(questionId));
    const isSingle = q?.type === 'single-choice' || q?.type === 'true-false';
    setAnswers((prev) => {
      const currentSelected = prev[questionId] || [];
      let next;
      if (isSingle) {
        next = [String(optionId)];
      } else {
        next = currentSelected.includes(String(optionId))
          ? currentSelected.filter((o) => o !== String(optionId))
          : [...currentSelected, String(optionId)];
      }
      return { ...prev, [questionId]: next };
    });
  };

  const handleAutoSubmit = () => {
    if (submitting) return;
    toast.info('Time is up — submitting your quiz.');
    submit();
  };

  const submit = async () => {
    if (submitting || !attempt) return;
    setSubmitting(true);
    const payload = questions.map((q) => ({
      question: q._id,
      selectedOptions: answerRef.current[q._id] || [],
    }));
    try {
      const { data } = await quizApi.submitAttempt(id, attempt._id, payload);
      setResult(data.data);
      setPhase('result');
      const att = data.data.attempt;
      try {
        const reviewRes = await quizApi.getAttempt(id, att._id);
        setReview(reviewRes.data.data);
      } catch {
        setReview(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="student">
      <button
        type="button"
        onClick={() => navigate('/student/modules')}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to syllabus
      </button>

      {phase === 'intro' && (
        <QuizIntro quiz={quiz} onStart={start} onBack={() => navigate('/student/modules')} />
      )}

      {phase === 'taking' && (
        <div className="mx-auto max-w-3xl">
          <div className="card mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{quiz.title}</h1>
              <p className="text-xs text-gray-500">
                Question {current + 1} of {questions.length}
              </p>
            </div>
            {secondsLeft !== null && (
              <span
                className={`rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${
                  secondsLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}
                aria-label="Time remaining"
              >
                {fmt(secondsLeft)}
              </span>
            )}
          </div>

          <div className="card mb-4">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              {questions[current]?.questionText}
            </h2>
            {questions[current]?.imageUrl && (
              <img
                src={questions[current].imageUrl}
                alt="Question"
                className="mb-4 max-h-60 rounded-lg"
              />
            )}
            <div
              className="space-y-2"
              role={
                questions[current]?.type === 'single-choice' || questions[current]?.type === 'true-false'
                  ? 'radiogroup'
                  : 'group'
              }
              aria-label={`Question ${current + 1} options`}
            >
              {questions[current]?.options.map((option) => {
                const selected = (answers[questions[current]?._id] || []).includes(String(option._id));
                return (
                  <label
                    key={option._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type={
                        questions[current]?.type === 'single-choice' ||
                        questions[current]?.type === 'true-false'
                          ? 'radio'
                          : 'checkbox'
                      }
                      checked={selected}
                      onChange={() => toggleOption(questions[current]._id, option._id)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-800">{option.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-secondary" onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit quiz'}
              </button>
              {current < questions.length - 1 && (
                <button type="button" className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <QuizResult result={result} review={review} quiz={quiz} onRetry={() => window.location.reload()} onBack={() => navigate('/student/modules')} />
      )}

      {phase === 'result' && result && (
        <div className="mx-auto mt-4 max-w-3xl">
          <FeedbackForm targetType="quiz" targetId={quiz?._id} />
        </div>
      )}
    </DashboardLayout>
  );
};

const QuizIntro = ({ quiz, onStart, onBack }) => {
  const noAttempts = quiz.attemptsRemaining === 0;
  return (
    <div className="card mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
      <p className="mt-2 text-sm text-gray-600">{quiz.description || 'Test your understanding of this module.'}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoBox label="Questions" value={quiz.questions?.length || 0} />
        <InfoBox label="Time limit" value={quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} min` : 'None'} />
        <InfoBox label="Pass mark" value={`${quiz.passMarkPercent}%`} />
        <InfoBox label="Attempts left" value={quiz.attemptsRemaining} />
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">Grading rule:</p>
        <p className="mt-1">{quiz.gradingRule}</p>
        <p className="mt-2">
          {quiz.timeLimitMinutes > 0
            ? 'The quiz auto-submits when the timer runs out.'
            : 'There is no time limit on this quiz.'}{' '}
          Your answers are saved automatically.
        </p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Not yet
        </button>
        <button type="button" className="btn-primary" onClick={onStart} disabled={noAttempts}>
          {noAttempts ? 'No attempts remaining' : 'Start quiz'}
        </button>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }) => (
  <div className="rounded-lg bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
    <div className="text-xl font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const QuizResult = ({ result, review, quiz, onRetry, onBack }) => {
  const attempt = result.attempt;
  const passed = attempt.passed;
  return (
    <div className="mx-auto max-w-3xl">
      <div className={`card mb-6 text-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black ${
            passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {attempt.percentage}%
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {passed ? 'Congratulations — You passed!' : 'Not this time — keep practising!'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {quiz.title} · Score {attempt.score} / {attempt.totalPoints} · Pass mark {attempt.passMarkPercent}% ·
          Duration {Math.round(attempt.durationSeconds / 60)} min
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back to syllabus
          </button>
          {!passed && (
            <button type="button" className="btn-primary" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </div>

      {review && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Answer review</h2>
          {review.review.map((item, index) => (
            <div key={index} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {index + 1}. {item.question}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.points} pt(s) ·{' '}
                    {item.type === 'single-choice' ? 'Single choice' : item.type === 'multiple-choice' ? 'Multiple choice' : 'True/False'}
                  </p>
                </div>
                {item.options.some((o) => o.selected && o.isCorrect) &&
                !item.options.some((o) => o.selected && !o.isCorrect) &&
                item.options.filter((o) => o.selected).length === item.options.filter((o) => o.isCorrect).length ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Correct
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    Incorrect
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                {item.options.map((o, oi) => (
                  <div
                    key={oi}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      o.selected && o.isCorrect
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : o.selected && !o.isCorrect
                          ? 'border-red-200 bg-red-50 text-red-800'
                          : o.isCorrect
                            ? 'border-green-100 bg-green-50/50 text-green-700'
                            : 'border-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-mono text-xs">
                      {o.selected ? '✓ your pick' : o.isCorrect ? '★ correct' : ''}
                    </span>
                    <span>{o.text}</span>
                  </div>
                ))}
              </div>
              {item.explanation && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="font-semibold">Explanation:</span> {item.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizView;
