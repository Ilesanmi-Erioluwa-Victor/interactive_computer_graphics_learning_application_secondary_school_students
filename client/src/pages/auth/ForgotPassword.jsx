import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../api/auth.js';
import { AuthLayout, AuthLink } from './AuthLayout.jsx';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a reset link">
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">
            If an account exists for that email, a password reset link has been sent. Check your inbox.
          </p>
          <AuthLink to="/login" text="Back to" cta="login" />
        </div>
      ) : (
        <>
          <Formik
            initialValues={{ email: '' }}
            validationSchema={Yup.object({
              email: Yup.string().email('Enter a valid email').required('Email is required'),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await authApi.forgotPassword(values);
                setSent(true);
                toast.success('Reset link sent');
              } catch (error) {
                toast.error(error.response?.data?.message || 'Something went wrong');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="email" className="label-field">
                    Email address
                  </label>
                  <Field id="email" name="email" type="email" className="input-field" autoComplete="email" />
                  <ErrorMessage name="email" component="p" className="mt-1 text-xs text-red-600" />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Sending...' : 'Send reset link'}
                </button>
              </Form>
            )}
          </Formik>
          <AuthLink to="/login" text="Remembered your password?" cta="Log in" />
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
