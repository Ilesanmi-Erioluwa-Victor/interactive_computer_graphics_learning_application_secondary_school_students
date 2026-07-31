import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

const startLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, archived: false });
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    const extraSeconds = Math.min(Number(req.body.timeSpentSeconds) || 0, 60 * 60);

    let progress = await Progress.findOne({ student: req.user._id, lesson: id });
    if (!progress) {
      progress = await Progress.create({
        student: req.user._id,
        module: lesson.module,
        lesson: id,
        status: 'in-progress',
        timeSpentSeconds: extraSeconds,
        lastAccessedAt: new Date(),
      });
    } else {
      const wasCompleted = progress.status === 'completed';
      progress.timeSpentSeconds += extraSeconds;
      progress.lastAccessedAt = new Date();
      if (!wasCompleted) progress.status = 'in-progress';
      await progress.save();
    }

    return sendSuccess(res, 200, progress, 'Lesson progress updated');
  } catch (error) {
    return next(error);
  }
};

const completeLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, archived: false });
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    const extraSeconds = Math.min(Number(req.body?.timeSpentSeconds) || 0, 60 * 60);

    let progress = await Progress.findOne({ student: req.user._id, lesson: id });
    if (!progress) {
      progress = await Progress.create({
        student: req.user._id,
        module: lesson.module,
        lesson: id,
        status: 'completed',
        timeSpentSeconds: extraSeconds,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      });
    } else {
      progress.timeSpentSeconds += extraSeconds;
      progress.lastAccessedAt = new Date();
      if (progress.status !== 'completed') {
        progress.status = 'completed';
        progress.completedAt = new Date();
      }
      await progress.save();
    }

    const moduleLessons = await Lesson.countDocuments({ module: lesson.module, archived: false });
    const completedLessons = await Progress.countDocuments({
      student: req.user._id,
      module: lesson.module,
      status: 'completed',
    });

    const moduleComplete =
      moduleLessons > 0 && completedLessons >= moduleLessons;

    return sendSuccess(
      res,
      200,
      { progress, moduleComplete },
      moduleComplete
        ? 'Lesson complete — you finished this module!'
        : 'Lesson marked as complete'
    );
  } catch (error) {
    return next(error);
  }
};

