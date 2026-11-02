import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import type { PermissionCode } from '@bccs/shared';

interface Props {
  children: React.ReactNode;
  requiredPermission?: PermissionCode;
}

export default function ProtectedRoute({ children, requiredPermission }: Props) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && user && !user.permissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
