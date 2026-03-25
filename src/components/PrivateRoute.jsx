import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <Loader fullScreen />;

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};
