import { APP_CONFIG } from '../config/constants';
import { authService } from './authService';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Determina se uma URL corresponde estritamente ao endpoint /auth/me ou /api/auth/me.
 * Utiliza o pathname exato da URL, suportando caminhos relativos, URLs absolutas,
 * query parameters e fragmentos, prevenindo correspondência espúria de substring
 * em rotas de negócio como /api/auth/mensagens, /api/auth/metas, etc.
 */
export function isAuthMeEndpoint(url: string): boolean {
  try {
    const base = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';
    const parsed = new URL(url, base);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    return pathname === '/api/auth/me' || pathname === '/auth/me';
  } catch {
    const cleanPath = url.split(/[?#]/)[0].replace(/\/+$/, '');
    return cleanPath.endsWith('/api/auth/me') || cleanPath.endsWith('/auth/me');
  }
}

export const apiClient = {
  baseUrl: APP_CONFIG.apiBaseUrl,

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = 15000, skipAuth = false, headers = {}, ...customConfig } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fullUrl = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const session = authService.getSession();
      if (session?.token) {
        requestHeaders['Authorization'] = `Bearer ${session.token}`;
      }
    }

    try {
      const response = await fetch(fullUrl, {
        ...customConfig,
        headers: requestHeaders,
        signal: controller.signal,
      });

      // 401 Unauthorized: token expirado, ausente ou inválido -> encerra sessão
      if (response.status === 401 && !skipAuth) {
        authService.logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        throw new ApiError('Sessão expirada. Por favor, autentique-se novamente.', 401);
      }

      // 403 Forbidden: 
      // Exceção: no endpoint /auth/me, 403 significa rejeição da autenticação/assinatura pelo Spring Security
      if (response.status === 403 && !skipAuth) {
        if (isAuthMeEndpoint(fullUrl)) {
          authService.logout();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
          throw new ApiError('Sessão inválida ou rejeitada. Por favor, autentique-se novamente.', 403);
        }

        // Para operações de negócio comuns, lança ApiError preservando a sessão do usuário
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          errorData?.erro ||
          'Acesso negado: você não tem permissão para realizar esta operação.';
        throw new ApiError(errorMessage, 403, errorData);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          errorData?.erro ||
          `Erro ${response.status}: Requisição falhou.`;
        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Se a resposta for 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(
          'A requisição excedeu o tempo limite (timeout). Verifique sua conexão.',
          408
        );
      }
      throw new ApiError(
        'Não foi possível comunicar com o servidor. Verifique sua conexão com a internet.',
        0,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
