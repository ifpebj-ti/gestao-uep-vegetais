import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppRoutes from './AppRoutes';
import * as AuthContextModule from '../contexts/AuthContext';

// Mock Three.js / Canvas heavy components to speed up route testing
vi.mock('../modules/olericultura/components/TerrariumMap', () => ({
  TerrariumMap: () => <div data-testid="terrarium-map-mock">Mapa 3D Mock</div>,
}));

describe('AppRoutes - Verificação da Arquitetura de Rotas e Permissões', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve direcionar usuário deslogado para a seleção de UEP na raiz (/)', async () => {
    window.history.pushState({}, '', '/');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AppRoutes />);

    expect(await screen.findByText(/Selecione a Unidade de Ensino e Produção/i)).toBeInTheDocument();
    expect(screen.getByText('Olericultura')).toBeInTheDocument();
    expect(screen.getByText('Fruticultura')).toBeInTheDocument();
  });

  it('deve redirecionar usuário deslogado para /login ao tentar acessar rota protegida /mapa', async () => {
    window.history.pushState({}, '', '/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AppRoutes />);

    expect(await screen.findByText('Acesse sua conta')).toBeInTheDocument();
  });

  it('deve bloquear aluno com tela 403 ao tentar acessar rota exclusiva de professor (/olericultura/professor/mapa)', async () => {
    window.history.pushState({}, '', '/olericultura/professor/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno',
        nome: 'Estudante IFPE',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AppRoutes />);

    expect(await screen.findByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ALUNO')).toBeInTheDocument();
    expect(screen.queryByTestId('terrarium-map-mock')).not.toBeInTheDocument();
  });

  it('deve permitir acesso do aluno na sua rota dedicada (/olericultura/aluno/mapa)', async () => {
    window.history.pushState({}, '', '/olericultura/aluno/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno',
        nome: 'Estudante IFPE',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AppRoutes />);

    expect(await screen.findByTestId('terrarium-map-mock')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('deve permitir acesso de professor em rota de professor (/olericultura/professor/mapa)', async () => {
    window.history.pushState({}, '', '/olericultura/professor/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-prof',
        nome: 'Prof George',
        email: 'george@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    render(<AppRoutes />);

    expect(await screen.findByTestId('terrarium-map-mock')).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });
});
