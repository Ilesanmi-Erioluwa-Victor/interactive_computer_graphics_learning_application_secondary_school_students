import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { userApi } from '../../api/users.js';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await userApi.getReportsOverview();
      setStats(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!stats) return null;

  const cards = [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Active students', value: stats.activeStudents },
    { label: 'Teachers', value: stats.teachers, sub: `${stats.pendingTeachers} pending` },
    { label: 'Classes', value: stats.classes },
    { label: 'Published lessons', value: stats.lessonsPublished },
    { label: 'Published quizzes', value: stats.quizzes },
    { label: 'Quiz attempts', value: stats.attempts },
    { label: 'Avg pass rate', value: `${stats.avgPassRate}%` },
  ];

  return (
    <DashboardLayout role="admin">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="mt-1 text-xs font-medium text-gray-500">{c.label}</div>
            {c.sub && <div className="mt-0.5 text-xs text-amber-600">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Most-viewed modules</h2>
        {stats.mostViewedModules?.length > 0 ? (
          <div className="space-y-3">
            {stats.mostViewedModules.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {i + 1}. {m.title}
                </span>
                <span className="text-gray-500">{m.views} view(s)</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No module activity yet.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
