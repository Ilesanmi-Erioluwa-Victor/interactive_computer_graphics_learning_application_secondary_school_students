import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Module from '../models/Module.js';
import Class from '../models/Class.js';
import ApiError from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import notifyUsers from '../utils/notify.js';
import gradeQuiz from '../utils/gradeQuiz.js';

const isOwner = (doc, user) => {
  if (user.role === 'admin') return true;
  return doc && String(doc.createdBy) === String(user._id);
};

const assertCanModify = (doc, user) => {
  if (!doc) throw new ApiError(404, 'Resource not found');
  if (!isOwner(doc, user)) throw new ApiError(403, 'You can only manage content you created');
};

const isQuizAssigned = async (moduleId, studentId) => {
  const module = await Module.findById(moduleId);
  if (!module || !module.isPublished) return false;
  const classes = await Class.find({ students: studentId });
  const teacherIds = classes.map((c) => c.teacher).filter(Boolean);
  const teacherMatch =
    module.createdBy === null || teacherIds.some((t) => String(t) === String(module.createdBy));
  if (!teacherMatch) return false;
  if (!module.targetClasses || module.targetClasses.length === 0) return true;
  const classIds = classes.map((c) => c._id);
  return module.targetClasses.some((c) => classIds.some((cid) => String(cid) === String(c)));
};

const createQuiz = async (req, res, next) => {
  try {
    const module = await Module.findById(req.body.module);
    assertCanModify(module, req.user);

    const {
      module: moduleId,
      lesson,
      title,
      description,
      timeLimitMinutes,
      passMarkPercent,
      maxAttempts,
      shuffleQuestions,
      isPublished,
    } = req.body;

    const quiz = await Quiz.create({
      module: moduleId,
      lesson: lesson || null,
      title,
      description: description || '',
      timeLimitMinutes: timeLimitMinutes || 0,
      passMarkPercent: passMarkPercent ?? 50,
      maxAttempts: maxAttempts || 3,
      shuffleQuestions: shuffleQuestions ?? true,
      isPublished: !!isPublished,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, quiz, 'Quiz created');
  } catch (error) {
    return next(error);
  }
};

const getQuizzes = async (req, res, next) => {
  try {
    let quizzes;
    if (req.user.role === 'student') {
      quizzes = await Quiz.find({ isPublished: true, archived: false });
      const assigned = [];
      for (const q of quizzes) {
        if (await isQuizAssigned(q.module, req.user._id)) {
          const attempts = await Attempt.find({ student: req.user._id, quiz: q._id })
            .sort({ percentage: -1 })
            .select('percentage passed attemptNumber submittedAt');
          assigned.push({
            ...q.toObject(),
            attemptsUsed: attempts.length,
            bestScore: attempts[0]?.percentage ?? null,
            passed: attempts.some((a) => a.passed),
            lastSubmittedAt: attempts[0]?.submittedAt ?? null,
          });
        }
      }
      quizzes = assigned;
    } else {
      quizzes = await Quiz.find({ archived: false });
    }
    return sendSuccess(res, 200, quizzes, 'Quizzes fetched');
  } catch (error) {
    return next(error);
  }
};

const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, archived: false });
    if (!quiz) throw new ApiError(404, 'Quiz not found');

    const isStudent = req.user.role === 'student';
    if (isStudent && !quiz.isPublished) throw new ApiError(403, 'This quiz is not available');
    if (isStudent && !(await isQuizAssigned(quiz.module, req.user._id))) {
      throw new ApiError(403, 'This quiz is not assigned to your class');
    }

    const questionQuery = Question.find({ quiz: quiz._id }).sort({ order: 1 });
    if (isStudent) {
      questionQuery.select('-options.isCorrect');
    }
    const questions = await questionQuery.lean();

    const attemptCount = await Attempt.countDocuments({ student: req.user._id, quiz: quiz._id });
    const attemptsRemaining = isStudent
      ? Math.max(0, quiz.maxAttempts - attemptCount)
      : undefined;

    return sendSuccess(
      res,
      200,
      {
        ...quiz.toObject(),
        questions,
        ...(isStudent && {
          attemptsRemaining,
          attemptsUsed: attemptCount,
          gradingRule: 'All-or-nothing: a question earns points only when every correct option is selected and no incorrect option is selected.',
        }),
      },
      'Quiz fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    assertCanModify(quiz, req.user);

    const allowed = [
      'module',
      'lesson',
      'title',
      'description',
      'timeLimitMinutes',
      'passMarkPercent',
      'maxAttempts',
      'shuffleQuestions',
      'isPublished',
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) quiz[field] = req.body[field];
    });
    await quiz.save();
    return sendSuccess(res, 200, quiz, 'Quiz updated');
  } catch (error) {
    return next(error);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    assertCanModify(quiz, req.user);
    quiz.archived = true;
    await quiz.save();
    return sendSuccess(res, 200, null, 'Quiz archived. Attempt history is preserved.');
  } catch (error) {
    return next(error);
  }
};

const saveQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    assertCanModify(quiz, req.user);

    const { questions } = req.body;
    if (!Array.isArray(questions)) throw new ApiError(400, 'questions array is required');

    const saved = [];
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const normalized = {
        quiz: quiz._id,
        questionText: q.questionText,
        imageUrl: q.imageUrl || '',
        type: q.type || 'single-choice',
        options: (q.options || []).map((o) => ({ text: o.text, isCorrect: !!o.isCorrect })),
        explanation: q.explanation || '',
        points: q.points || 1,
        order: i,
      };

      if (q._id) {
        const existing = await Question.findById(q._id);
        if (!existing || String(existing.quiz) !== String(quiz._id)) {
          throw new ApiError(404, `Question ${q._id} not found in this quiz`);
        }
        Object.assign(existing, normalized);
        await existing.save();
        saved.push(existing);
      } else {
        const created = await Question.create(normalized);
        saved.push(created);
      }
    }

    return sendSuccess(res, 200, saved, 'Questions saved');
  } catch (error) {
    return next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) throw new ApiError(404, 'Question not found');
    const quiz = await Quiz.findById(question.quiz);
    assertCanModify(quiz, req.user);
    await Question.deleteOne({ _id: id });
    return sendSuccess(res, 200, null, 'Question deleted');
  } catch (error) {
    return next(error);
  }
};

const startAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, archived: false });
    if (!quiz) throw new ApiError(404, 'Quiz not found');
    if (!quiz.isPublished) throw new ApiError(403, 'This quiz is not published');
    if (!(await isQuizAssigned(quiz.module, req.user._id))) {
      throw new ApiError(403, 'This quiz is not assigned to your class');
    }

    const attemptCount = await Attempt.countDocuments({ student: req.user._id, quiz: quiz._id });
    if (attemptCount >= quiz.maxAttempts) {
      throw new ApiError(
        403,
        `Maximum attempts (${quiz.maxAttempts}) reached. You cannot start this quiz again.`
      );
    }

    const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 });
    if (questions.length === 0) throw new ApiError(400, 'This quiz has no questions yet');

    let questionOrder = questions.map((q) => q._id);
    const optionOrder = {};
    if (quiz.shuffleQuestions) {
      questionOrder = shuffleArray(questionOrder);
    }
    questions.forEach((q) => {
      let optionIds = q.options.map((o) => String(o._id));
      if (quiz.shuffleQuestions) {
        optionIds = shuffleArray(optionIds);
      }
      optionOrder[String(q._id)] = optionIds;
    });

    const attempt = await Attempt.create({
      student: req.user._id,
      quiz: quiz._id,
      attemptNumber: attemptCount + 1,
      startedAt: new Date(),
      questionOrder,
      optionOrder,
    });

    const questionsInOrder = questionOrder.map((qid) =>
      questions.find((q) => String(q._id) === String(qid))
    );

    const sanitized = questionsInOrder.map((q) => {
      const obj = q.toObject({ virtuals: true });
      obj.options = obj.options.map(({ isCorrect, ...rest }) => rest);
      return obj;
    });

    return sendSuccess(
      res,
      201,
      { attempt, questions: sanitized, timeLimitMinutes: quiz.timeLimitMinutes },
      'Attempt started'
    );
  } catch (error) {
    return next(error);
  }
};

const submitAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attemptId = req.body.attemptId || req.body.attempt;
    const attempt = await Attempt.findById(attemptId).populate('quiz');
    if (!attempt) throw new ApiError(404, 'Attempt not found');
    if (String(attempt.student) !== String(req.user._id)) {
      throw new ApiError(403, 'Not your attempt');
    }
    if (attempt.submittedAt) {
      return sendSuccess(res, 200, attempt, 'Attempt already submitted');
    }

    const quiz = attempt.quiz;
    if (quiz.timeLimitMinutes > 0) {
      const elapsedSeconds = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
      const allowed = quiz.timeLimitMinutes * 60 + 10;
      if (elapsedSeconds > allowed) {
        throw new ApiError(
          400,
          'Time limit exceeded. The quiz was auto-submitted on the client and can no longer be accepted.'
        );
      }
    }

    const questions = await Question.find({ quiz: quiz._id }).lean();

    const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answers = submitted.map((a) => ({
      question: a.question,
      selectedOptions: (a.selectedOptions || []).map((s) => String(s)),
    }));

    const { score, totalPoints, percentage, passed, graded } = gradeQuiz({
      questions,
      answers,
      passMarkPercent: quiz.passMarkPercent,
    });

    attempt.answers = answers;
    attempt.score = score;
    attempt.totalPoints = totalPoints;
    attempt.percentage = percentage;
    attempt.passed = percentage >= quiz.passMarkPercent;
    attempt.submittedAt = new Date();
    attempt.durationSeconds = Math.round(
      (attempt.submittedAt - new Date(attempt.startedAt).getTime()) / 1000
    );
    await attempt.save();

    const result = {
      attempt,
      graded,
      quizTitle: quiz.title,
      passMarkPercent: quiz.passMarkPercent,
    };

    await notifyUsers({
      users: [req.user._id],
      message: `Quiz "${quiz.title}" graded: ${percentage}% — ${percentage >= quiz.passMarkPercent ? 'Passed' : 'Failed'}`,
      type: 'quiz-graded',
      link: `/student/quizzes/${quiz._id}`,
    });

    return sendSuccess(res, 200, result, 'Quiz submitted and graded');
  } catch (error) {
    return next(error);
  }
};

const getMyAttempts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attempts = await Attempt.find({ student: req.user._id, quiz: id }).sort({
      attemptNumber: -1,
    });
    return sendSuccess(res, 200, attempts, 'Attempts fetched');
  } catch (error) {
    return next(error);
  }
};

const getAttemptById = async (req, res, next) => {
  try {
    const { id, attemptId } = req.params;
    const attempt = await Attempt.findOne({ _id: attemptId, quiz: id });
    if (!attempt) throw new ApiError(404, 'Attempt not found');
    if (String(attempt.student) !== String(req.user._id) && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not your attempt');
    }

    const questions = await Question.find({ quiz: id }).lean();
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const review = (attempt.questionOrder || []).map((qid) => {
      const q = questionMap.get(String(qid));
      if (!q) return null;
      const answer = attempt.answers.find((a) => String(a.question) === String(qid));
      const optionIds = (attempt.optionOrder && attempt.optionOrder[String(qid)]) || q.options.map((o) => String(o._id));
      return {
        question: q.questionText,
        imageUrl: q.imageUrl,
        type: q.type,
        points: q.points,
        explanation: q.explanation,
        options: optionIds
          .map((oid) => {
            const opt = q.options.find((o) => String(o._id) === oid);
            if (!opt) return null;
            return {
              text: opt.text,
              isCorrect: opt.isCorrect,
              selected: (answer?.selectedOptions || []).includes(String(oid)),
            };
          })
          .filter(Boolean),
      };
    }).filter(Boolean);

    return sendSuccess(res, 200, { attempt, review }, 'Attempt fetched');
  } catch (error) {
    return next(error);
  }
};

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  saveQuestions,
  deleteQuestion,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptById,
};
