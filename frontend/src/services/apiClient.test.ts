import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, ApiError } from './apiClient';
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

  it('deve tratar requisições POST com serialização JSON de dados', async () => {
    const payload = { nome: 'Novo Canteiro', setor: 'Hortaliças' };
    const mockFetch = vi.fn().mockResolvedValue({
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
