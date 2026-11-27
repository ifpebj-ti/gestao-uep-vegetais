import { describe, it, expect } from 'vitest';
import { identifyRoleByEmail } from './roleIdentifier';

describe('roleIdentifier - Segurança e RBAC', () => {
  it('deve priorizar o papel autenticado e validado da sessão', () => {
    // Aluno autenticado legitimamente
    expect(
      identifyRoleByEmail('aluno@discente.ifpe.edu.br', 'ALUNO')
    ).toBe('ALUNO');

    // Professor autenticado legitimamente
    expect(
      identifyRoleByEmail('george@belojardim.ifpe.edu.br', 'PROFESSOR')
    ).toBe('PROFESSOR');

    // Administrador autenticado legitimamente
    expect(
      identifyRoleByEmail('admin@belojardim.ifpe.edu.br', 'ADMIN')
    ).toBe('ADMIN');
  });

  it('SEGURANÇA: NÃO deve conceder ADMIN com base apenas no e-mail sem defaultRole ADMIN', () => {
    // Tentativa de invasão: usuário anônimo ou sem role informando e-mail de admin
    expect(identifyRoleByEmail('admin@belojardim.ifpe.edu.br', undefined)).not.toBe('ADMIN');
    expect(identifyRoleByEmail('admin@belojardim.ifpe.edu.br', '')).not.toBe('ADMIN');
    expect(identifyRoleByEmail('admin@ifpe.edu.br', undefined)).not.toBe('ADMIN');
  });

  it('SEGURANÇA: NÃO deve permitir que um ALUNO eleve privilégios forjando o e-mail de admin', () => {
    // Aluno alterou seu e-mail no storage para o do administrador
    const papelIdentificado = identifyRoleByEmail(
      'admin@belojardim.ifpe.edu.br',
      'ALUNO'
    );
    expect(papelIdentificado).toBe('ALUNO');
  });

  it('SEGURANÇA: NÃO deve permitir que um PROFESSOR eleve privilégios forjando o e-mail de admin', () => {
    // Professor alterou seu e-mail no storage para o do administrador
    const papelIdentificado = identifyRoleByEmail(
      'admin@belojardim.ifpe.edu.br',
      'PROFESSOR'
    );
    expect(papelIdentificado).toBe('PROFESSOR');
  });

  it('deve identificar papel discente por domínio acadêmico quando não houver role prévia', () => {
    expect(identifyRoleByEmail('joao.silva@discente.ifpe.edu.br')).toBe('ALUNO');
  });

  it('deve identificar papel docente por domínio institucional quando não houver role prévia', () => {
    expect(identifyRoleByEmail('professor@belojardim.ifpe.edu.br')).toBe('PROFESSOR');
    expect(identifyRoleByEmail('docente@ifpe.edu.br')).toBe('PROFESSOR');
  });
});
