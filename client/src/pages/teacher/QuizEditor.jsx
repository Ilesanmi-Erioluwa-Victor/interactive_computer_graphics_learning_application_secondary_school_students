import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { quizApi } from '../../api/quizzes.js';
import { lessonApi } from '../../api/lessons.js';

const QUESTION_TYPES = [
  { value: 'single-choice', label: 'Single choice' },
  { value: 'multiple-choice', label: 'Multiple choice' },
  { value: 'true-false', label: 'True / False' },
];

const emptyQuestion = () => ({
  _id: null,
  questionText: '',
  type: 'single-choice',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
  explanation: '',
  points: 1,
});

const QuizEditor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get('module');
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [quiz, setQuiz] = useState({
    module: '',
    title: '',
    description: '',
    timeLimitMinutes: 0,
    passMarkPercent: 50,
    maxAttempts: 3,
    shuffleQuestions: true,
    isPublished: false,
  });

  useEffect(() => {
    loadModules();
    if (isEditing) loadQuiz();
  }, [id]);

  const loadModules = async () => {
    try {
      const { data } = await lessonApi.getModules();
      setModules(data.data);
      if (!isEditing && moduleParam) {
        setQuiz((prev) => ({ ...prev, module: moduleParam }));
      }
    } catch {
      /* modules loading is best-effort here */
    }
  };

  const loadQuiz = async () => {
    try {
      const { data } = await quizApi.getQuiz(id);
      const q = data.data;
      setQuiz({
        module: q.module,
        title: q.title,
        description: q.description,
        timeLimitMinutes: q.timeLimitMinutes,
        passMarkPercent: q.passMarkPercent,
        maxAttempts: q.maxAttempts,
        shuffleQuestions: q.shuffleQuestions,
        isPublished: q.isPublished,
      });
      setQuestions(q.questions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load quiz');
      navigate('/teacher/modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!quiz.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await quizApi.updateQuiz(id, quiz);
        toast.success('Quiz settings saved');
      } else {
        if (!quiz.module) {
          toast.error('Choose a module for this quiz');
          return;
        }
        const { data } = await quizApi.createQuiz(quiz);
        navigate(`/teacher/quizzes/${data.data._id}/edit`, { replace: true });
        toast.success('Quiz created. Now add questions.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    const invalid = questions.find(
      (q) => !q.questionText.trim() || q.options.some((o) => !o.text.trim())
    );
    if (invalid) {
      toast.error('Every question needs text and all options need text');
      return;
    }
    const noCorrect = questions.find((q) => !q.options.some((o) => o.isCorrect));
    if (noCorrect) {
      toast.error('Every question must have at least one correct option');
      return;
    }
    setSaving(true);
    try {
      const { data } = await quizApi.saveQuestions(id, questions);
      setQuestions(data.data);
      toast.success('Questions saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = (q) => {
    if (!q.questionText.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (q.options.some((o) => !o.text.trim())) {
      toast.error('All options must have text');
      return;
    }
    if (!q.options.some((o) => o.isCorrect)) {
      toast.error('Mark at least one option as correct');
      return;
    }
    const clean = {
      ...q,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    };
    if (editingIndex === -1) {
      setQuestions((qs) => [...qs, clean]);
    } else {
      setQuestions((qs) => qs.map((item, i) => (i === editingIndex ? clean : item)));
    }
    setEditingIndex(null);
  };

  const removeQuestion = (index) => {
    setQuestions((qs) => qs.filter((_, i) => i !== index));
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Quiz' : 'New Quiz'}</h1>
        <p className="text-sm text-gray-500">
          Grading rule: all-or-nothing — a question earns points only when every correct option is
          selected and no incorrect option is selected.
        </p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quiz settings</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="quiz-module" className="label-field">
                Module
              </label>
              <select
                id="quiz-module"
                className="input-field"
                value={quiz.module}
                onChange={(e) => setQuiz({ ...quiz, module: e.target.value })}
                disabled={isEditing}
              >
                <option value="">Select a module</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="quiz-title" className="label-field">
                Quiz title
              </label>
              <input
                id="quiz-title"
                className="input-field"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                placeholder="e.g. Module 1 Assessment"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="quiz-desc" className="label-field">
                Description
              </label>
              <textarea
                id="quiz-desc"
                rows={2}
                className="input-field"
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="time-limit" className="label-field">
                Time limit (minutes, 0 = none)
              </label>
              <input
                id="time-limit"
                type="number"
                min="0"
                className="input-field"
                value={quiz.timeLimitMinutes}
                onChange={(e) => setQuiz({ ...quiz, timeLimitMinutes: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pass-mark" className="label-field">
                Pass mark (%)
              </label>
              <input
                id="pass-mark"
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={quiz.passMarkPercent}
                onChange={(e) => setQuiz({ ...quiz, passMarkPercent: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="max-attempts" className="label-field">
                Max attempts
              </label>
              <input
                id="max-attempts"
                type="number"
                min="1"
                max="20"
                className="input-field"
                value={quiz.maxAttempts}
                onChange={(e) => setQuiz({ ...quiz, maxAttempts: e.target.value })}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={quiz.shuffleQuestions}
                  onChange={(e) => setQuiz({ ...quiz, shuffleQuestions: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                Shuffle questions & options
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={quiz.isPublished}
                onChange={(e) => setQuiz({ ...quiz, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              Published (visible to students)
            </label>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h2>
            {isEditing && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveQuestions}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save all questions'}
              </button>
            )}
          </div>

          {!isEditing ? (
            <p className="text-sm text-gray-500">
              Save the quiz settings first, then add questions.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {index + 1}. {q.questionText}
                        </span>
                        <div className="mt-1 text-xs text-gray-500">
                          {QUESTION_TYPES.find((t) => t.value === q.type)?.label} · {q.points} pt(s)
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" className="btn-secondary" onClick={() => setEditingIndex(index)}>
                          Edit
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => removeQuestion(index)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-secondary mt-4" onClick={() => setEditingIndex(-1)}>
                + Add question
              </button>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        title={editingIndex === -1 ? 'Add question' : 'Edit question'}
      >
        <QuestionForm
          initial={editingIndex !== null && editingIndex >= 0 ? questions[editingIndex] : emptyQuestion()}
          onSave={saveQuestion}
          onCancel={() => setEditingIndex(null)}
        />
      </Modal>
    </DashboardLayout>
  );
};

const QuestionForm = ({ initial, onSave, onCancel }) => {
  const [q, setQ] = useState(() => ({ ...emptyQuestion(), ...initial }));

  const updateOption = (index, field, value) => {
    setQ((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => {
        if (i !== index) return o;
        if (field === 'isCorrect' && (q.type === 'single-choice' || q.type === 'true-false')) {
          return { ...o, isCorrect: value };
        }
        return { ...o, [field]: value };
      }),
    }));
  };

  const handleTypeChange = (type) => {
    let options = q.options;
    if (type === 'true-false') {
      options = [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ];
    }
    if (type === 'single-choice') {
      options = options.map((o) => ({ ...o, isCorrect: false }));
      if (options.length < 2) options.push({ text: '', isCorrect: false });
    }
    setQ({ ...q, type, options });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label-field">Question text</label>
        <textarea
          rows={2}
          className="input-field"
          value={q.questionText}
          onChange={(e) => setQ({ ...q, questionText: e.target.value })}
          placeholder="Type the question..."
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Type</label>
          <select
            className="input-field"
            value={q.type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Points</label>
          <input
            type="number"
            min="1"
            className="input-field"
            value={q.points}
            onChange={(e) => setQ({ ...q, points: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label-field">Options</label>
        <div className="space-y-2">
          {q.options.map((o, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={o.isCorrect}
                onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-green-600"
                aria-label={`Option ${index + 1} correct`}
              />
              <input
                className="input-field"
                value={o.text}
                onChange={(e) => updateOption(index, 'text', e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                className="shrink-0 text-gray-400 hover:text-red-600"
                onClick={() => setQ((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }))}
                aria-label="Remove option"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary mt-2"
          onClick={() => setQ((prev) => ({ ...prev, options: [...prev.options, { text: '', isCorrect: false }] }))}
          disabled={q.type === 'true-false'}
        >
          + Add option
        </button>
      </div>

      <div>
        <label className="label-field">Explanation (shown after answering)</label>
        <textarea
          rows={2}
          className="input-field"
          value={q.explanation}
          onChange={(e) => setQ({ ...q, explanation: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={() => onSave(q)}>
          Save question
        </button>
      </div>
    </div>
  );
};

export default QuizEditor;
