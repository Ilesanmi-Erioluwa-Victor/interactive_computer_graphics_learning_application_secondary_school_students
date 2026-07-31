import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from './Loader.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    const home = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
