import React, { StrictMode } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { authService, UserSession } from '../services/authService';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { APP_CONFIG } from '../config/constants';

// Componente auxiliar para inspecionar o estado do hook useAuth
const AuthConsumerTestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'CARREGANDO' : 'PRONTO'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'AUTENTICADO' : 'NAO_AUTENTICADO'}</div>
      <div data-testid="user-email">{user?.email || 'SEM_USUARIO'}</div>
      <div data-testid="user-role">{user?.role || 'SEM_ROLE'}</div>
      <button onClick={logout} data-testid="btn-logout">Logout</button>
    </div>
  );
};

// Helper para construir JWT válido
const createTestJwt = (payloadObj: Record<string, unknown>, signature = 'valid-sig') => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(payloadObj));
  return `${header}.${payload}.${signature}`;
};

describe('AuthContext - Suíte de Testes Reais do AuthProvider', () => {
  const STORAGE_KEY = APP_CONFIG.storageKeys.session;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1. Deve manter estado inicial isLoading: true durante a validação', async () => {
    // Configura sessão existente no storage
    const token = createTestJwt({
      sub: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
      nome: 'Prof George',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const session: UserSession = {
      token,
      nome: 'Prof George',
      email: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
    };
    authService.saveSession(session);

    // Mock do fetch que nunca resolve imediatamente (simula latência de rede)
    let resolveFetch: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    // Durante o handshake, deve estar CARREGANDO
    expect(screen.getByTestId('loading-state').textContent).toBe('CARREGANDO');
    expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');

    // Resolve a requisição
    await act(async () => {
      resolveFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'george@belojardim.ifpe.edu.br',
          nome: 'Prof George',
          role: 'PROFESSOR',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
      expect(screen.getByTestId('auth-state').textContent).toBe('AUTENTICADO');
    });
  });

  it('2. Deve autenticar com sucesso quando backend retornar 200 OK em /auth/me', async () => {
    const token = createTestJwt({
      sub: 'ana@discente.ifpe.edu.br',
      role: 'ALUNO',
      nome: 'Ana Aluna',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Ana Aluna',
      email: 'ana@discente.ifpe.edu.br',
      role: 'ALUNO',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'ana@discente.ifpe.edu.br',
          nome: 'Ana Beatriz Atualizada',
          role: 'ALUNO',
          uep: 'olericultura',
        }),
      })
    );

    render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
      expect(screen.getByTestId('auth-state').textContent).toBe('AUTENTICADO');
      expect(screen.getByTestId('user-email').textContent).toBe('ana@discente.ifpe.edu.br');
      expect(screen.getByTestId('user-role').textContent).toBe('ALUNO');
    });
  });

  it('3. Deve deslogar e manter fail-closed quando backend retornar 403 Forbidden', async () => {
    const fakeToken = createTestJwt(
      { sub: 'hacker@ifpe.edu.br', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 },
      'assinatura-falsa'
    );
    authService.saveSession({
      token: fakeToken,
      nome: 'Hacker',
      email: 'hacker@ifpe.edu.br',
      role: 'ADMIN',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ erro: 'Assinatura inválida' }),
      })
    );

    render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
      expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
      expect(screen.getByTestId('user-email').textContent).toBe('SEM_USUARIO');
    });

    // Sessão deve ter sido expurgada do storage
    expect(authService.getSession()).toBeNull();
  });

  it('4. Deve manter fail-closed quando houver falha de rede', async () => {
    const token = createTestJwt({
      sub: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Aluno',
      email: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error (offline)')));

    render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
      expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
      expect(screen.getByTestId('user-email').textContent).toBe('SEM_USUARIO');
    });
  });

  it('5. Deve cancelar a requisição via AbortController ao desmontar o componente', async () => {
    const token = createTestJwt({
      sub: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Prof George',
      email: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
    });

    let capturedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, options) => {
        capturedSignal = options?.signal;
        return new Promise(() => {}); // Mantém pendente
      })
    );

    const { unmount } = render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    // Desmonta o componente enquanto a requisição está em trânsito
    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it('6. Deve operar corretamente dentro de React.StrictMode (dupla montagem sem vazamento)', async () => {
    const token = createTestJwt({
      sub: 'strict@ifpe.edu.br',
      role: 'PROFESSOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Strict User',
      email: 'strict@ifpe.edu.br',
      role: 'PROFESSOR',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'strict@ifpe.edu.br',
          nome: 'Strict User',
          role: 'PROFESSOR',
        }),
      })
    );

    render(
      <StrictMode>
        <AuthProvider>
          <AuthConsumerTestComponent />
        </AuthProvider>
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
      expect(screen.getByTestId('auth-state').textContent).toBe('AUTENTICADO');
      expect(screen.getByTestId('user-email').textContent).toBe('strict@ifpe.edu.br');
    });
  });

  it('7. Deve evitar condições de corrida através de authRequestIdRef', async () => {
    // Configura sessão inicial
    const tokenInicial = createTestJwt({
      sub: 'lento@ifpe.edu.br',
      role: 'ALUNO',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token: tokenInicial,
      nome: 'Lento',
      email: 'lento@ifpe.edu.br',
      role: 'ALUNO',
    });

    let resolveSlowFetch: (value: unknown) => void;
    const slowPromise = new Promise((resolve) => {
      resolveSlowFetch = resolve;
    });

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return slowPromise;
      }
      if (url.includes('/auth/csrf')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-test-token' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          token: 'token-rapido',
          email: 'rapido@ifpe.edu.br',
          nome: 'Rapido',
          role: 'PROFESSOR',
        }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    // Componente que dispara login logo após renderizar
    const QuickLoginTrigger: React.FC = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <span data-testid="user-email">{user?.email || 'NENHUM'}</span>
          <button
            data-testid="btn-login-rapido"
            onClick={() => login({ email: 'rapido@ifpe.edu.br', senha: '123' })}
          >
            Login Rápido
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <QuickLoginTrigger />
      </AuthProvider>
    );

    // Dispara o login subsequente
    await act(async () => {
      screen.getByTestId('btn-login-rapido').click();
    });

    // Agora resolve a requisição lenta do /auth/me que ficou para trás
    await act(async () => {
      resolveSlowFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'lento@ifpe.edu.br',
          nome: 'Lento Respondeu Tarde',
          role: 'ALUNO',
        }),
      });
    });

    // O estado deve refletir o login mais recente ('rapido@ifpe.edu.br'), e NÃO a resposta lenta
    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('rapido@ifpe.edu.br');
    });
  });

  it('8. Não deve atualizar estado após a desmontagem do componente', async () => {
    const token = createTestJwt({
      sub: 'user@ifpe.edu.br',
      role: 'PROFESSOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'User',
      email: 'user@ifpe.edu.br',
      role: 'PROFESSOR',
    });

    const consoleSpy = vi.spyOn(console, 'error');

    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchPromise));

    const { unmount } = render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    // Desmonta enquanto o fetch está pendente
    unmount();

    // Resolve o fetch após a desmontagem
    await act(async () => {
      resolveFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'user@ifpe.edu.br',
          nome: 'User',
          role: 'PROFESSOR',
        }),
      });
    });

    // Verifica que nenhum aviso de vazamento de estado ("unmounted component") foi emitido
    const warnings = consoleSpy.mock.calls.filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('unmounted'))
    );
    expect(warnings.length).toBe(0);
  });

  it('9. Bloqueio estrito de rotas protegidas durante o handshake de autenticação', async () => {
    const token = createTestJwt({
      sub: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Aluno Teste',
      email: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
    });

    let resolveFetch: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Página de Login</div>} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<div>Painel Administrativo Ultra Secreto</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Enquanto o handshake está pendente:
    // 1. O painel restrito NUNCA deve ser exibido
    expect(screen.queryByText('Painel Administrativo Ultra Secreto')).not.toBeInTheDocument();
    // 2. Deve exibir a tela de bloqueio de verificação
    expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument();

    // Resolve a validação com perfil ALUNO (tentando acessar rota ADMIN)
    await act(async () => {
      resolveFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'aluno@discente.ifpe.edu.br',
          nome: 'Aluno Teste',
          role: 'ALUNO',
        }),
      });
    });

    // Após validação, o aluno deve ter acesso negado ao painel ultra secreto
    await waitFor(() => {
      expect(screen.queryByText('Painel Administrativo Ultra Secreto')).not.toBeInTheDocument();
      expect(screen.getByText(/Permissão Insuficiente/i)).toBeInTheDocument();
    });
  });
});
