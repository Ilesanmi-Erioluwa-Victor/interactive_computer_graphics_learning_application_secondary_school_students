import crypto from 'crypto';
import User from '../models/User.js';
import Class from '../models/Class.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerStudent = async (req, res, next) => {
  try {
    const { fullName, email, password, school, className, classCode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ApiError(409, 'An account with this email already exists'));
    }

    if (!classCode) {
      return next(new ApiError(400, 'A class code is required to register as a student'));
    }

    const foundClass = await Class.findOne({ classCode: classCode.toUpperCase().trim() });
    if (!foundClass) {
      return next(new ApiError(400, 'Invalid class code. Ask your teacher for the correct code.'));
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'student',
      school,
      className: foundClass.name,
      emailVerified: true,
      isApproved: true,
    });

    if (!foundClass.students.includes(user._id)) {
      foundClass.students.push(user._id);
      await foundClass.save();
    }

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, cookieOptions);

    sendEmail({
      to: user.email,
      subject: 'Welcome to ICGLA',
      html: `<h2>Welcome to ICGLA</h2><p>Hi ${user.fullName}, your student account has been created. You are now enrolled in ${foundClass.name}.</p>`,
    });

    return sendSuccess(res, 201, { user: user.toSafeJSON(), token, role: user.role }, 'Student registered successfully');
  } catch (error) {
    return next(error);
  }
};

const registerTeacher = async (req, res, next) => {
  try {
    const { fullName, email, password, school } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ApiError(409, 'An account with this email already exists'));
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'teacher',
      school,
      isApproved: false,
    });

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, cookieOptions);

    return sendSuccess(
      res,
      201,
      { user: user.toSafeJSON(), token, role: user.role },
      'Teacher account created. Awaiting admin approval.'
    );
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Account deactivated. Contact an administrator.'));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, cookieOptions);

    return sendSuccess(res, 200, { user: user.toSafeJSON(), token, role: user.role }, 'Login successful');
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return sendSuccess(res, 200, null, 'Logged out successfully');
};

const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, { user: req.user.toSafeJSON(), role: req.user.role }, 'User fetched');
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return sendSuccess(
        res,
        200,
        null,
        'If an account exists for that email, a reset link has been sent.'
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your ICGLA password',
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 60 minutes.</p>`,
    });

    return sendSuccess(res, 200, null, 'If an account exists for that email, a reset link has been sent.');
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(400, 'Reset token is invalid or has expired'));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendSuccess(res, 200, null, 'Password reset successful. You can now log in.');
  } catch (error) {
    return next(error);
  }
};

export { registerStudent, registerTeacher, login, logout, getMe, forgotPassword, resetPassword };
