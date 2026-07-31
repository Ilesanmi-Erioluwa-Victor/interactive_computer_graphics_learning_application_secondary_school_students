# Interactive Computer Graphics Learning Application (ICGLA)

A full-stack learning application for teaching secondary-school Computer Graphics. Students explore modules with interactive canvas demos (shape drawing, colour mixing, transformations), take quizzes with instant server-side grading, and track their progress. Teachers author content and manage classes; admins manage users, classes, feedback and reports.

## Tech stack

- **Frontend** (`client/`) — React 18, Vite 5, Tailwind CSS, Redux Toolkit, React Router v6, Formik + Yup, Recharts, react-quill, React-Toastify
- **Backend** (`server/`) — Node.js (ESM), Express, MongoDB (Mongoose), JWT auth, multer media uploads, Brevo transactional email API, express-rate-limit + helmet
- **Database** — MongoDB (MongoDB Atlas)
- **Testing** — Jest + Supertest, with `mongodb-memory-server` for integration tests

## Features

- **Roles**: student, teacher, admin (JWT auth, teacher approval workflow)
- **Learning**: module/lesson syllabus, rich-text lessons (quill), media uploads
- **Interactive demos**: HTML5 canvas — shape drawing, colour mixer, 2D transformations
- **Assessment**: quizzes with single/multiple-choice and true/false questions, time limits, attempt limits, all-or-nothing grading, answer review
- **Progress tracking**: lesson completion, per-module progress bars, quiz history, admin reports
- **Classes**: teacher-created classes with join codes
- **Feedback & notifications**: student feedback forms, in-app notification bell, email hooks (via the Brevo transactional email API when `BREVO_API_KEY` is set)

## Project structure

```
server/                  Express API
  controllers/           Route handlers
  models/                Mongoose schemas (User, Module, Lesson, Quiz, Question, Attempt, Progress, Class, Feedback, Notification)
  routes/                API route definitions
  middlewares/           auth, role, upload, error handlers
  utils/                 gradeQuiz, sendEmail, notifyUsers, media helpers
  tests/                 unit + integration tests
  scripts/seed.js        Creates the default admin account
client/                  React app
  src/api/               Axios API clients
  src/components/        Shared UI, canvas demos, notification/feedback widgets
  src/pages/             auth, student, teacher, admin views
```

## Getting started

Prerequisites: Node.js 18+ and npm.

### 1. Backend

```bash
cd server
cp .env.example .env        # then fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run seed                # creates the admin account from ADMIN_* env vars
npm run dev                 # http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Log in with the seeded admin account (default `admin@icgla.com` / `Admin@12345`), approve any teacher registrations, and create a class to generate a join code for students.

## Tests

```bash
cd server
npm test                    # runs unit + integration suites (in-memory MongoDB)
```

## Deployment

### Frontend (Vercel / Netlify)

Build with `npm run build` (output: `client/dist`). Set `VITE_API_URL` to the public API URL at build time.

### Backend (Render / Railway / Fly.io)

- Set the environment variables from `server/.env.example`, especially `MONGO_URI` and `JWT_SECRET`.
- Start command: `npm start` (runs `server.js`).

### MongoDB

Use MongoDB Atlas. Create a cluster, add the connection string to `MONGO_URI`, and allow your server's IP in Network Access.

## Environment variables

See `server/.env.example` and `client/.env.example` for the full list. Never commit real secrets; `server/.env` and `client/.env` are git-ignored.
