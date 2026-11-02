import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import type { PermissionCode } from '@bccs/shared';

export function usePermission(permission: PermissionCode): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function useRequirePermission(permission: PermissionCode): boolean {
  const hasPermission = usePermission(permission);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasPermission) {
      navigate('/unauthorized', { replace: true });
    }
  }, [hasPermission, navigate]);

  return hasPermission;
}
