import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Class from '../models/Class.js';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import notifyUsers from '../utils/notify.js';

const TEACHER_OR_ADMIN = ['teacher', 'admin'];

const isOwner = (doc, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'teacher') {
    return doc.createdBy && String(doc.createdBy) === String(user._id);
  }
  return false;
};

const assertCanModify = (doc, user) => {
  if (!doc) throw new ApiError(404, 'Resource not found');
  if (!isOwner(doc, user)) {
    throw new ApiError(403, 'You can only manage content you created');
  }
};

const getStudentTeacherIds = async (studentId) => {
  const classes = await Class.find({ students: studentId });
  const teacherIds = classes.map((c) => c.teacher).filter(Boolean);
  return teacherIds;
};

const getStudentClassIds = async (studentId) => {
  const classes = await Class.find({ students: studentId });
  return classes.map((c) => c._id);
};

const isModuleVisibleToStudent = (module, teacherIds, classIds) => {
  if (module.createdBy === null) return true;
  const teacherMatch = teacherIds.some((t) => String(t) === String(module.createdBy));
  if (!teacherMatch) return false;
  if (!module.targetClasses || module.targetClasses.length === 0) return true;
  return module.targetClasses.some((c) => classIds.some((cid) => String(cid) === String(c)));
};

const sanitizeTargetClasses = (value, user) => {
  if (value === undefined) return value;
  if (!Array.isArray(value)) throw new ApiError(400, 'targetClasses must be an array of class ids');
  return [...new Set(value.map((v) => String(v)))];
};

const createModule = async (req, res, next) => {
  try {
    const { title, description, order, coverImageUrl, isPublished, isSequential } = req.body;
    const targetClasses = sanitizeTargetClasses(req.body.targetClasses, req.user);
    const module = await Module.create({
      title,
      description: description || '',
      order: order || 0,
      coverImageUrl: coverImageUrl || '',
      isPublished: !!isPublished,
      isSequential: !!isSequential,
      createdBy: req.user._id,
      targetClasses,
    });
    return sendSuccess(res, 201, module, 'Module created');
  } catch (error) {
    return next(error);
  }
};

const getModules = async (req, res, next) => {
  try {
    let modules;
    if (req.user.role === 'student') {
      const teacherIds = await getStudentTeacherIds(req.user._id);
      const classIds = await getStudentClassIds(req.user._id);
      const adminModule = await Module.find({
        isPublished: true,
        archived: false,
        createdBy: { $in: [null, req.user._id] },
      }).sort({ order: 1 });
      const teacherModules = await Module.find({
        isPublished: true,
        archived: false,
        createdBy: { $in: teacherIds },
      }).sort({ order: 1 });
      const seen = new Set();
      modules = [...adminModule, ...teacherModules]
        .filter((m) => isModuleVisibleToStudent(m, teacherIds, classIds))
        .filter((m) => {
          if (seen.has(String(m._id))) return false;
          seen.add(String(m._id));
          return true;
        });
    } else {
      modules = await Module.find({ archived: false }).sort({ order: 1 });
    }

    const modulesWithLessons = await Promise.all(
      modules.map(async (m) => {
        const lessons = await Lesson.find({
          module: m._id,
          archived: false,
          ...(req.user.role === 'student' ? { isPublished: true } : {}),
        }).sort({ order: 1 });
        return { ...m.toObject(), lessons };
      })
    );

    return sendSuccess(res, 200, modulesWithLessons, 'Modules fetched');
  } catch (error) {
    return next(error);
  }
};

const getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await Module.findOne({ _id: id, archived: false });
    if (!module) throw new ApiError(404, 'Module not found');

    if (req.user.role === 'student') {
      if (!module.isPublished) throw new ApiError(403, 'This module is not published');
      const teacherIds = await getStudentTeacherIds(req.user._id);
      const classIds = await getStudentClassIds(req.user._id);
      if (!isModuleVisibleToStudent(module, teacherIds, classIds)) {
        throw new ApiError(403, 'This module is not assigned to your class');
      }
    }

    const lessons = await Lesson.find({
      module: module._id,
      archived: false,
      ...(req.user.role === 'student' ? { isPublished: true } : {}),
    }).sort({ order: 1 });

    return sendSuccess(res, 200, { ...module.toObject(), lessons }, 'Module fetched');
  } catch (error) {
    return next(error);
  }
};

const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await Module.findById(id);
    assertCanModify(module, req.user);

    const allowed = ['title', 'description', 'order', 'coverImageUrl', 'isPublished', 'isSequential'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) module[field] = req.body[field];
    });
    const targetClasses = sanitizeTargetClasses(req.body.targetClasses, req.user);
    if (targetClasses !== undefined) module.targetClasses = targetClasses;
    await module.save();
    return sendSuccess(res, 200, module, 'Module updated');
  } catch (error) {
    return next(error);
  }
};

