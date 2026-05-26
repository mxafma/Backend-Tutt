import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rol } from '../types';

interface Props {
  children: React.ReactNode;
  roles?: Rol[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
