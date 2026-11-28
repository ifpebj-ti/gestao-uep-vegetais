import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { UepType } from '../types/uep';
import { identifyRoleByEmail } from '../modules/auth/utils/roleIdentifier';
import { UnauthorizedAccess } from '../components/UnauthorizedAccess';

export interface ProtectedRouteProps {
  /** Lista de papéis permitidos a acessar a rota protegida */
  allowedRoles?: UserRole[];
  /** Lista de UEPs permitidas a acessar a rota protegida */
  allowedUep?: UepType[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  allowedUep,
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

  const userRole = identifyRoleByEmail(user.email, user.role);

  // Validação RBAC por papel
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(userRole);

    if (!hasPermission) {
      return <UnauthorizedAccess userRole={userRole} />;
    }
  }

  // Validação de escopo por UEP (Olericultura vs Fruticultura)
  if (allowedUep && allowedUep.length > 0) {
    // ADMIN possui autorização transversal
    if (userRole !== 'ADMIN') {
      const userUep: UepType =
        user.uep === 'fruticultura' ? 'fruticultura' : 'olericultura';
      const hasUepPermission = allowedUep.includes(userUep);

      if (!hasUepPermission) {
        const uepLabel = userUep === 'fruticultura' ? 'Fruticultura' : 'Olericultura';
        return <UnauthorizedAccess userRole={`${userRole} (${uepLabel})`} />;
      }
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
