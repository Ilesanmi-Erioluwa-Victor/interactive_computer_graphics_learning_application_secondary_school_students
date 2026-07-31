import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../api/auth.js';
import { AuthLayout } from './AuthLayout.jsx';
import PasswordInput from './PasswordInput.jsx';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account">
      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={Yup.object({
          password: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('Password is required'),
          confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Confirm your password'),
        })}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await authApi.resetPassword(token, { password: values.password });
            toast.success('Password reset successful. Please log in.');
            navigate('/login');
          } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed. The link may have expired.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <PasswordInput
              label="New password"
              name="password"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm new password"
              name="confirmPassword"
              showPassword={showConfirm}
              setShowPassword={setShowConfirm}
              autoComplete="new-password"
            />
            <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-xs text-red-600" />
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Saving...' : 'Reset password'}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default ResetPassword;
