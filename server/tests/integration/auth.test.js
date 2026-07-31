import request from 'supertest';
import app from '../../app.js';
import Class from '../../models/Class.js';
import { connectTestDB, disconnectTestDB, clearDatabase } from '../helpers/db.js';

const teacher = {
  fullName: 'Mr. Test Teacher',
  email: 'teacher@test.com',
  password: 'password123',
};

const student = {
  fullName: 'Test Student',
  email: 'student@test.com',
  password: 'password123',
};

let classCode;

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  const klass = await Class.create({ name: 'SS2 CG', classCode: 'SS2CG1' });
  classCode = klass.classCode;
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Auth endpoints', () => {
  test('register student with invalid class code → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register/student')
      .send({ ...student, classCode: 'INVALID' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toContain('class code');
  });

  test('register student with valid class code → 201 and joins class', async () => {
    const res = await request(app)
      .post('/api/auth/register/student')
      .send({ ...student, classCode });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.token).toBeDefined();

    const klass = await Class.findOne({ classCode });
    expect(klass.students).toHaveLength(1);
  });

  test('duplicate email registration → 409', async () => {
    await request(app).post('/api/auth/register/student').send({ ...student, classCode });
    const res = await request(app).post('/api/auth/register/student').send({ ...student, classCode });
    expect(res.status).toBe(409);
  });

  test('register teacher → isApproved false (pending admin approval)', async () => {
    const res = await request(app).post('/api/auth/register/teacher').send(teacher);
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('teacher');
    expect(res.body.data.user.isApproved).toBe(false);
  });

  test('login with valid credentials → 200 with role', async () => {
    await request(app).post('/api/auth/register/student').send({ ...student, classCode });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: student.password });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('student');
    expect(res.body.data.token).toBeDefined();
  });

  test('login with wrong password → 401', async () => {
    await request(app).post('/api/auth/register/student').send({ ...student, classCode });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('login with deactivated account → 403', async () => {
    const { body } = await request(app).post('/api/auth/register/student').send({ ...student, classCode });
    const userId = body.data.user._id;
    const User = (await import('../../models/User.js')).default;
    await User.findByIdAndUpdate(userId, { isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: student.password });
    expect(res.status).toBe(403);
  });

  test('access protected route without token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
