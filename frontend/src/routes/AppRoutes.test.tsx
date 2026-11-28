import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppRoutes from './AppRoutes';
import * as AuthContextModule from '../contexts/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Mock Three.js / Canvas heavy components to speed up route testing
vi.mock('../modules/olericultura/components/TerrariumMap', () => ({
  TerrariumMap: () => <div data-testid="terrarium-map-mock">Mapa 3D Mock</div>,
}));
vi.mock('../modules/fruticultura/components/PomarMap', () => ({
  PomarMap: () => <div data-testid="pomar-map-mock">Pomar 3D Mock</div>,
}));

describe('AppRoutes - Verificação da Arquitetura de Rotas e Permissões', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderAppRoutes = () => render(
    <GoogleOAuthProvider clientId="test-client-id">
      <AppRoutes />
    </GoogleOAuthProvider>
  );

  it('deve direcionar usuário deslogado para a tela de login na raiz (/)', async () => {
    window.history.pushState({}, '', '/');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderAppRoutes();

    expect(await screen.findByText('Acesse sua conta')).toBeInTheDocument();
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

    renderAppRoutes();

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

    renderAppRoutes();

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
        uep: 'olericultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderAppRoutes();

    expect(await screen.findByText('Área do Aluno')).toBeInTheDocument();
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
        uep: 'olericultura',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderAppRoutes();

    expect(await screen.findByTestId('terrarium-map-mock', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('deve permitir acesso do ADMIN à rota /admin e bloquear PROFESSOR na rota /admin', async () => {
    window.history.pushState({}, '', '/admin');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-admin',
        nome: 'Administrador Terrarium',
        email: 'admin@belojardim.ifpe.edu.br',
        role: 'ADMIN',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderAppRoutes();

    expect(
      await screen.findByRole('heading', { name: /gestão de professores e ueps/i })
    ).toBeInTheDocument();
  });

  it('deve bloquear ADMIN com tela 403 ao tentar acessar a rota de mapa (/olericultura/professor/mapa)', async () => {
    window.history.pushState({}, '', '/olericultura/professor/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-admin',
        nome: 'Administrador Terrarium',
        email: 'admin@belojardim.ifpe.edu.br',
        role: 'ADMIN',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderAppRoutes();

    expect(await screen.findByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.queryByTestId('terrarium-map-mock')).not.toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Professor de Olericultura ao tentar acessar rota de Fruticultura', async () => {
    window.history.pushState({}, '', '/fruticultura/professor/configuracoes');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-prof-oleri',
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

    renderAppRoutes();

    expect(await screen.findByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/PROFESSOR \(Olericultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Aluno de Olericultura ao tentar acessar rota de Fruticultura (/fruticultura/aluno/pomar)', async () => {
    window.history.pushState({}, '', '/fruticultura/aluno/pomar');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno-oleri',
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

    renderAppRoutes();

    expect(await screen.findByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Olericultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve bloquear Aluno de Fruticultura ao tentar acessar rota de Olericultura (/olericultura/aluno/mapa)', async () => {
    window.history.pushState({}, '', '/olericultura/aluno/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno-fruti',
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

    renderAppRoutes();

    expect(await screen.findByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Fruticultura\)/)).toBeInTheDocument();
  });

  it('SEGURANÇA: deve permitir acesso de Aluno de Fruticultura à rota de Fruticultura (/fruticultura/aluno/pomar)', async () => {
    window.history.pushState({}, '', '/fruticultura/aluno/pomar');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno-fruti',
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

    renderAppRoutes();

    expect(await screen.findByTestId('pomar-map-mock', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('Permissão Insuficiente')).not.toBeInTheDocument();
  });

  it('SEGURANÇA (Fail-Closed): deve bloquear Aluno sem UEP atribuída ao tentar acessar rota de Olericultura', async () => {
    window.history.pushState({}, '', '/olericultura/aluno/mapa');

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno-sem-uep',
        nome: 'Aluno Sem UEP',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: undefined,
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    renderAppRoutes();

    expect(await screen.findByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText(/ALUNO \(Não confirmada\)/)).toBeInTheDocument();
  });
});