const getMine = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const modules = await Module.find({ isPublished: true, archived: false }).sort({ order: 1 });
    const progressRecords = await Progress.find({ student: studentId });
    const attempts = await Attempt.find({ student: studentId })
      .sort({ submittedAt: -1 })
      .limit(20)
      .populate('quiz', 'title module archived');

    const visibleAttempts = attempts.filter((a) => a.quiz && !a.quiz.archived);

    const progressMap = new Map(
      progressRecords.map((p) => [String(p.lesson), p])
    );

    const modulesSummary = await Promise.all(
      modules.map(async (m) => {
        const lessons = await Lesson.find({ module: m._id, archived: false, isPublished: true }).sort({
          order: 1,
        });
        const total = lessons.length;
        let completed = 0;
        let timeSpent = 0;
        lessons.forEach((l) => {
          const p = progressMap.get(String(l._id));
          if (p) {
            timeSpent += p.timeSpentSeconds || 0;
            if (p.status === 'completed') completed += 1;
          }
        });
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          module: m,
          totalLessons: total,
          completedLessons: completed,
          percentage,
          timeSpentSeconds: timeSpent,
        };
      })
    );

    const totalLessons = modulesSummary.reduce((s, m) => s + m.totalLessons, 0);
    const totalCompleted = modulesSummary.reduce((s, m) => s + m.completedLessons, 0);
    const overallPercentage = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

    const allProgress = await Progress.find({ student: studentId }).sort({ lastAccessedAt: -1 });
    const recommended =
      allProgress.length > 0
        ? {
            lessonId: allProgress[0].lesson,
            lastAccessedAt: allProgress[0].lastAccessedAt,
          }
        : null;

    return sendSuccess(res, 200, {
      overallPercentage,
      totalLessons,
      totalCompleted,
      modules: modulesSummary,
      recentAttempts: visibleAttempts.map((a) => ({
        quizId: a.quiz?._id,
        quizTitle: a.quiz?.title || 'Quiz',
        percentage: a.percentage,
        passed: a.passed,
        submittedAt: a.submittedAt,
        attemptNumber: a.attemptNumber,
      })),
      recommended,
      totalTimeSpentSeconds: allProgress.reduce((s, p) => s + (p.timeSpentSeconds || 0), 0),
    }, 'Progress fetched');
  } catch (error) {
    return next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const teacherClass = await Class.findOne({
        teacher: req.user._id,
        students: id,
      });
      if (!teacherClass) {
        throw new ApiError(403, 'You can only view progress of students in your own classes');
      }
    }

    const student = await User.findById(id).select('fullName email avatarUrl school className isActive');
    if (!student) throw new ApiError(404, 'Student not found');

    const progressRecords = await Progress.find({ student: id })
      .populate('lesson', 'title order')
      .populate('module', 'title order');

    const attempts = await Attempt.find({ student: id })
      .sort({ submittedAt: -1 })
      .populate('quiz', 'title module');

    const modules = await Module.find({ isPublished: true, archived: false }).sort({ order: 1 });
    const modulesSummary = await Promise.all(
      modules.map(async (m) => {
        const lessons = await Lesson.find({ module: m._id, archived: false, isPublished: true });
        const completed = progressRecords.filter(
          (p) => String(p.module._id) === String(m._id) && p.status === 'completed'
        ).length;
        return {
          moduleId: m._id,
          moduleTitle: m.title,
          totalLessons: lessons.length,
          completedLessons: completed,
          percentage: lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0,
        };
      })
    );

    return sendSuccess(res, 200, {
      student,
      progress: progressRecords,
      modulesSummary,
      attempts,
    }, 'Student progress fetched');
  } catch (error) {
    return next(error);
  }
};

const getClassSummary = async (req, res, next) => {
  try {
    const { classId } = req.params;

    if (req.user.role !== 'admin') {
      const klass = await Class.findOne({ _id: classId, teacher: req.user._id });
      if (!klass) throw new ApiError(403, 'You can only view your own classes');
    }

    const klass = await Class.findById(classId).populate('students', 'fullName email className isActive');
    if (!klass) throw new ApiError(404, 'Class not found');

    const students = klass.students || [];
    const rows = await Promise.all(
      students.map(async (student) => {
        const progressRecords = await Progress.find({ student: student._id });
        const modules = await Module.find({ isPublished: true, archived: false }).sort({ order: 1 });
        let totalLessons = 0;
        let completedLessons = 0;
        for (const m of modules) {
          const lessons = await Lesson.find({ module: m._id, archived: false, isPublished: true });
          totalLessons += lessons.length;
          completedLessons += progressRecords.filter(
            (p) =>
              p.status === 'completed' &&
              lessons.some((l) => String(l._id) === String(p.lesson))
          ).length;
        }
        const attempts = await Attempt.find({ student: student._id })
          .sort({ submittedAt: -1 })
          .limit(1);
        return {
          studentId: student._id,
          fullName: student.fullName,
          email: student.email,
          percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          completedLessons,
          totalLessons,
          lastQuizScore: attempts[0]?.percentage ?? null,
          lastQuizPassed: attempts[0]?.passed ?? null,
        };
      })
    );

    rows.sort((a, b) => b.percentage - a.percentage);

    return sendSuccess(res, 200, {
      class: { _id: klass._id, name: klass.name, classCode: klass.classCode },
      students: rows,
    }, 'Class summary fetched');
  } catch (error) {
    return next(error);
  }
};

export { startLesson, completeLesson, getMine, getStudent, getClassSummary };
