import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { classApi } from '../../api/classes.js';

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = async () => {
    try {
      const { data } = await classApi.getMyClasses();
      setClasses(data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error('Enter the class code from your teacher');
      return;
    }
    setJoining(true);
    try {
      const { data } = await classApi.joinClass(code);
      toast.success(data.message || 'Joined class successfully');
      setCode('');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <p className="text-sm text-gray-500">
          Join a class with the code your teacher shared, and manage the classes you belong to.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Join a class</h2>
          <p className="mb-3 text-sm text-gray-500">
            Ask your teacher for the class code (e.g. <span className="font-mono font-semibold">ZS24FV</span>) and
            enter it below.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Class code"
              className="input-field uppercase"
            />
            <button type="button" className="btn-primary shrink-0" onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join class'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your classes ({classes.length})
          </h2>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-500">
              You have not joined any class yet. Use the code your teacher gave you to join.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {classes.map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.studentCount} student(s)</div>
                  </div>
                  <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700">
                    {c.classCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyClasses;
