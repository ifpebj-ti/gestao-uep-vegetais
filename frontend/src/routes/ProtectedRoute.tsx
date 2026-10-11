import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { identifyRoleByEmail } from '../modules/auth/utils/roleIdentifier';
import { UnauthorizedAccess } from '../components/UnauthorizedAccess';

interface ProtectedRouteProps {
  /** Lista de papéis permitidos a acessar a rota protegida */
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1e7]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#27633b] border-t-transparent" />
          <p className="text-sm font-semibold text-[#27633b]">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validação RBAC por papel
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = identifyRoleByEmail(user.email, user.role);
    const hasPermission =
      allowedRoles.includes(userRole) || userRole === 'ADMIN';

    if (!hasPermission) {
      return <UnauthorizedAccess userRole={userRole} />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
