import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { classApi } from '../../api/classes.js';
import { progressApi } from '../../api/progress.js';

const StudentProgress = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await classApi.getMyClasses();
      setClasses(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    setSelectedClass(classId);
    setSelectedStudent('');
    setDetail(null);
    if (!classId) {
      setStudents([]);
      return;
    }
    try {
      const { data } = await classApi.getClassStudents(classId);
      setStudents(data.data.students || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load students');
    }
  };

  const loadDetail = async (studentId) => {
    setSelectedStudent(studentId);
    setLoadingDetail(true);
    try {
      const { data } = await progressApi.getStudent(studentId);
      setDetail(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load student progress');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="teacher">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Student Progress</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="class-select" className="label-field">
            Select class
          </label>
          <select
            id="class-select"
            className="input-field"
            value={selectedClass}
            onChange={(e) => loadStudents(e.target.value)}
          >
            <option value="">Choose a class...</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="student-select" className="label-field">
            Select student
          </label>
          <select
            id="student-select"
            className="input-field"
            value={selectedStudent}
            onChange={(e) => loadDetail(e.target.value)}
            disabled={students.length === 0}
          >
            <option value="">Choose a student...</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingDetail && <Loader fullScreen={false} />}

      {detail && !loadingDetail && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900">{detail.student?.fullName}</h2>
            <p className="text-sm text-gray-500">
              {detail.student?.email} · {detail.student?.className || 'No class'}
            </p>
          </div>

          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Progress by module</h3>
            <div className="space-y-3">
              {detail.modulesSummary?.map((m) => (
                <div key={m.moduleId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{m.moduleTitle}</span>
                    <span className="text-gray-500">
                      {m.completedLessons}/{m.totalLessons} ({m.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Quiz attempts</h3>
            {detail.attempts?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                      <th className="py-2 pr-3 font-medium">Quiz</th>
                      <th className="px-3 py-2 font-medium">Attempt</th>
                      <th className="px-3 py-2 font-medium">Score</th>
                      <th className="px-3 py-2 font-medium">Result</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detail.attempts.map((a) => (
                      <tr key={a._id} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-3 font-medium text-gray-800">{a.quiz?.title}</td>
                        <td className="px-3 py-2.5 text-gray-600">#{a.attemptNumber}</td>
                        <td className="px-3 py-2.5 text-gray-600">{a.percentage}%</td>
                        <td className="px-3 py-2.5">
                          <span className={a.passed ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                            {a.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">This student has not taken any quizzes.</p>
            )}
          </div>
        </div>
      )}

      {!detail && !loadingDetail && (
        <div className="card text-center">
          <p className="text-gray-500">Select a class and a student to view their progress.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentProgress;
