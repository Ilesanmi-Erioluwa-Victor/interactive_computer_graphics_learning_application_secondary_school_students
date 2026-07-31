import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { progressApi } from '../../api/progress.js';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await progressApi.getMine();
      setData(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!data) return null;

  const chartData = data.modules.map((m) => ({
    name: m.module?.title?.split(' ').slice(0, 3).join(' ') || 'Module',
    Progress: m.percentage,
  }));

  const formatTime = () => {
    const mins = Math.round((data.totalTimeSpentSeconds || 0) / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.round((mins / 60) * 10) / 10;
    return `${hrs} hrs`;
  };

  return (
    <DashboardLayout role="student">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Syllabus completed"
          value={`${data.overallPercentage}%`}
          color="text-primary-700 bg-primary-50"
        />
        <StatCard
          label="Lessons completed"
          value={`${data.totalCompleted} / ${data.totalLessons}`}
          color="text-green-700 bg-green-50"
        />
        <StatCard
          label="Time spent"
          value={formatTime()}
          color="text-indigo-700 bg-indigo-50"
        />
        <StatCard
          label="Recent quizzes"
          value={data.recentAttempts?.length || 0}
          color="text-amber-700 bg-amber-50"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Progress by module</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Progress" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No modules available yet.</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Module details</h2>
          <div className="space-y-4">
            {data.modules.length === 0 && (
              <p className="text-sm text-gray-500">No content has been published for your class.</p>
            )}
            {data.modules.map((m) => (
              <div key={m.module?._id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{m.module?.title}</span>
                  <span className="text-gray-500">
                    {m.completedLessons}/{m.totalLessons} ({m.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent quiz scores</h2>
          {data.recentAttempts?.length > 0 ? (
            <div className="space-y-2">
              {data.recentAttempts.slice(0, 5).map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50"
                  onClick={() => navigate(`/student/quizzes/${a.quizId}`)}
                >
                  <span className="text-sm font-medium text-gray-800">{a.quizTitle}</span>
                  <span className={`text-sm font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {a.percentage}% {a.passed ? '✓' : '✗'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Take a quiz to see your scores here.</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Continue learning</h2>
          {data.recommended?.lessonId ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/student/lessons/${data.recommended.lessonId}`)}
            >
              Resume your last lesson
            </button>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500">Start with the syllabus to begin learning.</p>
              <button type="button" className="btn-primary" onClick={() => navigate('/student/modules')}>
                Go to syllabus
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="card">
    <div className={`mb-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${color}`}>{label}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

export default Dashboard;
