import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../api/auth.js';
import { authStart, authSuccess, authFailure } from '../../store/authSlice.js';
import { AuthLayout, AuthLink } from './AuthLayout.jsx';
import PasswordInput from './PasswordInput.jsx';

const studentSchema = Yup.object({  role: Yup.string().required(),
  fullName: Yup.string().min(3, 'Enter your full name').required('Full name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm your password'),
  school: Yup.string(),
  className: Yup.string(),
  classCode: Yup.string()
    .when('role', {
      is: 'student',
      then: (s) => s.required('Class code is required'),
      otherwise: (s) => s.notRequired(),
    }),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    dispatch(authStart());
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        school: values.school || '',
        className: values.className || '',
        ...(values.role === 'student' && { classCode: values.classCode }),
      };
      const apiCall =
        values.role === 'student' ? authApi.registerStudent : authApi.registerTeacher;
      const { data } = await apiCall(payload);
      dispatch(authSuccess({ user: data.data.user, token: data.data.token }));

      if (values.role === 'teacher') {
        toast.info('Account created. Awaiting admin approval.');
        navigate('/teacher');
      } else {
        toast.success('Account created. Welcome!');
        navigate('/student');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch(authFailure(message));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join ICGLA to start learning Computer Graphics"
    >
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setRole('student')}
          className={`rounded-md py-2 text-sm font-semibold transition-colors ${
            role === 'student' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => setRole('teacher')}
          className={`rounded-md py-2 text-sm font-semibold transition-colors ${
            role === 'teacher' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Teacher
        </button>
      </div>

      <Formik
        initialValues={{
          role,
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          school: '',
          className: '',
          classCode: '',
        }}
        validationSchema={studentSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="fullName" className="label-field">
                Full name
              </label>
              <Field id="fullName" name="fullName" className="input-field" autoComplete="name" />
              <ErrorMessage name="fullName" component="p" className="mt-1 text-xs text-red-600" />
            </div>

            <div>
              <label htmlFor="email" className="label-field">
                Email address
              </label>
              <Field id="email" name="email" type="email" className="input-field" autoComplete="email" />
              <ErrorMessage name="email" component="p" className="mt-1 text-xs text-red-600" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="school" className="label-field">
                  School <span className="text-gray-400">(optional)</span>
                </label>
                <Field id="school" name="school" className="input-field" />
                <ErrorMessage name="school" component="p" className="mt-1 text-xs text-red-600" />
              </div>
              {role === 'student' ? (
                <div>
                  <label htmlFor="classCode" className="label-field">
                    Class code <span className="text-red-500">*</span>
                  </label>
                  <Field id="classCode" name="classCode" className="input-field uppercase" placeholder="e.g. SS2CG123" />
                  <ErrorMessage name="classCode" component="p" className="mt-1 text-xs text-red-600" />
                </div>
              ) : (
                <div>
                  <label htmlFor="className" className="label-field">
                    Class name <span className="text-gray-400">(optional)</span>
                  </label>
                  <Field id="className" name="className" className="input-field" placeholder="e.g. SS2A" />
                </div>
              )}
            </div>

            <PasswordInput
              label="Password"
              name="password"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <PasswordInput
              label="Confirm password"
              name="confirmPassword"
              showPassword={showConfirm}
              setShowPassword={setShowConfirm}
              autoComplete="new-password"
            />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </Form>
        )}
      </Formik>

      <AuthLink to="/login" text="Already have an account?" cta="Log in" />
    </AuthLayout>
  );
};

export default Register;
