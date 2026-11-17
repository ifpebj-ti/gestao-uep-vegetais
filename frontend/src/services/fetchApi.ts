import { APP_CONFIG } from '../config/constants';

const CSRF_HEADER = 'X-XSRF-TOKEN';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

let csrfRequest: Promise<string> | undefined;

async function requestCsrfToken(): Promise<string> {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/csrf`, {
    credentials: 'include',
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error('Não foi possível obter o token CSRF.');
  }

  const data: { headerName?: unknown; token?: unknown } | null = await response.json();
  if (data?.headerName !== CSRF_HEADER || typeof data.token !== 'string' || !data.token) {
    throw new Error('O servidor retornou um token CSRF inválido.');
  }
  return data.token;
}

function csrfToken(signal?: AbortSignal | null): Promise<string> {
  signal?.throwIfAborted();
  // Compartilha somente buscas simultâneas, que poderiam criar cookies diferentes.
  const pending = (csrfRequest ??= requestCsrfToken().finally(() => {
    csrfRequest = undefined;
  }));
  if (!signal) return pending;

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    void pending.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}

export async function fetchApi(url: string, options: RequestInit = {}): Promise<Response> {
  const apiOrigin = new URL(APP_CONFIG.apiBaseUrl, window.location.href).origin;
  if (new URL(url, window.location.href).origin !== apiOrigin) {
    throw new Error('A URL não pertence à origem configurada para a API.');
  }

  const request: RequestInit = { ...options, credentials: 'include' };
  if (SAFE_METHODS.has((request.method ?? 'GET').toUpperCase())) {
    return fetch(url, request);
  }

  const headers = new Headers(request.headers);
  headers.set(CSRF_HEADER, await csrfToken(request.signal));
  return fetch(url, { ...request, headers });
}
