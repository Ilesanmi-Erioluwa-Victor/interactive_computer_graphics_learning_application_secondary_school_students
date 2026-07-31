import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../api/auth.js';
import { authStart, authSuccess, authFailure } from '../../store/authSlice.js';
import { AuthLayout, AuthLink } from './AuthLayout.jsx';
import PasswordInput from './PasswordInput.jsx';

const validationSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const roleHome = { admin: '/admin', teacher: '/teacher', student: '/student' };

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    dispatch(authStart());
    try {
      const { data } = await authApi.login(values);
      dispatch(authSuccess({ user: data.data.user, token: data.data.token }));

      const user = data.data.user;
      if (user.role === 'teacher' && !user.isApproved) {
        toast.info('Your teacher account is pending admin approval.');
      } else {
        toast.success('Login successful');
      }

      const redirect = location.state?.from || roleHome[user.role] || '/';
      navigate(redirect, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch(authFailure(message));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue your Computer Graphics journey">
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="email" className="label-field">
                Email address
              </label>
              <Field id="email" name="email" type="email" autoComplete="email" className="input-field" />
              <ErrorMessage name="email" component="p" className="mt-1 text-xs text-red-600" />
            </div>

            <PasswordInput
              label="Password"
              name="password"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </Form>
        )}
      </Formik>

      <AuthLink to="/register" text="Don't have an account?" cta="Register now" />
    </AuthLayout>
  );
};

export default Login;
