import request from 'supertest';
import app from '../../app.js';
import Class from '../../models/Class.js';
import Module from '../../models/Module.js';
import Quiz from '../../models/Quiz.js';
import Question from '../../models/Question.js';
import Attempt from '../../models/Attempt.js';
import User from '../../models/User.js';
import { connectTestDB, disconnectTestDB, clearDatabase } from '../helpers/db.js';

let teacherToken;
let teacherId;
let studentToken;
let studentId;
let moduleId;
let quizId;
let questionIds = [];
let classCode;

beforeAll(async () => {
  await connectTestDB();

  const teacher = await User.create({
    fullName: 'Mr. Quiz Teacher',
    email: 'teacher@test.com',
    password: 'password123',
    role: 'teacher',
    isApproved: true,
  });
  teacherId = teacher._id;

  const klass = await Class.create({ name: 'SS2 CG', classCode: 'SS2CG2', teacher: teacher._id });
  classCode = klass.classCode;

  const student = await User.create({
    fullName: 'Quiz Student',
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    className: klass.name,
  });
  klass.students.push(student._id);
  await klass.save();
  studentId = student._id;
});

beforeEach(async () => {
  const loginTeacher = await request(app)
    .post('/api/auth/login')
    .send({ email: 'teacher@test.com', password: 'password123' });
  teacherToken = loginTeacher.body.data.token;
  const loginStudent = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@test.com', password: 'password123' });
  studentToken = loginStudent.body.data.token;
});

afterEach(async () => {
  await clearDatabase();
  // recreate seed data after each test
  const teacher = await User.create({
    fullName: 'Mr. Quiz Teacher',
    email: 'teacher@test.com',
    password: 'password123',
    role: 'teacher',
    isApproved: true,
  });
  teacherId = teacher._id;

  const klass = await Class.create({ name: 'SS2 CG', classCode: 'SS2CG2', teacher: teacher._id });
  classCode = klass.classCode;

  const student = await User.create({
    fullName: 'Quiz Student',
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    className: klass.name,
  });
  klass.students.push(student._id);
  await klass.save();
  studentId = student._id;
});

afterAll(async () => {
  await disconnectTestDB();
});

const createModuleAndQuiz = async () => {
  const moduleRes = await request(app)
    .post('/api/modules')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ title: 'Module 1', description: 'Test module', isPublished: true });
  moduleId = moduleRes.body.data._id;

  const quizRes = await request(app)
    .post('/api/quizzes')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({
      module: moduleId,
      title: 'Module 1 Quiz',
      isPublished: true,
      passMarkPercent: 50,
      maxAttempts: 2,
      shuffleQuestions: false,
    });
  quizId = quizRes.body.data._id;

  const questionsRes = await request(app)
    .post(`/api/quizzes/${quizId}/questions`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({
      questions: [
        {
          questionText: 'What is RGB?',
          type: 'single-choice',
          options: [
            { text: 'Color model', isCorrect: true },
            { text: 'File format', isCorrect: false },
          ],
          points: 1,
          explanation: 'RGB is a color model.',
        },
        {
          questionText: 'Which are primary colors?',
          type: 'multiple-choice',
          options: [
            { text: 'Red', isCorrect: true },
            { text: 'Green', isCorrect: true },
            { text: 'Blue', isCorrect: true },
            { text: 'Yellow', isCorrect: false },
          ],
          points: 2,
          explanation: 'RGB are the additive primaries.',
        },
      ],
    });
  questionIds = questionsRes.body.data.map((q) => q._id);
};

describe('Quiz assessment flow', () => {
  test('unauthorized role (student) cannot create a lesson → 403', async () => {
    await createModuleAndQuiz();
    const res = await request(app)
      .post(`/api/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Hacker lesson' });
    expect(res.status).toBe(403);
  });

  test('student quiz fetch never exposes isCorrect flags', async () => {
    await createModuleAndQuiz();
    const res = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(2);
    const hasCorrectLeak = res.body.data.questions.some((q) =>
      q.options.some((o) => 'isCorrect' in o)
    );
    expect(hasCorrectLeak).toBe(false);
  });

  test('full attempt: student answers correctly → server-side grading 100%', async () => {
    await createModuleAndQuiz();
    const startRes = await request(app)
      .post(`/api/quizzes/${quizId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attempt._id;

    const submit = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId,
        answers: [
          { question: questionIds[0], selectedOptions: [await getCorrectOption(questionIds[0])] },
          {
            question: questionIds[1],
            selectedOptions: await getCorrectOptions(questionIds[1]),
          },
        ],
      });
    expect(submit.status).toBe(200);
    expect(submit.body.data.attempt.score).toBe(3);
    expect(submit.body.data.attempt.totalPoints).toBe(3);
    expect(submit.body.data.attempt.percentage).toBe(100);
    expect(submit.body.data.attempt.passed).toBe(true);
  });

  test('partial answers → all-or-nothing per question, score reflects correct questions only', async () => {
    await createModuleAndQuiz();
    const startRes = await request(app)
      .post(`/api/quizzes/${quizId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.attempt._id;

    const submit = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        attemptId,
        answers: [
          { question: questionIds[0], selectedOptions: [] },
          { question: questionIds[1], selectedOptions: await getCorrectOptions(questionIds[1]) },
        ],
      });
    expect(submit.body.data.attempt.score).toBe(2);
    expect(submit.body.data.attempt.percentage).toBe(Math.round((2 / 3) * 100));
  });

  test('attempt beyond maxAttempts → 403', async () => {
    await createModuleAndQuiz();
    for (let i = 0; i < 2; i += 1) {
      const start = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(start.status).toBe(201);
      await request(app)
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ attemptId: start.body.data.attempt._id, answers: [] });
    }
    const blocked = await request(app)
      .post(`/api/quizzes/${quizId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(blocked.status).toBe(403);
  });

  test('duplicate submit is idempotent (no double grading)', async () => {
    await createModuleAndQuiz();
    const startRes = await request(app)
      .post(`/api/quizzes/${quizId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    const attemptId = startRes.body.data.attempt._id;

    const body = {
      attemptId,
      answers: [
        { question: questionIds[0], selectedOptions: [await getCorrectOption(questionIds[0])] },
      ],
    };
    const first = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send(body);
    const second = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.data.submittedAt).toBeDefined();
    const count = await Attempt.countDocuments({ _id: attemptId, submittedAt: { $ne: null } });
    expect(count).toBe(1);
  });

  test('teacher cannot start a quiz (students only) → 403', async () => {
    await createModuleAndQuiz();
    const res = await request(app)
      .post(`/api/quizzes/${quizId}/start`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  test('student cannot access unpublished quiz → 403', async () => {
    await createModuleAndQuiz();
    const quiz = await Quiz.findById(quizId);
    quiz.isPublished = false;
    await quiz.save();

    const res = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});

const getCorrectOption = async (questionId) => {
  const q = await Question.findById(questionId);
  return String(q.options.find((o) => o.isCorrect)._id);
};

const getCorrectOptions = async (questionId) => {
  const q = await Question.findById(questionId);
  return q.options.filter((o) => o.isCorrect).map((o) => String(o._id));
};
