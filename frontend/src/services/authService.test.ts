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
});

