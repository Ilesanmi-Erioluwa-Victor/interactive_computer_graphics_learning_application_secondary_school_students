import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { classApi } from '../../api/classes.js';

const ClassRoster = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [className, setClassName] = useState('');
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);

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

  const openEdit = (klass) => {
    setEditingClass(klass);
    setNewName(klass.name);
    setShowEdit(true);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Class name is required');
      return;
    }
    setRenaming(true);
    try {
      await classApi.updateClass(editingClass._id, { name: newName.trim() });
      toast.success('Class renamed');
      setShowEdit(false);
      setEditingClass(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rename class');
    } finally {
      setRenaming(false);
    }
  };

  const openStudents = async (klass) => {
    setSelected(klass);
    setShowStudents(true);
    try {
      const { data } = await classApi.getClassStudents(klass._id);
      setStudents(data.data.students || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load students');
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

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.info(`Class code ${code} copied`);
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-500">
            Share your class code with students so they can join.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
          + New class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No classes yet. Create your first class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {classes.map((klass) => (
            <div key={klass._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{klass.name}</h2>
                  <p className="text-sm text-gray-500">{klass.studentCount} student(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(klass.classCode)}
                  className="rounded-lg border border-dashed border-primary-300 bg-primary-50 px-3 py-1.5 font-mono text-sm font-bold text-primary-700 hover:bg-primary-100"
                  title="Click to copy class code"
                >
                  {klass.classCode}
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => openStudents(klass)}>
                  View students
                </button>
                <button type="button" className="btn-secondary" onClick={() => copyCode(klass.classCode)}>
                  Copy code
                </button>
                <button type="button" className="btn-secondary" onClick={() => openEdit(klass)}>
                  Rename
                </button>
              </div>
            </div>
          ))}
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
              placeholder="e.g. SS2 Computer Graphics"
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

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Rename class">
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label htmlFor="newName" className="label-field">
              Class name
            </label>
            <input
              id="newName"
              className="input-field"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. SS2 Computer Graphics"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={renaming}>
              {renaming ? 'Saving...' : 'Save name'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showStudents}
        onClose={() => setShowStudents(false)}
        title={`${selected?.name || ''} — Roster`}
      >
        <p className="mb-3 text-sm text-gray-500">
          Class code: <span className="font-mono font-semibold">{selected?.classCode}</span> — share
          this with students to let them join.
        </p>
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">No students have joined this class yet.</p>
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

export default ClassRoster;
