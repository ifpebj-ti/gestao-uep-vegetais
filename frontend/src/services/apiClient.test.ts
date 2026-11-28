import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, ApiError, isAuthMeEndpoint } from './apiClient';
import { authService } from './authService';

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve identificar estritamente o endpoint /auth/me sem falsos positivos em rotas de negócio', () => {
    expect(isAuthMeEndpoint('/api/auth/me')).toBe(true);
    expect(isAuthMeEndpoint('/auth/me')).toBe(true);
    expect(isAuthMeEndpoint('/api/auth/me/')).toBe(true);
    expect(isAuthMeEndpoint('/api/auth/me?cache=false&t=123')).toBe(true);
    expect(isAuthMeEndpoint('http://localhost:8080/api/auth/me')).toBe(true);
    expect(isAuthMeEndpoint('http://localhost:8080/api/auth/me?token=xyz#section')).toBe(true);

    // Rotas de negócio que compartilham o prefixo /api/auth/me... NUNCA devem ser confundidas
    expect(isAuthMeEndpoint('/api/auth/mensagens')).toBe(false);
    expect(isAuthMeEndpoint('/api/auth/metas')).toBe(false);
    expect(isAuthMeEndpoint('/api/auth/membership')).toBe(false);
    expect(isAuthMeEndpoint('/api/auth/me/detalhes')).toBe(false);
    expect(isAuthMeEndpoint('http://localhost:8080/api/auth/mensagens?id=1')).toBe(false);
  });

  it('não deve deslogar o usuário quando receber 403 em rotas como /api/auth/mensagens', async () => {
    authService.saveSession({
      token: 'jwt-professor-valido',
      nome: 'Prof. George',
      email: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ erro: 'Acesso negado às mensagens restritas' }),
      })
    );

    await expect(apiClient.get('/auth/mensagens')).rejects.toThrow(ApiError);
    // A sessão DEVE continuar ativa, sem logout indevido
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getSession()?.email).toBe('george@belojardim.ifpe.edu.br');
  });

  it('deve injetar cabeçalho Authorization com Bearer token quando o usuário estiver autenticado', async () => {
    authService.saveSession({
      token: 'jwt-token-autenticado',
      nome: 'Prof. George',
      email: 'george@ifpe.edu.br',
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ sucesso: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const data = await apiClient.get<{ sucesso: boolean }>('/canteiros');

    expect(data).toEqual({ sucesso: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/canteiros'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token-autenticado',
        }),
      })
    );
  });

  it('não deve injetar Authorization quando skipAuth for verdadeiro', async () => {
    authService.saveSession({
      token: 'jwt-token-autenticado',
      nome: 'Prof. George',
      email: 'george@ifpe.edu.br',
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ publico: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await apiClient.get('/info-publica', { skipAuth: true });

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it('deve deslogar o usuário e lançar ApiError(401) quando receber 401 Unauthorized', async () => {
    authService.saveSession({
      token: 'jwt-expirado',
      nome: 'Prof. George',
      email: 'george@ifpe.edu.br',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token expirado' }),
      })
    );

    await expect(apiClient.get('/canteiros')).rejects.toThrow(ApiError);
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('deve lançar ApiError(403) mantendo a sessão ativa quando receber 403 Forbidden em rota de negócio', async () => {
    authService.saveSession({
      token: 'jwt-valido-aluno',
      nome: 'Aluno Teste',
      email: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ erro: 'Apenas professores podem alterar configurações de canteiro.' }),
      })
    );

    await expect(apiClient.get('/canteiros/config')).rejects.toThrow(ApiError);
    // A sessão NÃO deve ser destruída por um 403 em rota de negócio
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getSession()?.email).toBe('aluno@discente.ifpe.edu.br');
  });

  it('deve deslogar o usuário e lançar ApiError(403) quando receber 403 Forbidden no endpoint /auth/me', async () => {
    authService.saveSession({
      token: 'jwt-forjado',
      nome: 'Invasor',
      email: 'invasor@ifpe.edu.br',
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

    await expect(apiClient.get('/auth/me')).rejects.toThrow(ApiError);
    // No endpoint /auth/me, o 403 indica token forjado/rejeitado, devendo expurgar a sessão
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('deve tratar requisições POST com serialização JSON de dados', async () => {
    const payload = { nome: 'Novo Canteiro', setor: 'Hortaliças' };
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'csrf-test-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'c-10', ...payload }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient.post('/canteiros', payload);

    expect(result).toEqual({ id: 'c-10', ...payload });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/canteiros'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });
});
