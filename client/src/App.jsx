import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import Loader from './components/common/Loader.jsx';
import { authApi } from './api/auth.js';
import { authSuccess, logout } from './store/authSlice.js';

const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard.jsx'));
const StudentModuleList = lazy(() => import('./pages/student/ModuleList.jsx'));
const StudentLessonView = lazy(() => import('./pages/student/LessonView.jsx'));
const StudentProgress = lazy(() => import('./pages/student/Progress.jsx'));
const StudentMyClasses = lazy(() => import('./pages/student/MyClasses.jsx'));
const StudentQuizView = lazy(() => import('./pages/student/QuizView.jsx'));

const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard.jsx'));
const TeacherModuleList = lazy(() => import('./pages/teacher/ModuleList.jsx'));
const TeacherLessonEditor = lazy(() => import('./pages/teacher/LessonEditor.jsx'));
const TeacherClassRoster = lazy(() => import('./pages/teacher/ClassRoster.jsx'));
const TeacherStudentProgress = lazy(() => import('./pages/teacher/StudentProgress.jsx'));
const TeacherQuizEditor = lazy(() => import('./pages/teacher/QuizEditor.jsx'));
const TeacherFeedback = lazy(() => import('./pages/teacher/FeedbackInbox.jsx'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement.jsx'));
const AdminClassManagement = lazy(() => import('./pages/admin/ClassManagement.jsx'));
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminFeedback = lazy(() => import('./pages/admin/FeedbackInbox.jsx'));

const Loading = () => <Loader />;

const RoleRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const home = { admin: '/admin', teacher: '/teacher', student: '/student' };
  if (user?.role) {
    return <Navigate to={home[user.role] || '/login'} replace />;
  }
  return <Navigate to="/login" replace />;
};

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('icgla_token');
    if (!token) return;
    authApi
      .getMe()
      .then(({ data }) => {
        dispatch(authSuccess({ user: data.data.user, token }));
      })
      .catch(() => {
        dispatch(logout());
      });
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/modules"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentModuleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/lessons/:id"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentLessonView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/progress"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentMyClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quizzes/:id"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentQuizView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/modules"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherModuleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/modules/:moduleId/lessons/new"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherLessonEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/lessons/:id/edit"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherLessonEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/new"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherQuizEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/:id/edit"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherQuizEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherClassRoster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherStudentProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/feedback"
            element={
              <ProtectedRoute roles={['teacher']}>
                <TeacherFeedback />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminClassManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminFeedback />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={4000} />
    </BrowserRouter>
  );
};

export default App;
