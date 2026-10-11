import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

describe('ProtectedRoute', () => {
  const renderWithRouter = (
    initialEntry = '/protegida',
    allowedRoles?: UserRole[]
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
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

  it('deve permitir acesso para ADMIN mesmo em rotas restritas a PROFESSOR', () => {
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

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
  });
});
