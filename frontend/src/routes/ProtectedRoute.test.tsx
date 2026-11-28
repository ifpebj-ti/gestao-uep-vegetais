import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { UepType } from '../types/uep';

describe('ProtectedRoute', () => {
  const renderWithRouter = (
    initialEntry = '/protegida',
    allowedRoles?: UserRole[],
    allowedUep?: UepType[]
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} allowedUep={allowedUep} />}>
            <Route path="/protegida" element={<div>Conteúdo Protegido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('deve exibir indicador de carregamento enquanto valida a autenticação', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
  });

  it('deve redirecionar para /login se o usuário não estiver autenticado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Tela de Login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
  });

  it('deve renderizar a rota filha se o usuário estiver autenticado com papel válido e sem restrição de papéis', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Isabela',
        email: 'isabela@ifpe.edu.br',
        role: 'USUARIO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Tela de Login')).not.toBeInTheDocument();
  });

  it('deve permitir acesso de Professor quando a rota exigir role PROFESSOR', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Professor George',
        email: 'george@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR']);

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
  });

  it('deve bloquear acesso com tela 403 se um Aluno tentar acessar rota exclusiva de Professor', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno João',
        email: 'joao@discente.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ALUNO')).toBeInTheDocument();
  });

  it('deve bloquear acesso para ADMIN em rotas restritas a PROFESSOR', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Admin do Sistema',
        email: 'admin@sistema.com',
        role: 'ADMIN',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear acesso com tela 403 quando um Aluno tentar acessar rota exclusiva de ADMIN', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Teste',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ADMIN']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ALUNO')).toBeInTheDocument();
  });

  it('SEGURANÇA: não deve inferir ADMIN pelo e-mail quando a role validada for ALUNO', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Invasor',
        email: 'admin@belojardim.ifpe.edu.br', // e-mail manipulado no cliente
        role: 'ALUNO', // role real validada
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ADMIN']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ALUNO')).toBeInTheDocument();
  });

  it('SEGURANÇA: não deve inferir PROFESSOR pelo domínio institucional @belojardim.ifpe.edu.br quando role for ALUNO', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno com email docente',
        email: 'george@belojardim.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ALUNO')).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear usuário com role ausente (undefined) mesmo sem restrição de papéis', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Usuário Sem Role',
        email: 'semrole@teste.com',
        role: undefined,
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida');

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('Não identificado')).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear usuário com role inválida (ex: HACKER)', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Hacker',
        email: 'hacker@teste.com',
        role: 'HACKER',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida');

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('HACKER')).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Professor de Olericultura ao tentar acessar rota exclusiva de Fruticultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Prof Olericultura',
        email: 'prof.oleri@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
        uep: 'olericultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR'], ['fruticultura']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/PROFESSOR \(Olericultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Professor de Fruticultura ao tentar acessar rota exclusiva de Olericultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Prof Fruticultura',
        email: 'prof.fruti@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
        uep: 'fruticultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR'], ['olericultura']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/PROFESSOR \(Fruticultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve permitir que Professor de Fruticultura acesse rota de Fruticultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Prof Fruticultura',
        email: 'prof.fruti@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
        uep: 'fruticultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR'], ['fruticultura']);

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Aluno de Olericultura ao tentar acessar rota exclusiva de Fruticultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Olericultura',
        email: 'aluno.oleri@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'olericultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ALUNO'], ['fruticultura']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Olericultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Aluno de Fruticultura ao tentar acessar rota exclusiva de Olericultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Fruticultura',
        email: 'aluno.fruti@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'fruticultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ALUNO'], ['olericultura']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Fruticultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve permitir que Aluno de Olericultura acesse rota de Olericultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Olericultura',
        email: 'aluno.oleri@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'olericultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ALUNO'], ['olericultura']);

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('SEGURANÇA: deve permitir que Aluno de Fruticultura acesse rota de Fruticultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Fruticultura',
        email: 'aluno.fruti@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'fruticultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ALUNO'], ['fruticultura']);

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('SEGURANÇA (Fail-Closed): deve bloquear usuário com UEP ausente em rota com restrição de UEP', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno Sem UEP',
        email: 'aluno.sem.uep@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: undefined, // Sem confirmação de UEP
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ALUNO'], ['olericultura']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Não confirmada\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear usuário com UEP inválida sem classificar como Olericultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Aluno UEP Inválida',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'horticultura_desconhecida',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ALUNO'], ['olericultura']);

    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Não confirmada\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Olericultura/)).not.toBeInTheDocument();
  });

  it('SEGURANÇA: Administrador possui autorização transversal e acessa rota com allowedUep Olericultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-admin',
        nome: 'Admin Global',
        email: 'admin@sistema.com',
        role: 'ADMIN',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ADMIN'], ['olericultura']);

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('SEGURANÇA: Administrador possui autorização transversal e acessa rota com allowedUep Fruticultura', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-admin',
        nome: 'Admin Global',
        email: 'admin@sistema.com',
        role: 'ADMIN',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['ADMIN'], ['fruticultura']);

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('SEGURANÇA: deve manter carregamento e bloquear renderização enquanto perfil não for validado pelo backend', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Handshake/validação com backend ainda pendente
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderWithRouter('/protegida', ['PROFESSOR'], ['olericultura']);

    expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
    expect(screen.queryByText('Tela de Login')).not.toBeInTheDocument();
  });
});
