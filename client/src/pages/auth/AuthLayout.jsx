import { Link } from 'react-router-dom';

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 px-4 py-12">
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-black text-white backdrop-blur">
          CG
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-primary-100">{subtitle}</p>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-primary-100">
        Interactive Computer Graphics Learning Application — ICGLA
      </p>
    </div>
  </div>
);

const AuthLink = ({ to, text, cta }) => (
  <p className="mt-4 text-center text-sm text-gray-600">
    {text}{' '}
    <Link to={to} className="font-semibold text-primary-600 hover:text-primary-700">
      {cta}
    </Link>
  </p>
);

export { AuthLayout, AuthLink };
