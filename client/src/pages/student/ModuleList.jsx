import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { lessonApi } from '../../api/lessons.js';
import { quizApi } from '../../api/quizzes.js';

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const [{ data: modData }, { data: quizData }] = await Promise.all([
        lessonApi.getModules(),
        quizApi.getQuizzes(),
      ]);
      setModules(modData.data);
      setQuizzes(quizData.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Syllabus</h1>
        <p className="text-sm text-gray-500">Your Computer Graphics learning modules</p>
      </div>

      {modules.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">
            No modules have been published for your class yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <div key={module._id} className="card">
              <div className="mb-4 flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
                  {moduleIndex + 1}
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{module.title}</h2>
                  {module.description && (
                    <p className="text-sm text-gray-500">{module.description}</p>
                  )}
                </div>
              </div>

              {module.lessons?.length > 0 ? (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {module.lessons.map((lesson) => (
                    <button
                      key={lesson._id}
                      type="button"
                      onClick={() => navigate(`/student/lessons/${lesson._id}`)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {lesson.order + 1}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{lesson.title}</div>
                          <div className="text-xs text-gray-500">
                            ~{lesson.estimatedMinutes || 10} min
                            {lesson.interactiveType !== 'none' && ' · Interactive'}
                          </div>
                        </div>
                      </div>
                      <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No lessons published in this module yet.</p>
              )}

              {quizzes.filter((q) => String(q.module) === String(module._id)).length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Quizzes
                  </div>
                  <div className="divide-y divide-gray-100 rounded-lg border border-purple-100">
                    {quizzes
                      .filter((q) => String(q.module) === String(module._id))
                      .map((quiz) => (
                        <button
                          key={quiz._id}
                          type="button"
                          onClick={() => navigate(`/student/quizzes/${quiz._id}`)}
                          className="flex w-full items-center justify-between gap-4 bg-purple-50/50 px-4 py-3 text-left transition-colors hover:bg-purple-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                              Q
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-800">{quiz.title}</div>
                              <div className="text-xs text-gray-500">
                                {quiz.timeLimitMinutes > 0
                                  ? `${quiz.timeLimitMinutes} min limit`
                                  : 'No time limit'}{' '}
                                · pass mark {quiz.passMarkPercent}%
                              </div>
                              {quiz.attemptsUsed > 0 && (
                                <span
                                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    quiz.passed
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  Taken {quiz.attemptsUsed}× · Best {quiz.bestScore}% ·{' '}
                                  {quiz.passed ? 'Passed' : 'Not passed'}
                                </span>
                              )}
                            </div>
                          </div>
                          <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
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

export default ModuleList;