const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await Module.findById(id);
    assertCanModify(module, req.user);

    module.archived = true;
    await module.save();

    await Lesson.updateMany({ module: module._id }, { $set: { archived: true } });

    return sendSuccess(res, 200, null, 'Module archived. Student history is preserved.');
  } catch (error) {
    return next(error);
  }
};

const reorderLessons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await Module.findById(id);
    assertCanModify(module, req.user);

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'items array is required');
    }

    const bulkOps = items.map(({ id: lessonId, order }) => ({
      updateOne: {
        filter: { _id: lessonId, module: module._id },
        update: { $set: { order } },
      },
    }));
    await Lesson.bulkWrite(bulkOps);
    return sendSuccess(res, 200, null, 'Lesson order updated');
  } catch (error) {
    return next(error);
  }
};

const createLesson = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId);
    assertCanModify(module, req.user);

    const {
      title,
      content,
      mediaAssets,
      interactiveType,
      interactiveConfig,
      order,
      estimatedMinutes,
      isPublished,
    } = req.body;

    const lesson = await Lesson.create({
      module: module._id,
      title,
      content: content || '',
      mediaAssets: mediaAssets || [],
      interactiveType: interactiveType || 'none',
      interactiveConfig: interactiveConfig || {},
      order: order || 0,
      estimatedMinutes: estimatedMinutes || 10,
      isPublished: !!isPublished,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, lesson, 'Lesson created');
  } catch (error) {
    return next(error);
  }
};

const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, archived: false }).populate('module');
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    if (req.user.role === 'student') {
      if (!lesson.isPublished || !lesson.module?.isPublished) {
        throw new ApiError(403, 'This lesson is not available');
      }
      const teacherIds = await getStudentTeacherIds(req.user._id);
      const classIds = await getStudentClassIds(req.user._id);
      if (!isModuleVisibleToStudent(lesson.module, teacherIds, classIds)) {
        throw new ApiError(403, 'This lesson is not assigned to your class');
      }
    }

    return sendSuccess(res, 200, lesson, 'Lesson fetched');
  } catch (error) {
    return next(error);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    assertCanModify(lesson, req.user);

    const wasPublished = lesson.isPublished;

    const allowed = [
      'title',
      'content',
      'mediaAssets',
      'interactiveType',
      'interactiveConfig',
      'order',
      'estimatedMinutes',
      'isPublished',
      'module',
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) lesson[field] = req.body[field];
    });
    await lesson.save();

    if (!wasPublished && lesson.isPublished && lesson.module) {
      const module = await Module.findById(lesson.module);
      let classes;
      if (module.targetClasses && module.targetClasses.length > 0) {
        classes = await Class.find({ _id: { $in: module.targetClasses } });
      } else {
        classes = await Class.find({ teacher: req.user._id });
      }
      const studentIds = [...new Set(classes.flatMap((c) => c.students || []))];
      await notifyUsers({
        users: studentIds,
        message: `New lesson published: "${lesson.title}"${module ? ` in ${module.title}` : ''}`,
        type: 'new-lesson',
        link: `/student/lessons/${lesson._id}`,
      });
    }

    return sendSuccess(res, 200, lesson, 'Lesson updated');
  } catch (error) {
    return next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    assertCanModify(lesson, req.user);

    lesson.archived = true;
    await lesson.save();
    return sendSuccess(res, 200, null, 'Lesson archived');
  } catch (error) {
    return next(error);
  }
};

const uploadLessonMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    assertCanModify(lesson, req.user);

    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const { caption, mediaType } = req.body;
    const type = ['image', 'video', 'diagram'].includes(mediaType) ? mediaType : 'image';

    const apiBase = process.env.API_BASE_URL || 'http://localhost:5000';
    let url = `${apiBase}/uploads/${req.file.filename}`;
    if (cloudinary) {
      try {
        const folder = 'icgla/lessons';
        const resource = await cloudinary.uploader.upload(req.file.path, {
          folder,
          resource_type: type === 'video' ? 'video' : 'image',
        });
        url = resource.secure_url;
      } catch (cloudinaryError) {
        console.warn(
          `[MEDIA] Cloudinary upload failed, falling back to local storage: ${cloudinaryError.message}`
        );
      }
    }

    lesson.mediaAssets.push({ type, url, caption: caption || '' });
    await lesson.save();

    return sendSuccess(res, 201, lesson.mediaAssets, 'Media uploaded');
  } catch (error) {
    return next(error);
  }
};

export {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  reorderLessons,
  createLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  uploadLessonMedia,
};
