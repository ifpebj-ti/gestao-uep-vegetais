import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { UepType } from '../types/uep';
import { UnauthorizedAccess } from '../components/UnauthorizedAccess';

export interface ProtectedRouteProps {
  /** Lista de papéis permitidos a acessar a rota protegida */
  allowedRoles?: UserRole[];
  /** Lista de UEPs permitidas a acessar a rota protegida */
  allowedUep?: UepType[];
  children?: React.ReactNode;
}

const VALID_ROLES: readonly UserRole[] = ['ADMIN', 'PROFESSOR', 'ALUNO', 'USUARIO'] as const;
const VALID_UEPS: readonly UepType[] = ['olericultura', 'fruticultura'] as const;

function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
}

function isValidUep(uep: unknown): uep is UepType {
  return typeof uep === 'string' && VALID_UEPS.includes(uep as UepType);
}

function formatUepLabel(uep: unknown): string {
  if (uep === 'fruticultura') return 'Fruticultura';
  if (uep === 'olericultura') return 'Olericultura';
  return 'Não confirmada';
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

  // Validação estrita do papel (role) sem inferência por e-mail ou dados de cliente
  if (!isValidRole(user.role)) {
    const roleDisplay =
      typeof user.role === 'string' && user.role.trim()
        ? user.role
        : 'Não identificado';
    return <UnauthorizedAccess userRole={roleDisplay} />;
  }

  const userRole: UserRole = user.role;

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
      const hasUepPermission = isValidUep(user.uep) && allowedUep.includes(user.uep);

      if (!hasUepPermission) {
        const uepLabel = formatUepLabel(user.uep);
        return <UnauthorizedAccess userRole={`${userRole} (${uepLabel})`} />;
      }
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
