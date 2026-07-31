const Loader = ({ fullScreen = true }) => (
  <div
    className={fullScreen ? 'flex min-h-screen items-center justify-center' : 'flex items-center justify-center py-8'}
    role="status"
    aria-label="Loading"
  >
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
  </div>
);

export default Loader;
