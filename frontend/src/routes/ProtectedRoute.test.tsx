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

  it('deve renderizar a rota filha se o usuário estiver autenticado sem restrição de papéis', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-valido',
        nome: 'Isabela',
        email: 'isabela@ifpe.edu.br',
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

  it('SEGURANÇA: deve bloquear Aluno tentando burlar rota ADMIN alterando seu e-mail para admin@belojardim.ifpe.edu.br', () => {
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
});
