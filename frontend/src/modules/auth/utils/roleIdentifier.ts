import { UserRole } from '../../../types/auth';

export const ACADEMIC_DOMAINS = {
  ALUNO: 'discente.ifpe.edu.br',
  PROFESSOR: 'belojardim.ifpe.edu.br',
  IFPE_GERAL: 'ifpe.edu.br',
} as const;

export function identifyRoleByEmail(email: string, defaultRole?: string): UserRole {
  if (!email || !email.includes('@')) {
    return (defaultRole as UserRole) || 'ALUNO';
  }

  const normalized = email.toLowerCase().trim();

  // Exceção autorizada para demonstração: usuário com papel docente
  if (normalized === 'ifl1@discente.ifpe.edu.br') {
    return 'PROFESSOR';
  }

  const parts = normalized.split('@');
  const domain = parts[1];

  if (domain === ACADEMIC_DOMAINS.ALUNO) {
    return 'ALUNO';
  }

  if (domain === ACADEMIC_DOMAINS.PROFESSOR || domain === ACADEMIC_DOMAINS.IFPE_GERAL) {
    return 'PROFESSOR';
  }

  return (defaultRole as UserRole) || 'ALUNO';
}
