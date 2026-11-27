import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService, UserSession } from './authService';
import { APP_CONFIG } from '../config/constants';

describe('authService', () => {
  const mockSession: UserSession = {
    token: 'jwt-mock-token-xyz',
    nome: 'Maria Silva',
    email: 'maria@ifpe.edu.br',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve salvar a sessão temporária no sessionStorage por padrão', () => {
    authService.saveSession(mockSession);

    const stored = sessionStorage.getItem(APP_CONFIG.storageKeys.session);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(mockSession);
    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
  });

  it('deve salvar a sessão no localStorage quando lembrar-me estiver ativo', () => {
    authService.saveSession(mockSession, true);

    expect(localStorage.getItem(APP_CONFIG.storageKeys.session)).not.toBeNull();
    expect(sessionStorage.getItem(APP_CONFIG.storageKeys.session)).toBeNull();
  });

  it('deve retornar a sessão ativa através de getSession', () => {
    authService.saveSession(mockSession);

    const session = authService.getSession();
    expect(session).toEqual(mockSession);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('deve retornar null para getSession se não houver dados salvos', () => {
    const session = authService.getSession();
    expect(session).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('deve limpar o storage ao executar logout', () => {
    authService.saveSession(mockSession);
    expect(authService.isAuthenticated()).toBe(true);

    authService.logout();
    expect(authService.getSession()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('deve autenticar com sucesso e salvar a sessão no login', async () => {
    const mockResponse = {
      token: 'jwt-123456',
      nome: 'Maria Silva',
      email: 'maria@ifpe.edu.br',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })
    );

    const response = await authService.login({
      email: 'maria@ifpe.edu.br',
      senha: 'senha-secreta',
    });

    expect(response).toEqual(mockResponse);
    expect(authService.getSession()).toEqual(mockResponse);
  });

  it('deve lançar erro apropriado para credenciais inválidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Acesso negado' }),
      })
    );

    await expect(
      authService.login({
        email: 'invalido@ifpe.edu.br',
        senha: 'errada',
      })
    ).rejects.toThrow('E-mail ou senha incorretos.');
  });

  it('deve registrar usuário com sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
      })
    );

    const result = await authService.register({
      nome: 'Isabela',
      email: 'isabela@ifpe.edu.br',
      senha: 'minhasenhasegura',
    });

    expect(result).toEqual({ message: 'Conta criada com sucesso!' });
  });

  it('deve lançar erro caso o e-mail já esteja cadastrado (409)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ erro: 'E-mail já cadastrado' }),
      })
    );

    await expect(
      authService.register({
        nome: 'Isabela',
        email: 'isabela@ifpe.edu.br',
        senha: 'minhasenhasegura',
      })
    ).rejects.toThrow('Este e-mail já está cadastrado.');
  });

  it('deve confirmar e-mail com token válido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'E-mail ativado!' }),
      })
    );

    const result = await authService.confirmEmail('token-123');
    expect(result).toEqual({ message: 'E-mail ativado!' });
  });

  it('deve lançar erro ao confirmar e-mail com token inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ erro: 'Token inválido' }),
      })
    );

    await expect(authService.confirmEmail('token-invalido')).rejects.toThrow(
      'Token inválido'
    );
  });

  it('deve reenviar e-mail de confirmação com sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Novo e-mail enviado' }),
      })
    );

    const result = await authService.resendConfirmation('isabela@ifpe.edu.br');
    expect(result).toEqual({ message: 'Novo e-mail enviado' });
  });

  it('deve autenticar com Google e salvar a sessÃ£o', async () => {
    const mockResponse = {
      token: 'jwt-google',
      nome: 'Ana Beatriz',
      email: 'ana@discente.ifpe.edu.br',
      role: 'ALUNO',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })
    );

    const response = await authService.loginWithGoogle('id-token-google');

    expect(response).toEqual(mockResponse);
    expect(authService.getSession()).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      `${APP_CONFIG.apiBaseUrl}/auth/login/google`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ credential: 'id-token-google' }),
      })
    );
  });

  it('deve informar quando o Google rejeitar conta nao institucional', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ erro: 'Use uma conta Google institucional' }),
      })
    );

    await expect(authService.loginWithGoogle('id-token-pessoal')).rejects.toThrow(
      'Use uma conta Google institucional'
    );
  });

  describe('Auditoria de Segurança — Correções Críticas', () => {
    // Função auxiliar para gerar JWT mock assinado estruturado
    const buildMockJwt = (sub: string, role: string, expOffsetSec = 3600) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub,
          role,
          nome: 'Usuario Teste',
          exp: Math.floor(Date.now() / 1000) + expOffsetSec,
        })
      );
      return `${header}.${payload}.assinatura-simulada`;
    };

    it('SEGURANÇA: deve usar exclusivamente o backend para autenticar', async () => {

      const mockBackendResponse = {
        token: buildMockJwt('admin.backend@ifpe.edu.br', 'ADMIN'),
        nome: 'Admin Real',
        email: 'admin.backend@ifpe.edu.br',
        role: 'ADMIN',
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBackendResponse,
      });
      vi.stubGlobal('fetch', fetchSpy);

      const session = await authService.login({
        email: 'admin.backend@ifpe.edu.br',
        senha: 'qualquer-senha',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        `${APP_CONFIG.apiBaseUrl}/auth/login`,
        expect.any(Object)
      );
      expect(session.role).toBe('ADMIN');
      expect(session.token).toBe(mockBackendResponse.token);
    });

    it('SEGURANÇA: deve impedir escalonamento de privilégios quando usuário altera role no localStorage', () => {
      // Usuário autenticado como ALUNO via JWT legítimo do backend
      const studentJwt = buildMockJwt('aluno.teste@discente.ifpe.edu.br', 'ALUNO');
      const legitimateSession: UserSession = {
        token: studentJwt,
        nome: 'Aluno Teste',
        email: 'aluno.teste@discente.ifpe.edu.br',
        role: 'ALUNO',
      };

      authService.saveSession(legitimateSession);

      // Invasor altera manualmente o localStorage para se passar por ADMIN
      const tamperedSession = {
        token: studentJwt,
        nome: 'Aluno Teste',
        email: 'admin.teste@ifpe.edu.br',
        role: 'ADMIN',
      };
      sessionStorage.setItem(APP_CONFIG.storageKeys.session, JSON.stringify(tamperedSession));

      // Ao recuperar a sessão, a integridade do JWT prevalece sobre a adulteração do storage
      const activeSession = authService.getSession();
      expect(activeSession).not.toBeNull();
      expect(activeSession?.role).toBe('ALUNO');
      expect(activeSession?.email).toBe('aluno.teste@discente.ifpe.edu.br');
    });

    it('SEGURANÇA: deve invalidar sessão se o token JWT estiver expirado', () => {
      // JWT expirado há 10 segundos
      const expiredJwt = buildMockJwt('aluno.teste@discente.ifpe.edu.br', 'ALUNO', -10);
      sessionStorage.setItem(
        APP_CONFIG.storageKeys.session,
        JSON.stringify({
          token: expiredJwt,
          nome: 'Aluno Expirado',
          email: 'aluno.teste@discente.ifpe.edu.br',
          role: 'ALUNO',
        })
      );

      const session = authService.getSession();
      expect(session).toBeNull();
    });

  });
});

