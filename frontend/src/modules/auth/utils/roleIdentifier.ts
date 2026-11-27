import { UserRole } from '../../../types/auth';

export const ACADEMIC_DOMAINS = {
  ALUNO: 'discente.ifpe.edu.br',
  PROFESSOR: 'belojardim.ifpe.edu.br',
  IFPE_GERAL: 'ifpe.edu.br',
} as const;

/**
 * Identifica o papel do usuário no sistema.
 *
 * REQUISITOS DE SEGURANÇA APPSEC:
 * 1. O papel explicitamente autenticado (defaultRole / user.role) é a ÚNICA fonte de autoridade.
 * 2. O e-mail NÃO confere privilégios por si só. Um atacante que altere seu e-mail no navegador
 *    para 'admin@...' NUNCA receberá privilégios administrativos (ADMIN).
 * 3. O papel 'ADMIN' só é concedido se expressamente presente no perfil validado pela autenticação.
 */
export function identifyRoleByEmail(
  email?: string | null,
  defaultRole?: string | null
): UserRole {
  // 1. O papel autenticado e verificado (via token/sessão) tem precedência total e absoluta
  if (defaultRole) {
    const roleNormalizada = defaultRole.toUpperCase().trim();
    if (roleNormalizada === 'ADMIN') return 'ADMIN';
    if (roleNormalizada === 'PROFESSOR') return 'PROFESSOR';
    if (roleNormalizada === 'ALUNO') return 'ALUNO';
    if (roleNormalizada === 'USUARIO') return 'USUARIO';
  }

  // 2. SEGURANÇA: NUNCA conceder 'ADMIN' por inferência de string de e-mail.
  // Sem um papel autenticado 'ADMIN', e-mails corporativos/administrativos não elevam privilégios.

  if (!email || !email.includes('@')) {
    return 'ALUNO';
  }

  const normalized = email.toLowerCase().trim();


  const parts = normalized.split('@');
  const domain = parts[1];

  if (domain === ACADEMIC_DOMAINS.ALUNO) {
    return 'ALUNO';
  }

  if (
    domain === ACADEMIC_DOMAINS.PROFESSOR ||
    domain === ACADEMIC_DOMAINS.IFPE_GERAL
  ) {
    return 'PROFESSOR';
  }

  return 'ALUNO';
}
