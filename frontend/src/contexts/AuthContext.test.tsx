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

  it('3.1. Deve deslogar e manter fail-closed quando backend retornar 404 Not Found em /auth/me', async () => {
    const token = createTestJwt({
      sub: 'usuario@ifpe.edu.br',
      role: 'PROFESSOR',
      uep: 'olericultura',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Professor Teste',
      email: 'usuario@ifpe.edu.br',
      role: 'PROFESSOR',
      uep: 'olericultura',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
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

    const mockFetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/auth/me')) {
        const authHeader = (options?.headers as Record<string, string> | undefined)?.['Authorization'];
        if (authHeader && authHeader.includes(tokenInicial)) {
          return slowPromise;
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            email: 'rapido@ifpe.edu.br',
            nome: 'Rapido',
            role: 'PROFESSOR',
          }),
        });
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

  it('10. Logout imediato durante handshake descarta resposta pendente do backend e impede restauração da sessão', async () => {
    const token = createTestJwt({
      sub: 'usuario@ifpe.edu.br',
      role: 'PROFESSOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Prof George',
      email: 'usuario@ifpe.edu.br',
      role: 'PROFESSOR',
    });

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

    expect(screen.getByTestId('loading-state').textContent).toBe('CARREGANDO');

    // Usuário clica em Logout enquanto a validação está em trânsito
    await act(async () => {
      screen.getByTestId('btn-logout').click();
    });

    expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
    expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
    expect(screen.getByTestId('user-email').textContent).toBe('SEM_USUARIO');

    // Agora o backend responde tardiamente com 200 OK
    await act(async () => {
      resolveFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'usuario@ifpe.edu.br',
          nome: 'Prof George',
          role: 'PROFESSOR',
        }),
      });
    });

    // O estado NUNCA deve ser restaurado
    expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
    expect(screen.getByTestId('user-email').textContent).toBe('SEM_USUARIO');
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('11. Logout imediato durante login descarta a resposta e mantém user como null', async () => {
    let resolveLogin: (value: unknown) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/login')) {
        return loginPromise;
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
        json: async () => ({}),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const LoginLogoutComponent: React.FC = () => {
      const { user, login, logout, isLoading } = useAuth();
      return (
        <div>
          <div data-testid="user-state">{user ? user.email : 'NENHUM'}</div>
          <div data-testid="loading-state">{isLoading ? 'CARREGANDO' : 'PRONTO'}</div>
          <button
            data-testid="btn-login"
            onClick={() => { login({ email: 'test@ifpe.edu.br', senha: '123' }).catch(() => {}); }}
          >
            Entrar
          </button>
          <button data-testid="btn-logout" onClick={logout}>
            Sair
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <LoginLogoutComponent />
      </AuthProvider>
    );

    // Dispara login
    act(() => {
      screen.getByTestId('btn-login').click();
    });

    expect(screen.getByTestId('loading-state').textContent).toBe('CARREGANDO');

    // Usuário clica em logout enquanto o login está pendente
    act(() => {
      screen.getByTestId('btn-logout').click();
    });

    expect(screen.getByTestId('user-state').textContent).toBe('NENHUM');
    expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');

    // Login resolve com sucesso depois do logout
    await act(async () => {
      resolveLogin!({
        ok: true,
        status: 200,
        json: async () => ({
          token: createTestJwt({ sub: 'test@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 }),
          nome: 'Test',
          email: 'test@ifpe.edu.br',
          role: 'PROFESSOR',
        }),
      });
    });

    // Sessão NÃO deve ser restaurada
    expect(screen.getByTestId('user-state').textContent).toBe('NENHUM');
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('12. Resposta incompleta do backend (sem role válida) mantém fail-closed e expurga a sessão', async () => {
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

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'aluno@discente.ifpe.edu.br',
          nome: 'Aluno Teste',
          role: 'PAPEL_DESCONHECIDO_INVENTADO', // role inválida
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
      expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
      expect(screen.getByTestId('user-email').textContent).toBe('SEM_USUARIO');
    });

    expect(authService.getSession()).toBeNull();
  });

  it('13. Dados manipulados no storage com role ADMIN nunca são expostos no estado antes da validação do backend', async () => {
    const token = createTestJwt({
      sub: 'invasor@teste.com',
      role: 'ALUNO',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    // Forja dados no storage simulando ataque local
    localStorage.setItem(
      APP_CONFIG.storageKeys.session,
      JSON.stringify({
        token,
        nome: 'Invasor',
        email: 'invasor@teste.com',
        role: 'ADMIN', // adulterado no storage
        uep: 'fruticultura',
      })
    );

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

    // Antes da resposta do backend:
    // O estado do React DEVE ser 'SEM_USUARIO' e 'SEM_ROLE', nunca expondo o 'ADMIN' forjado
    expect(screen.getByTestId('user-role').textContent).toBe('SEM_ROLE');
    expect(screen.getByTestId('user-email').textContent).toBe('SEM_USUARIO');
    expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');

    // Backend valida e retorna o papel real (ALUNO)
    await act(async () => {
      resolveFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'invasor@teste.com',
          nome: 'Invasor',
          role: 'ALUNO',
          uep: 'olericultura',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-role').textContent).toBe('ALUNO');
      expect(screen.getByTestId('auth-state').textContent).toBe('AUTENTICADO');
    });
  });

  it('14. Login e Login com Google mantêm isLoading true enquanto aguardam a resposta do backend', async () => {
    let resolveGoogle: (value: unknown) => void;
    const googlePromise = new Promise((resolve) => {
      resolveGoogle = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/login/google')) {
          return googlePromise;
        }
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              email: 'google@ifpe.edu.br',
              nome: 'Google User',
              role: 'ALUNO',
            }),
          });
        }
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-test-token' }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    const GoogleLoginComponent: React.FC = () => {
      const { user, loginWithGoogle, isLoading } = useAuth();
      return (
        <div>
          <div data-testid="loading-state">{isLoading ? 'CARREGANDO' : 'PRONTO'}</div>
          <div data-testid="user-state">{user ? user.email : 'SEM_USER'}</div>
          <button
            data-testid="btn-google"
            onClick={() => { loginWithGoogle('google-cred-123').catch(() => {}); }}
          >
            Google Login
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <GoogleLoginComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');

    // Clica para logar com Google
    act(() => {
      screen.getByTestId('btn-google').click();
    });

    // Durante o trânsito da requisição ao backend
    expect(screen.getByTestId('loading-state').textContent).toBe('CARREGANDO');
    expect(screen.getByTestId('user-state').textContent).toBe('SEM_USER');

    // Resolve a resposta do backend
    await act(async () => {
      resolveGoogle!({
        ok: true,
        status: 200,
        json: async () => ({
          token: createTestJwt({ sub: 'google@ifpe.edu.br', role: 'ALUNO', exp: Math.floor(Date.now() / 1000) + 3600 }),
          nome: 'Google User',
          email: 'google@ifpe.edu.br',
          role: 'ALUNO',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
      expect(screen.getByTestId('user-state').textContent).toBe('google@ifpe.edu.br');
    });
  });

  it('15. Login bem-sucedido seguido de chamada obrigatória a /api/auth/me para obter perfil autoritativo', async () => {
    const urlsChamadas: string[] = [];
    const mockToken = createTestJwt({ sub: 'login.prof@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        urlsChamadas.push(url);
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token-xyz' }),
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: mockToken,
              nome: 'Professor Backend',
              email: 'login.prof@ifpe.edu.br',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              email: 'login.prof@ifpe.edu.br',
              nome: 'Professor Validado Autoritativo',
              role: 'PROFESSOR',
              uep: 'olericultura',
            }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    let loggedUser: UserSession | null = null;
    const LoginComponent: React.FC = () => {
      const { user, login } = useAuth();
      loggedUser = user;
      return (
        <button
          data-testid="btn-do-login"
          onClick={() => { login({ email: 'login.prof@ifpe.edu.br', senha: '123' }).catch(() => {}); }}
        >
          Login
        </button>
      );
    };

    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-do-login').click();
    });

    await waitFor(() => {
      expect(loggedUser).not.toBeNull();
      expect(loggedUser?.role).toBe('PROFESSOR');
      expect(loggedUser?.uep).toBe('olericultura');
    });

    // Comprova que /auth/login foi chamado e logo após /auth/me foi obrigatoriamente consultado
    expect(urlsChamadas.some((u) => u.includes('/auth/login'))).toBe(true);
    expect(urlsChamadas.some((u) => u.includes('/auth/me'))).toBe(true);
  });

  it('16. Login com Google seguido de chamada obrigatória a /api/auth/me para obter perfil autoritativo', async () => {
    const urlsChamadas: string[] = [];
    const mockToken = createTestJwt({ sub: 'google.aluno@ifpe.edu.br', role: 'ALUNO', exp: Math.floor(Date.now() / 1000) + 3600 });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        urlsChamadas.push(url);
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token-xyz' }),
          });
        }
        if (url.includes('/auth/login/google')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: mockToken,
              nome: 'Google Aluno',
              email: 'google.aluno@ifpe.edu.br',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              email: 'google.aluno@ifpe.edu.br',
              nome: 'Aluno Validado Autoritativo',
              role: 'ALUNO',
              uep: 'fruticultura',
            }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    let loggedUser: UserSession | null = null;
    const GoogleComponent: React.FC = () => {
      const { user, loginWithGoogle } = useAuth();
      loggedUser = user;
      return (
        <button
          data-testid="btn-google-login"
          onClick={() => { loginWithGoogle('google-cred-token').catch(() => {}); }}
        >
          Google
        </button>
      );
    };

    render(
      <AuthProvider>
        <GoogleComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-google-login').click();
    });

    await waitFor(() => {
      expect(loggedUser).not.toBeNull();
      expect(loggedUser?.role).toBe('ALUNO');
      expect(loggedUser?.uep).toBe('fruticultura');
    });

    // Comprova que /auth/login/google foi chamado e logo após /auth/me foi consultado
    expect(urlsChamadas.some((u) => u.includes('/auth/login/google'))).toBe(true);
    expect(urlsChamadas.some((u) => u.includes('/auth/me'))).toBe(true);
  });

  it('17. Estado user = null enquanto /api/auth/me estiver pendente após autenticação inicial', async () => {
    let resolveAuthMe: (value: unknown) => void;
    const authMePromise = new Promise((resolve) => {
      resolveAuthMe = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: createTestJwt({ sub: 'teste@ifpe.edu.br', role: 'ALUNO', exp: Math.floor(Date.now() / 1000) + 3600 }),
              nome: 'Teste',
              email: 'teste@ifpe.edu.br',
              role: 'ALUNO',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          return authMePromise; // Retém pendente
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    const InspectComponent: React.FC = () => {
      const { user, login, isLoading, isAuthenticated } = useAuth();
      return (
        <div>
          <div data-testid="is-loading">{isLoading ? 'CARREGANDO' : 'PRONTO'}</div>
          <div data-testid="is-auth">{isAuthenticated ? 'SIM' : 'NAO'}</div>
          <div data-testid="user-value">{user ? 'TEM_USER' : 'SEM_USER'}</div>
          <button data-testid="btn-login" onClick={() => { login({ email: 'teste@ifpe.edu.br', senha: '123' }).catch(() => {}); }}>
            Login
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <InspectComponent />
      </AuthProvider>
    );

    // Dispara login
    act(() => {
      screen.getByTestId('btn-login').click();
    });

    // Enquanto /api/auth/me estiver pendente:
    // O estado do usuário DEVE ser estritamente null e isAuthenticated DEVE ser falso!
    expect(screen.getByTestId('is-loading').textContent).toBe('CARREGANDO');
    expect(screen.getByTestId('is-auth').textContent).toBe('NAO');
    expect(screen.getByTestId('user-value').textContent).toBe('SEM_USER');

    // Agora resolve /api/auth/me
    await act(async () => {
      resolveAuthMe!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'teste@ifpe.edu.br',
          nome: 'Teste',
          role: 'ALUNO',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('PRONTO');
      expect(screen.getByTestId('is-auth').textContent).toBe('SIM');
      expect(screen.getByTestId('user-value').textContent).toBe('TEM_USER');
    });
  });

  it('18. Resposta 200 de /api/auth/me com role inválida durante login não libera acesso e lança erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: createTestJwt({ sub: 'fraude@ifpe.edu.br', exp: Math.floor(Date.now() / 1000) + 3600 }),
              nome: 'Fraude',
              email: 'fraude@ifpe.edu.br',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              email: 'fraude@ifpe.edu.br',
              nome: 'Fraude',
              role: 'ROLE_INVENTADA_NAO_AUTORIZADA', // role inválida
            }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    let caughtError: Error | null = null;
    const TestComponent: React.FC = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <div data-testid="user-state">{user ? 'LOGADO' : 'DESLOGADO'}</div>
          <button
            data-testid="btn-login-invalid"
            onClick={async () => {
              try {
                await login({ email: 'fraude@ifpe.edu.br', senha: '123' });
              } catch (e) {
                caughtError = e as Error;
              }
            }}
          >
            Tentar
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-login-invalid').click();
    });

    await waitFor(() => {
      expect(caughtError).not.toBeNull();
      expect(screen.getByTestId('user-state').textContent).toBe('DESLOGADO');
    });

    expect(authService.getSession()).toBeNull();
  });

  it('19. Resposta 404 em /api/auth/me durante login não utiliza fallback local e falha fechado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: createTestJwt({ sub: 'user404@ifpe.edu.br', exp: Math.floor(Date.now() / 1000) + 3600 }),
              nome: 'User 404',
              email: 'user404@ifpe.edu.br',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    let loginThrew = false;
    const TestComponent: React.FC = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <div data-testid="user-state">{user ? 'LOGADO' : 'DESLOGADO'}</div>
          <button
            data-testid="btn-login-404"
            onClick={async () => {
              try {
                await login({ email: 'user404@ifpe.edu.br', senha: '123' });
              } catch {
                loginThrew = true;
              }
            }}
          >
            Login 404
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-login-404').click();
    });

    await waitFor(() => {
      expect(loginThrew).toBe(true);
      expect(screen.getByTestId('user-state').textContent).toBe('DESLOGADO');
    });

    expect(authService.getSession()).toBeNull();
  });

  it('20. Falha de rede em /api/auth/me durante login não libera acesso e não expõe sessão', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: createTestJwt({ sub: 'user.offline@ifpe.edu.br', exp: Math.floor(Date.now() / 1000) + 3600 }),
              nome: 'Offline',
              email: 'user.offline@ifpe.edu.br',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          return Promise.reject(new Error('Network error (Failed to fetch)'));
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    let loginError: Error | null = null;
    const TestComponent: React.FC = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <div data-testid="user-state">{user ? 'LOGADO' : 'DESLOGADO'}</div>
          <button
            data-testid="btn-login-offline"
            onClick={async () => {
              try {
                await login({ email: 'user.offline@ifpe.edu.br', senha: '123' });
              } catch (e) {
                loginError = e as Error;
              }
            }}
          >
            Login Offline
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-login-offline').click();
    });

    await waitFor(() => {
      expect(loginError).not.toBeNull();
      expect(screen.getByTestId('user-state').textContent).toBe('DESLOGADO');
    });

    expect(authService.getSession()).toBeNull();
  });

  it('21. Concorrência: Login pendente seguido de logout impede que resposta antiga restaure o storage', async () => {
    let resolveLoginFetch: (value: unknown) => void;
    let resolveAuthMeFetch: (value: unknown) => void;

    const loginPromise = new Promise((resolve) => {
      resolveLoginFetch = resolve;
    });
    const authMePromise = new Promise((resolve) => {
      resolveAuthMeFetch = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          return loginPromise;
        }
        if (url.includes('/auth/me')) {
          return authMePromise;
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    const TestComponent: React.FC = () => {
      const { user, login, logout, isLoading } = useAuth();
      return (
        <div>
          <div data-testid="user-state">{user ? user.email : 'NENHUM'}</div>
          <div data-testid="is-loading">{isLoading ? 'CARREGANDO' : 'PRONTO'}</div>
          <button data-testid="btn-login" onClick={() => { login({ email: 'tardio@ifpe.edu.br', senha: '123' }).catch(() => {}); }}>
            Login
          </button>
          <button data-testid="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 1. Dispara login
    act(() => {
      screen.getByTestId('btn-login').click();
    });
    expect(screen.getByTestId('is-loading').textContent).toBe('CARREGANDO');

    // 2. Usuário clica em logout enquanto o login está pendente na rede
    act(() => {
      screen.getByTestId('btn-logout').click();
    });
    expect(screen.getByTestId('user-state').textContent).toBe('NENHUM');
    expect(screen.getByTestId('is-loading').textContent).toBe('PRONTO');

    // 3. A requisição de login resolve depois do logout
    const tardioToken = createTestJwt({ sub: 'tardio@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 });
    await act(async () => {
      resolveLoginFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          token: tardioToken,
          nome: 'Tardio',
          email: 'tardio@ifpe.edu.br',
          role: 'PROFESSOR',
        }),
      });
    });

    // 4. A requisição de /api/auth/me também resolve
    await act(async () => {
      resolveAuthMeFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'tardio@ifpe.edu.br',
          nome: 'Tardio',
          role: 'PROFESSOR',
          uep: 'olericultura',
        }),
      });
    });

    // 5. Verificação rigorosa: NEM o React NEM o storage foram restaurados
    expect(screen.getByTestId('user-state').textContent).toBe('NENHUM');
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('22. Concorrência: Validação /api/auth/me pendente seguida de logout garante storage limpo', async () => {
    const token = createTestJwt({
      sub: 'startup@ifpe.edu.br',
      role: 'ALUNO',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    authService.saveSession({
      token,
      nome: 'Aluno Startup',
      email: 'startup@ifpe.edu.br',
      role: 'ALUNO',
    });

    let resolveAuthMe: (value: unknown) => void;
    const authMePromise = new Promise((resolve) => {
      resolveAuthMe = resolve;
    });

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(authMePromise));

    render(
      <AuthProvider>
        <AuthConsumerTestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading-state').textContent).toBe('CARREGANDO');

    // Usuário clica em logout enquanto a validação de inicialização está em trânsito
    await act(async () => {
      screen.getByTestId('btn-logout').click();
    });

    expect(screen.getByTestId('loading-state').textContent).toBe('PRONTO');
    expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();

    // /api/auth/me responde 200 OK com atraso
    await act(async () => {
      resolveAuthMe!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'startup@ifpe.edu.br',
          nome: 'Aluno Startup',
          role: 'ALUNO',
          uep: 'olericultura',
        }),
      });
    });

    // Storage e React devem permanecer estritamente limpos
    expect(screen.getByTestId('auth-state').textContent).toBe('NAO_AUTENTICADO');
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('23. Concorrência: Login antigo (lento) seguido de novo login (rápido) impede sobrescrita no storage e no estado', async () => {
    let resolveUserAFetch: (value: unknown) => void;
    const userAPromise = new Promise((resolve) => {
      resolveUserAFetch = resolve;
    });

    const tokenA = createTestJwt({ sub: 'userA@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 });
    const tokenB = createTestJwt({ sub: 'userB@ifpe.edu.br', role: 'ALUNO', exp: Math.floor(Date.now() / 1000) + 3600 });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          const body = JSON.parse((options?.body as string) || '{}');
          if (body.email === 'userA@ifpe.edu.br') {
            return userAPromise; // Login A é lento
          }
          // Login B é rápido
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              token: tokenB,
              nome: 'User B',
              email: 'userB@ifpe.edu.br',
              role: 'ALUNO',
            }),
          });
        }
        if (url.includes('/auth/me')) {
          const authHeader = (options?.headers as Record<string, string> | undefined)?.['Authorization'];
          if (authHeader && authHeader.includes(tokenA)) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                email: 'userA@ifpe.edu.br',
                nome: 'User A',
                role: 'PROFESSOR',
                uep: 'olericultura',
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              email: 'userB@ifpe.edu.br',
              nome: 'User B',
              role: 'ALUNO',
              uep: 'fruticultura',
            }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    const DoubleLoginComponent: React.FC = () => {
      const { user, login } = useAuth();
      return (
        <div>
          <div data-testid="user-email">{user ? user.email : 'NENHUM'}</div>
          <button
            data-testid="btn-login-a"
            onClick={() => { login({ email: 'userA@ifpe.edu.br', senha: '123' }).catch(() => {}); }}
          >
            Login A
          </button>
          <button
            data-testid="btn-login-b"
            onClick={() => { login({ email: 'userB@ifpe.edu.br', senha: '123' }).catch(() => {}); }}
          >
            Login B
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <DoubleLoginComponent />
      </AuthProvider>
    );

    // 1. Inicia Login A (que fica pendente na rede)
    act(() => {
      screen.getByTestId('btn-login-a').click();
    });

    // 2. Imediatamente inicia Login B (que resolve rápido)
    await act(async () => {
      screen.getByTestId('btn-login-b').click();
    });

    // O estado e o storage devem ter User B
    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('userB@ifpe.edu.br');
    });
    const storedB = JSON.parse(
      sessionStorage.getItem(APP_CONFIG.storageKeys.session) ||
      localStorage.getItem(APP_CONFIG.storageKeys.session) ||
      '{}'
    );
    expect(storedB.email).toBe('userB@ifpe.edu.br');

    // 3. Agora o Login A resolve tardiamente
    await act(async () => {
      resolveUserAFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          token: tokenA,
          nome: 'User A',
          email: 'userA@ifpe.edu.br',
          role: 'PROFESSOR',
        }),
      });
    });

    // 4. Verificação rigorosa: User B NÃO foi sobrescrito nem no React nem no storage!
    expect(screen.getByTestId('user-email').textContent).toBe('userB@ifpe.edu.br');
    const storedFinal = JSON.parse(
      sessionStorage.getItem(APP_CONFIG.storageKeys.session) ||
      localStorage.getItem(APP_CONFIG.storageKeys.session) ||
      '{}'
    );
    expect(storedFinal.email).toBe('userB@ifpe.edu.br');
    expect(storedFinal.email).not.toBe('userA@ifpe.edu.br');
  });

  it('24. Concorrência: Login Google pendente seguido de logout garante storage estritamente limpo', async () => {
    let resolveGoogleFetch: (value: unknown) => void;
    let resolveAuthMeFetch: (value: unknown) => void;

    const googlePromise = new Promise((resolve) => {
      resolveGoogleFetch = resolve;
    });
    const authMePromise = new Promise((resolve) => {
      resolveAuthMeFetch = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login/google')) {
          return googlePromise;
        }
        if (url.includes('/auth/me')) {
          return authMePromise;
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    const GoogleRaceComponent: React.FC = () => {
      const { user, loginWithGoogle, logout } = useAuth();
      return (
        <div>
          <div data-testid="user-state">{user ? user.email : 'NENHUM'}</div>
          <button
            data-testid="btn-google-race"
            onClick={() => { loginWithGoogle('google-race-token').catch(() => {}); }}
          >
            Google
          </button>
          <button data-testid="btn-google-logout" onClick={logout}>
            Logout
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <GoogleRaceComponent />
      </AuthProvider>
    );

    // Inicia login Google
    act(() => {
      screen.getByTestId('btn-google-race').click();
    });

    // Clica em logout enquanto a requisição Google está em trânsito
    act(() => {
      screen.getByTestId('btn-google-logout').click();
    });

    expect(screen.getByTestId('user-state').textContent).toBe('NENHUM');

    // Google resolve depois do logout
    const googleToken = createTestJwt({ sub: 'google.race@ifpe.edu.br', role: 'ALUNO', exp: Math.floor(Date.now() / 1000) + 3600 });
    await act(async () => {
      resolveGoogleFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          token: googleToken,
          nome: 'Google Race',
          email: 'google.race@ifpe.edu.br',
          role: 'ALUNO',
        }),
      });
    });

    // /api/auth/me resolve
    await act(async () => {
      resolveAuthMeFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'google.race@ifpe.edu.br',
          nome: 'Google Race',
          role: 'ALUNO',
          uep: 'fruticultura',
        }),
      });
    });

    // Storage e React devem permanecer 100% limpos
    expect(screen.getByTestId('user-state').textContent).toBe('NENHUM');
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('25. Nenhuma rota protegida é liberada durante operações de corrida entre login e logout', async () => {
    let resolveLoginFetch: (value: unknown) => void;
    let resolveAuthMeFetch: (value: unknown) => void;

    const loginPromise = new Promise((resolve) => {
      resolveLoginFetch = resolve;
    });
    const authMePromise = new Promise((resolve) => {
      resolveAuthMeFetch = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/csrf')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-token' }),
          });
        }
        if (url.includes('/auth/login')) {
          return loginPromise;
        }
        if (url.includes('/auth/me')) {
          return authMePromise;
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      })
    );

    const ProtectedRaceComponent: React.FC = () => {
      const { login, logout } = useAuth();
      return (
        <div>
          <button
            data-testid="btn-login-admin"
            onClick={() => { login({ email: 'admin@sistema.com', senha: '123' }).catch(() => {}); }}
          >
            Login Admin
          </button>
          <button data-testid="btn-logout-admin" onClick={logout}>
            Logout Admin
          </button>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <ProtectedRaceComponent />
          <Routes>
            <Route path="/login" element={<div>Página de Login Aberta</div>} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<div>Área Secreta do Administrador</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // 1. Clica em Login Admin
    act(() => {
      screen.getByTestId('btn-login-admin').click();
    });

    // 2. Imediatamente clica em Logout Admin
    act(() => {
      screen.getByTestId('btn-logout-admin').click();
    });

    // 3. Resoluções tardias das chamadas de rede
    const adminToken = createTestJwt({ sub: 'admin@sistema.com', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 });
    await act(async () => {
      resolveLoginFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          token: adminToken,
          nome: 'Admin',
          email: 'admin@sistema.com',
          role: 'ADMIN',
        }),
      });
    });

    await act(async () => {
      resolveAuthMeFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'admin@sistema.com',
          nome: 'Admin',
          role: 'ADMIN',
        }),
      });
    });

    // 4. Verificação rigorosa: Área Secreta NUNCA foi renderizada
    expect(screen.queryByText('Área Secreta do Administrador')).not.toBeInTheDocument();
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
    expect(authService.getSession()).toBeNull();
  });
});
