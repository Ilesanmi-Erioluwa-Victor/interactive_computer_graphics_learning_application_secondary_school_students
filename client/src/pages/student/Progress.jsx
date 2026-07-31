import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { progressApi } from '../../api/progress.js';

const formatTime = (seconds) => {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.round((mins / 60) * 10) / 10;
  return `${hrs} hrs`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const StatCard = ({ label, value, color }) => (
  <div className="card">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const Progress = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data: res } = await progressApi.getMine();
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!data) return null;

  const completedModules = data.modules.filter((m) => m.totalLessons > 0 && m.percentage === 100).length;

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
        <p className="text-sm text-gray-500">Your learning overview across all modules</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Overall completion"
          value={`${data.overallPercentage}%`}
          color="text-primary-700"
        />
        <StatCard
          label="Lessons completed"
          value={`${data.totalCompleted} / ${data.totalLessons}`}
          color="text-green-700"
        />
        <StatCard
          label="Modules completed"
          value={`${completedModules} / ${data.modules.length}`}
          color="text-indigo-700"
        />
        <StatCard
          label="Time spent"
          value={formatTime(data.totalTimeSpentSeconds)}
          color="text-amber-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Modules</h2>
          {data.modules.length === 0 ? (
            <p className="text-sm text-gray-500">No content has been published for your class yet.</p>
          ) : (
            <div className="space-y-4">
              {data.modules.map((m) => (
                <div key={m.module?._id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{m.module?.title}</span>
                    <span className="text-gray-500">
                      {m.completedLessons}/{m.totalLessons} lessons · {m.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Time spent: {formatTime(m.timeSpentSeconds)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quiz attempts</h2>
          {data.recentAttempts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-3 font-medium">Quiz</th>
                    <th className="px-3 py-2 font-medium">Attempt</th>
                    <th className="px-3 py-2 font-medium">Score</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentAttempts.map((a, i) => (
                    <tr key={i} className="text-gray-700">
                      <td className="py-2.5 pr-3 font-medium text-gray-800">{a.quizTitle}</td>
                      <td className="px-3 py-2.5 text-gray-600">#{a.attemptNumber}</td>
                      <td className="px-3 py-2.5 font-semibold">{a.percentage}%</td>
                      <td
                        className={`px-3 py-2.5 font-semibold ${
                          a.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {a.passed ? 'Passed' : 'Failed'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{formatDate(a.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">You have not attempted any quizzes yet.</p>
          )}
          {data.recentAttempts?.length > 0 && (
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => navigate('/student/modules')}
            >
              Retake a quiz
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;
