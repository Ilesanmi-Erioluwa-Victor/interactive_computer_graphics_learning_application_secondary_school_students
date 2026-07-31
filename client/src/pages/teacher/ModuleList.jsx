import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { lessonApi } from '../../api/lessons.js';
import { quizApi } from '../../api/quizzes.js';
import { classApi } from '../../api/classes.js';

const emptyForm = { title: '', description: '', isPublished: false, targetClasses: [] };

const ClassTargetPicker = ({ classes, selected, onChange, disabled }) => (
  <div className="space-y-2">
    <label className="label-field">Visible to classes</label>
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={selected.length === 0}
        onChange={(e) => {
          if (e.target.checked) onChange([]);
        }}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-primary-600"
      />
      All my classes (current default)
    </label>
    {classes.length === 0 ? (
      <p className="text-xs text-gray-500">
        You have no classes yet. Create one under My Classes first if you want to target specific classes.
      </p>
    ) : (
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {classes.map((c) => (
          <label key={c._id} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={selected.includes(String(c._id))}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, String(c._id)]);
                } else {
                  onChange(selected.filter((id) => id !== String(c._id)));
                }
              }}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            {c.name}
          </label>
        ))}
      </div>
    )}
    {selected.length > 0 && (
      <p className="text-xs text-amber-600">
        Only students in the selected class(es) will see this module.
      </p>
    )}
  </div>
);

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadModules();
    loadQuizzes();
    loadClasses();
  }, []);

  const quizByModule = quizzes.reduce((acc, q) => {
    if (q.module) acc[String(q.module)] = q;
    return acc;
  }, {});

  const loadModules = async () => {
    try {
      const { data } = await lessonApi.getModules();
      setModules(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const { data } = await quizApi.getQuizzes();
      setQuizzes(data.data);
    } catch {
      /* quizzes are best-effort here */
    }
  };

  const loadClasses = async () => {
    try {
      const { data } = await classApi.getMyClasses();
      setClasses(data.data || []);
    } catch {
      /* classes are best-effort here */
    }
  };

  const openQuiz = (moduleId) => {
    const existing = quizByModule[String(moduleId)];
    if (existing) {
      navigate(`/teacher/quizzes/${existing._id}/edit`);
    } else {
      navigate(`/teacher/quizzes/new?module=${moduleId}`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await lessonApi.createModule(form);
      toast.success('Module created');
      setShowCreate(false);
      setForm(emptyForm);
      navigate(`/teacher/modules/${data.data._id}/lessons/new`);
      loadModules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create module');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (module) => {
    setEditing(module);
    setEditForm({
      title: module.title || '',
      description: module.description || '',
      isPublished: module.isPublished,
      targetClasses: (module.targetClasses || []).map(String),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await lessonApi.updateModule(editing._id, editForm);
      toast.success('Module updated');
      setEditing(null);
      loadModules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  const visibleClassesLabel = (module) => {
    const ids = (module.targetClasses || []).map(String);
    if (ids.length === 0) return 'All my classes';
    const names = ids
      .map((id) => classes.find((c) => String(c._id) === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : `${ids.length} class(es)`;
  };

  const handleTogglePublish = async (module) => {
    try {
      await lessonApi.updateModule(module._id, { isPublished: !module.isPublished });
      toast.success(`Module ${module.isPublished ? 'unpublished' : 'published'}`);
      loadModules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update module');
    }
  };

  const handleDelete = async (id) => {
    try {
      await lessonApi.deleteModule(id);
      toast.success('Module archived');
      setConfirmDelete(null);
      loadModules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive module');
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lessons & Modules</h1>
          <p className="text-sm text-gray-500">
            Create modules, add lessons, and publish them for your students.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
          + New Module
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No modules yet. Create your first module to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module._id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {module.coverImageUrl ? (
                    <img
                      src={module.coverImageUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{module.title}</h2>
                    <p className="text-sm text-gray-500">
                      {module.lessons?.length || 0} lesson(s) · {module.isPublished ? 'Published' : 'Unpublished'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Visible to: <span className="font-medium text-gray-500">{visibleClassesLabel(module)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(module)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openQuiz(module._id)}
                  >
                    {quizByModule[String(module._id)] ? 'Edit Quiz' : '+ Quiz'}
                  </button>
                  {quizByModule[String(module._id)] && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        quizByModule[String(module._id)].isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {quizByModule[String(module._id)].isPublished
                        ? 'Quiz published'
                        : 'Quiz draft — not visible to students'}
                    </span>
                  )}
                  <button type="button" className="btn-secondary" onClick={() => handleTogglePublish(module)}>
                    {module.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate(`/teacher/modules/${module._id}/lessons/new`)}
                  >
                    + Lesson
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmDelete(module)}
                  >
                    Archive
                  </button>
                </div>
              </div>

              {module.lessons?.length > 0 && (
                <div className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
                  {module.lessons.map((lesson) => (
                    <div key={lesson._id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {lesson.order + 1}
                        </span>
                        <Link
                          to={`/teacher/lessons/${lesson._id}/edit`}
                          className="text-sm font-medium text-gray-800 hover:text-primary-600"
                        >
                          {lesson.title}
                        </Link>
                        {lesson.interactiveType !== 'none' && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Interactive
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${lesson.isPublished ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {lesson.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create new module">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="title" className="label-field">
              Module title
            </label>
            <input
              id="title"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Introduction to Computer Graphics"
            />
          </div>
          <div>
            <label htmlFor="description" className="label-field">
              Description
            </label>
            <textarea
              id="description"
              className="input-field"
              rows={3}
              maxLength={20000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short summary of what students will learn"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {form.description.length.toLocaleString()} / 20,000
            </p>
          </div>
          <ClassTargetPicker
            classes={classes}
            selected={form.targetClasses}
            onChange={(targetClasses) => setForm({ ...form, targetClasses })}
            disabled={saving}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            Publish immediately
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create module'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit module">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="label-field">
              Module title
            </label>
            <input
              id="edit-title"
              className="input-field"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
              placeholder="e.g. Introduction to Computer Graphics"
            />
          </div>
          <div>
            <label htmlFor="edit-description" className="label-field">
              Description
            </label>
            <textarea
              id="edit-description"
              className="input-field"
              rows={3}
              maxLength={20000}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Short summary of what students will learn"
            />
          </div>
          <ClassTargetPicker
            classes={classes}
            selected={editForm.targetClasses}
            onChange={(targetClasses) => setEditForm({ ...editForm, targetClasses })}
            disabled={saving}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={editForm.isPublished}
              onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            Published (visible to students)
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Archive module"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to archive{' '}
          <strong>{confirmDelete?.title}</strong>? It will be hidden from students but student
          history is preserved.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleDelete(confirmDelete._id)}
          >
            Archive module
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ModuleList;
