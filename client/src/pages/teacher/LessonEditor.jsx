import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/common/DashboardLayout.jsx';
import Loader from '../../components/common/Loader.jsx';
import { lessonApi } from '../../api/lessons.js';

const INTERACTIVE_TYPES = [
  { value: 'none', label: 'None (text only)' },
  { value: 'canvas-shapes', label: 'Canvas — Shape Drawing' },
  { value: 'canvas-color', label: 'Canvas — Color Mixer' },
  { value: 'canvas-transform', label: 'Canvas — 2D Transformations' },
];

const CONFIG_PRESETS = {
  'canvas-shapes': {
    shapes: ['line', 'rectangle', 'circle', 'polygon'],
    tolerance: 15,
    practiceMode: true,
  },
  'canvas-color': {
    swatchColor: '#ff6633',
    showHex: true,
    showRgb: true,
  },
  'canvas-transform': {
    shape: 'rectangle',
    startX: 120,
    startY: 120,
    width: 100,
    height: 60,
    showMatrix: true,
  },
};

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'blockquote', 'code-block'],
    ['clean'],
  ],
};

const LessonEditor = () => {
  const { id, moduleId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    mediaAssets: [],
    interactiveType: 'none',
    interactiveConfig: {},
    order: 0,
    estimatedMinutes: 10,
    isPublished: false,
  });
  const [configText, setConfigText] = useState('{}');

  const configJson = useMemo(() => {
    try {
      return JSON.parse(configText);
    } catch {
      return null;
    }
  }, [configText]);

  useEffect(() => {
    if (isEditing) {
      loadLesson();
    }
  }, [id]);

  const loadLesson = async () => {
    try {
      const { data } = await lessonApi.getLesson(id);
      const lesson = data.data;
      setForm({
        title: lesson.title,
        content: lesson.content || '',
        mediaAssets: lesson.mediaAssets || [],
        interactiveType: lesson.interactiveType || 'none',
        interactiveConfig: lesson.interactiveConfig || {},
        order: lesson.order || 0,
        estimatedMinutes: lesson.estimatedMinutes || 10,
        isPublished: lesson.isPublished || false,
      });
      setConfigText(JSON.stringify(lesson.interactiveConfig || {}, null, 2));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lesson');
      navigate('/teacher/modules');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    const preset = CONFIG_PRESETS[type] || {};
    setForm((f) => ({ ...f, interactiveType: type }));
    setConfigText(JSON.stringify(preset, null, 2));
  };

  const handleSave = async (publish) => {
    if (!form.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    if (form.interactiveType !== 'none' && !configJson) {
      toast.error('Interactive config is not valid JSON');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      content: form.content,
      mediaAssets: form.mediaAssets,
      interactiveType: form.interactiveType,
      interactiveConfig: form.interactiveType === 'none' ? {} : configJson,
      order: Number(form.order) || 0,
      estimatedMinutes: Number(form.estimatedMinutes) || 10,
      isPublished: publish,
    };
    try {
      if (isEditing) {
        await lessonApi.updateLesson(id, payload);
      } else {
        const { data } = await lessonApi.createLesson(moduleId, payload);
        navigate(`/teacher/lessons/${data.data._id}/edit`, { replace: true });
      }
      toast.success(`Lesson ${publish ? 'published' : 'saved as draft'}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!id) {
      toast.error('Save the lesson first before uploading media');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caption', '');
    const isVideo = file.type.startsWith('video/');
    fd.append('mediaType', isVideo ? 'video' : 'image');
    try {
      const { data } = await lessonApi.uploadMedia(id, fd);
      setForm((f) => ({ ...f, mediaAssets: data.data }));
      toast.success('Media uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = async (index) => {
    const updated = form.mediaAssets.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, mediaAssets: updated }));
    try {
      await lessonApi.updateLesson(id, { mediaAssets: updated });
      toast.success('Media removed');
    } catch {
      toast.error('Failed to remove media');
    }
  };

  if (loading) return <Loader />;

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Lesson' : 'New Lesson'}
        </h1>
        <p className="text-sm text-gray-500">
          Write content, attach media, and optionally add an interactive canvas tutorial.
        </p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="label-field">
                Lesson title
              </label>
              <input
                id="title"
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Drawing Lines and Shapes"
                required
              />
            </div>
            <div>
              <label htmlFor="order" className="label-field">
                Order
              </label>
              <input
                id="order"
                type="number"
                className="input-field"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="minutes" className="label-field">
                Estimated minutes
              </label>
              <input
                id="minutes"
                type="number"
                min="1"
                max="480"
                className="input-field"
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <label className="label-field">Lesson content (rich text)</label>
          <div className="ql-container-visible">
            <ReactQuill
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              modules={modules}
              placeholder="Write the lesson body here..."
              theme="snow"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Media</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {form.mediaAssets.map((asset, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg border border-gray-200">
                {asset.type === 'video' ? (
                  <video src={asset.url} className="h-32 w-full object-cover" muted controls />
                ) : (
                  <img src={asset.url} alt={asset.caption || 'media'} className="h-32 w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute right-1 top-1 rounded bg-red-600 p-1 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                  aria-label="Remove media"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label
              htmlFor="media-upload"
              className="btn-secondary inline-flex cursor-pointer"
            >
              {uploading ? 'Uploading...' : '+ Upload image / video (max 10MB)'}
              <input
                id="media-upload"
                type="file"
                className="sr-only"
                onChange={handleUpload}
                accept="image/*,video/*"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Save the lesson before uploading. Images/JPEG/PNG/GIF/WebP/SVG, videos MP4/WebM/MOV.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Interactive Tutorial</h2>
          <label htmlFor="interactiveType" className="label-field">
            Interactive type
          </label>
          <select
            id="interactiveType"
            className="input-field"
            value={form.interactiveType}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {INTERACTIVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {form.interactiveType !== 'none' && (
            <div className="mt-4">
              <label htmlFor="configText" className="label-field">
                Interactive config (JSON)
              </label>
              <textarea
                id="configText"
                rows={8}
                className="input-field font-mono text-xs"
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
              />
              {!configJson && (
                <p className="mt-1 text-xs text-red-600">Config is not valid JSON.</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                The canvas component receives these parameters. See the preset for reference.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button type="button" className="btn-primary" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving...' : 'Save & publish'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonEditor;
