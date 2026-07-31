import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { classApi } from '../../api/classes.js';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [className, setClassName] = useState('');
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [showRoster, setShowRoster] = useState(false);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      toast.error('Class name is required');
      return;
    }
    setCreating(true);
    try {
      await classApi.createClass({ name: className });
      toast.success('Class created');
      setShowCreate(false);
      setClassName('');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const openRoster = async (klass) => {
    setSelected(klass);
    setShowRoster(true);
    try {
      const { data } = await classApi.getClassStudents(klass._id);
      setStudents(data.data.students || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load roster');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await classApi.removeStudent(selected._id, studentId);
      toast.success('Student removed');
      setStudents((s) => s.filter((st) => st._id !== studentId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleDeleteClass = async (klass) => {
    if (!window.confirm(`Delete class "${klass.name}"? This cannot be undone.`)) return;
    try {
      await classApi.deleteClass(klass._id);
      toast.success('Class deleted');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete class');
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-sm text-gray-500">Create and manage all classes in the system.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
          + New class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No classes yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-medium">Class</th>
                <th className="px-3 py-2 font-medium">Teacher</th>
                <th className="px-3 py-2 font-medium">Class code</th>
                <th className="px-3 py-2 font-medium">Students</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classes.map((klass) => (
                <tr key={klass._id} className="hover:bg-gray-50">
                  <td className="py-3 pr-3 font-medium text-gray-800">{klass.name}</td>
                  <td className="px-3 py-3 text-gray-600">{klass.teacher?.fullName || 'Unassigned'}</td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-primary-50 px-2 py-1 font-mono text-xs font-bold text-primary-700">
                      {klass.classCode}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{klass.studentCount || 0}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary" onClick={() => openRoster(klass)}>
                        Roster
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteClass(klass)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create new class">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="className" className="label-field">
              Class name
            </label>
            <input
              id="className"
              className="input-field"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. SS1 Basic Science"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create class'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showRoster}
        onClose={() => setShowRoster(false)}
        title={`${selected?.name || ''} — Roster`}
      >
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">No students in this class.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.map((s) => (
              <li key={s._id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium text-gray-800">{s.fullName}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveStudent(s._id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default ClassManagement;
