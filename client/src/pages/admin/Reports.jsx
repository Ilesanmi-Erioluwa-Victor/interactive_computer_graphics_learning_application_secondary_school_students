import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { userApi } from '../../api/users.js';

const PIE_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports = () => {
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
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!stats) return null;

  const userPie = [
    { name: 'Students', value: stats.activeStudents },
    { name: 'Teachers', value: stats.teachers },
    { name: 'Admins', value: Math.max(0, stats.totalUsers - stats.activeStudents - stats.teachers) },
  ].filter((d) => d.value > 0);

  const moduleChart = (stats.modulePerformance || []).map((m) => ({
    name: (m.moduleTitle || m.quizTitle || 'Module').split(' ').slice(0, 3).join(' '),
    'Avg score': Math.round(m.avgScore || 0),
    'Attempts': m.attempts,
  }));

  const attemptPie = [
    { name: 'Passed', value: Math.round((stats.avgPassRate / 100) * stats.attempts) },
    { name: 'Failed', value: stats.attempts - Math.round((stats.avgPassRate / 100) * stats.attempts) },
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout role="admin">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total users" value={stats.totalUsers} />
        <Stat label="Quiz attempts" value={stats.attempts} />
        <Stat label="Average score" value={`${stats.avgScore}%`} />
        <Stat label="Average pass rate" value={`${stats.avgPassRate}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Users by role</h2>
          {userPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={userPie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {userPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No user data yet.</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quiz outcomes</h2>
          {attemptPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={attemptPie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {attemptPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i + 1 % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No quiz attempts yet.</p>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Module performance (avg score)</h2>
          {moduleChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={moduleChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Avg score" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Attempts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No quiz performance data yet.</p>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Most-viewed modules</h2>
          {stats.mostViewedModules?.length > 0 ? (
            <div className="space-y-3">
              {stats.mostViewedModules.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {i + 1}. {m.title}
                  </span>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    {m.views} view(s)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No module activity yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const Stat = ({ label, value }) => (
  <div className="card">
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
  </div>
);

export default Reports;
