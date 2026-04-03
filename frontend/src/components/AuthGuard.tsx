import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const getHomePath = (role: Role): string => {
  switch (role) {
    case 'wife':
      return '/home';
    case 'husband':
      return '/husband';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
};

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, role } = useAuthStore();

  // 无 token -> 重定向登录
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 有 token 但无角色（理论上不应该发生）-> 重定向
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // 有角色限制但当前用户角色不匹配
  if (allowedRoles && !allowedRoles.includes(role)) {
    const homePath = getHomePath(role);
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
}
