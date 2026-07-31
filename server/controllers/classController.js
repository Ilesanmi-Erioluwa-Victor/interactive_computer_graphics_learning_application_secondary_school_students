import crypto from 'crypto';
import Class from '../models/Class.js';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

const generateClassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
};

const createClass = async (req, res, next) => {
  try {
    const { name } = req.body;

    let classCode = generateClassCode();
    let existing = await Class.findOne({ classCode });
    while (existing) {
      classCode = generateClassCode();
      existing = await Class.findOne({ classCode });
    }

    const klass = await Class.create({
      name,
      teacher: req.user.role === 'teacher' ? req.user._id : req.body.teacher || null,
      classCode,
    });

    return sendSuccess(res, 201, klass, 'Class created');
  } catch (error) {
    return next(error);
  }
};

const getMyClasses = async (req, res, next) => {
  try {
    let classes;
    if (req.user.role === 'admin') {
      classes = await Class.find().populate('teacher', 'fullName email');
    } else if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user._id });
    } else {
      classes = await Class.find({ students: req.user._id });
    }

    const withCounts = await Promise.all(
      classes.map(async (c) => ({
        ...c.toObject(),
        studentCount: c.students?.length || 0,
      }))
    );

    return sendSuccess(res, 200, withCounts, 'Classes fetched');
  } catch (error) {
    return next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const klass = await Class.findOne({ _id: id, teacher: req.user._id });
      if (!klass) throw new ApiError(403, 'You can only view your own classes');
    }

    const klass = await Class.findById(id)
      .populate('students', 'fullName email className school isActive createdAt')
      .populate('teacher', 'fullName email');

    if (!klass) throw new ApiError(404, 'Class not found');

    return sendSuccess(
      res,
      200,
      { ...klass.toObject(), students: klass.students || [] },
      'Class students fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const klass = await Class.findById(id);
    if (!klass) throw new ApiError(404, 'Class not found');

    if (req.user.role !== 'admin' && String(klass.teacher) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only edit your own classes');
    }

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) throw new ApiError(400, 'Class name is required');
      klass.name = name;
    }
    await klass.save();

    if (req.body.name && klass.students?.length > 0) {
      await User.updateMany(
        { _id: { $in: klass.students } },
        { $set: { className: klass.name } }
      );
    }

    return sendSuccess(res, 200, klass, 'Class updated');
  } catch (error) {
    return next(error);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;

    if (req.user.role !== 'admin') {
      const klass = await Class.findOne({ _id: id, teacher: req.user._id });
      if (!klass) throw new ApiError(403, 'You can only manage your own classes');
    }

    const klass = await Class.findById(id);
    if (!klass) throw new ApiError(404, 'Class not found');

    klass.students = klass.students.filter((s) => String(s) !== String(studentId));
    await klass.save();

    return sendSuccess(res, 200, null, 'Student removed from class');
  } catch (error) {
    return next(error);
  }
};

const joinClass = async (req, res, next) => {
  try {
    const { classCode } = req.body;
    if (!classCode) throw new ApiError(400, 'Class code is required');

    const klass = await Class.findOne({ classCode: classCode.toUpperCase().trim() });
    if (!klass) throw new ApiError(400, 'Invalid class code');

    const studentId = req.user._id;
    if (klass.students.includes(studentId)) {
      throw new ApiError(409, 'You are already a member of this class');
    }

    klass.students.push(studentId);
    await klass.save();

    const user = await User.findById(studentId);
    if (user) {
      user.className = klass.name;
      await user.save();
    }

    return sendSuccess(res, 200, klass, 'Joined class successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const klass = await Class.findById(id);
    if (!klass) throw new ApiError(404, 'Class not found');

    if (req.user.role !== 'admin' && String(klass.teacher) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only delete your own classes');
    }

    await Class.deleteOne({ _id: id });
    return sendSuccess(res, 200, null, 'Class deleted');
  } catch (error) {
    return next(error);
  }
};

export { createClass, getMyClasses, getClassStudents, updateClass, removeStudent, joinClass, deleteClass };
