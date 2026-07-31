import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { classApi } from '../../api/classes.js';
import { progressApi } from '../../api/progress.js';

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await classApi.getMyClasses();
      setClasses(data.data);
      const summaryMap = {};
      await Promise.all(
        data.data.map(async (c) => {
          try {
            const res = await progressApi.getClassSummary(c._id);
            summaryMap[c._id] = res.data.data;
          } catch {
            summaryMap[c._id] = { students: [] };
          }
        })
      );
      setSummaries(summaryMap);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const totalStudents = classes.reduce((s, c) => s + (c.studentCount || 0), 0);
  const allStudents = Object.values(summaries).flatMap((s) => s.students || []);
  const avgProgress =
    allStudents.length > 0
      ? Math.round(allStudents.reduce((s, st) => s + st.percentage, 0) / allStudents.length)
      : 0;
  const fallingBehind = allStudents.filter((s) => s.percentage < 30);

  return (
    <DashboardLayout role="teacher">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Teacher Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My classes" value={classes.length} color="bg-primary-50 text-primary-700" />
        <StatCard label="Students" value={totalStudents} color="bg-green-50 text-green-700" />
        <StatCard label="Avg progress" value={`${avgProgress}%`} color="bg-indigo-50 text-indigo-700" />
        <StatCard label="Falling behind (<30%)" value={fallingBehind.length} color="bg-amber-50 text-amber-700" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => navigate('/teacher/modules')}>
          Manage lessons & modules
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/classes')}>
          Manage classes
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/students')}>
          Student progress
        </button>
      </div>

      <div className="space-y-6">
        {classes.length === 0 && (
          <div className="card text-center">
            <p className="text-gray-500">You have no classes yet. Create one to add students.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => navigate('/teacher/classes')}>
              Create a class
            </button>
          </div>
        )}

        {classes.map((klass) => {
          const summary = summaries[klass._id];
          const students = summary?.students || [];
          return (
            <div key={klass._id} className="card">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{klass.name}</h2>
                  <p className="text-xs text-gray-500">
                    Class code: <span className="font-mono font-semibold">{klass.classCode}</span> ·{' '}
                    {students.length} student(s)
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/teacher/classes')}
                >
                  View class
                </button>
              </div>

              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                        <th className="py-2 pr-3 font-medium">Student</th>
                        <th className="px-3 py-2 font-medium">Progress</th>
                        <th className="px-3 py-2 font-medium">Completed</th>
                        <th className="px-3 py-2 font-medium">Last quiz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.slice(0, 10).map((s) => (
                        <tr key={s.studentId} className="hover:bg-gray-50">
                          <td className="py-2.5 pr-3 font-medium text-gray-800">{s.fullName}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-primary-600"
                                  style={{ width: `${s.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{s.percentage}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {s.completedLessons}/{s.totalLessons}
                          </td>
                          <td className="px-3 py-2.5">
                            {s.lastQuizScore !== null ? (
                              <span className={s.lastQuizPassed ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                                {s.lastQuizScore}%
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No students have joined this class yet. Share the class code with them.
                </p>
              )}
            </div>
          );
        })}
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
