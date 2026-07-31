import { Field, ErrorMessage } from 'formik';

const PasswordInput = ({ label, name, showPassword, setShowPassword, autoComplete = 'new-password' }) => (
  <div>
    <label htmlFor={name} className="label-field">
      {label}
    </label>
    <div className="relative">
      <Field
        id={name}
        name={name}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        className="input-field pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        )}
      </button>
    </div>
    <ErrorMessage name={name} component="p" className="mt-1 text-xs text-red-600" />
  </div>
);

export default PasswordInput;
