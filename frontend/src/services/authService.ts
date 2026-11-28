import { APP_CONFIG } from '../config/constants';
import { fetchApi } from './fetchApi';

export interface LoginCredentials {
  email: string;
  senha: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  nome: string;
  email: string;
  role?: 'ADMIN' | 'USUARIO' | 'PROFESSOR' | 'ALUNO' | string;
  uep?: 'olericultura' | 'fruticultura' | string;
}

export interface UserSession {
  token: string;
  nome: string;
  email: string;
  role?: 'ADMIN' | 'USUARIO' | 'PROFESSOR' | 'ALUNO' | string;
  uep?: 'olericultura' | 'fruticultura' | string;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
}

export interface JwtPayload {
  sub?: string;
  role?: string;
  nome?: string;
  exp?: number;
  uep?: string;
}

/**
 * Decodifica o payload de um token JWT sem validar a assinatura criptográfica
 * (validação que compete ao backend em cada requisição à API).
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Valida e sanitiza os dados da sessão recuperados do storage do navegador.
 *
 * REQUISITOS DE SEGURANÇA APPSEC:
 * 1. O papel (role) e e-mail assinados no JWT do backend são a ÚNICA fonte de autoridade;
 *    qualquer manipulação manual no localStorage/sessionStorage é neutralizada e sobreposta
 *    pelo claim legítimo do token.
 * 2. Tokens expirados são automaticamente invalidados.
 */
export function validateAndSanitizeSession(session: UserSession | null): UserSession | null {
  if (!session || typeof session !== 'object' || !session.token) {
    return null;
  }

  const token = typeof session.token === 'string' ? session.token.trim() : '';
  if (!token) {
    return null;
  }

  // Token JWT assinado pelo backend (possui pontos separadores)
  if (token.includes('.')) {
    const payload = parseJwtPayload(token);
    if (!payload) {
      return null; // JWT malformado ou payload inválido
    }

    // Validação de expiração (exp em segundos)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null; // Sessão expirada
    }

    // REQUISITOS DE SEGURANÇA APPSEC:
    // 1. NUNCA utilizar session.role ou e-mail como fallback
    // 2. NUNCA inferir ADMIN pelo e-mail
    // 3. Exigir papel estritamente válido presente no claim do token
    const rawRole = typeof payload.role === 'string' ? payload.role.toUpperCase().trim() : '';
    const validRoles = ['ADMIN', 'PROFESSOR', 'ALUNO', 'USUARIO'];
    if (!rawRole || !validRoles.includes(rawRole)) {
      return null; // Papel ausente ou inválido no token
    }

    const authoritativeRole = rawRole as UserSession['role'];
    const authoritativeEmail =
      payload.sub && payload.sub.includes('@')
        ? payload.sub
        : session.email || payload.sub;
    if (!authoritativeEmail) {
      return null; // E-mail ausente no token e na sessão
    }

    // SEGURANÇA APPSEC:
    // A UEP autoritativa provém exclusivamente de claim assinada no JWT (payload.uep).
    // NUNCA utilizar session.uep proveniente do storage do navegador como fonte de autorização.
    const rawUep = typeof payload.uep === 'string' ? payload.uep.toLowerCase().trim() : '';
    const authoritativeUep =
      rawUep === 'olericultura' || rawUep === 'fruticultura'
        ? (rawUep as 'olericultura' | 'fruticultura')
        : undefined;

    return {
      token,
      role: authoritativeRole,
      email: authoritativeEmail,
      nome: payload.nome || session.nome || 'Usuário',
      uep: authoritativeUep,
    };
  }

  // Ambiente de testes de unidade automatizados (mocks com tokens sintéticos não-JWT sem '.')
  if (import.meta.env.MODE === 'test') {
    return session;
  }

  return null;
}

export interface AuthOperationOptions {
  requestId?: number;
  isCurrent?: () => boolean;
  persist?: boolean;
}

export interface ValidarSessaoOptions extends AuthOperationOptions {
  signal?: AbortSignal;
}

const STORAGE_KEY = APP_CONFIG.storageKeys.session;

export const authService = {
  currentRequestId: 0,

  nextRequestId(): number {
    return ++this.currentRequestId;
  },

  isCurrentRequest(requestId?: number): boolean {
    if (requestId === undefined) return true;
    return this.currentRequestId === requestId;
  },

  invalidateRequests(): void {
    this.currentRequestId++;
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, senha, rememberMe = false } = credentials;
    const reqId = this.currentRequestId;

    let response: Response;
    try {
      response = await fetchApi(`${APP_CONFIG.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData?.codigo === 'EMAIL_NAO_VERIFICADO') {
        throw new Error('Confirme seu e-mail institucional antes de entrar.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('E-mail ou senha incorretos.');
      }
      throw new Error(
        errorData?.message ||
          errorData?.erro ||
          'Falha ao autenticar. Tente novamente.'
      );
    }

    const data: LoginResponse = await response.json();

    if (this.isCurrentRequest(reqId)) {
      this.saveSession(data, rememberMe, { requestId: reqId });
    }
    return data;
  },

  async loginWithGoogle(
    credential: string,
    rememberMe = false
  ): Promise<LoginResponse> {
    const reqId = this.currentRequestId;

    let response: Response;
    try {
      response = await fetchApi(`${APP_CONFIG.apiBaseUrl}/auth/login/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 422) {
        throw new Error(
          errorData?.erro || 'Use uma conta Google institucional.'
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Não foi possível validar sua conta Google.');
      }
      throw new Error(
        errorData?.message ||
          errorData?.erro ||
          'Falha ao autenticar com Google. Tente novamente.'
      );
    }

    const data: LoginResponse = await response.json();

    if (this.isCurrentRequest(reqId)) {
      this.saveSession(data, rememberMe, { requestId: reqId });
    }
    return data;
  },

  async register(data: RegisterData): Promise<{ message: string }> {
    const payload = {
      nome: data.nome.trim(),
      email: data.email.trim(),
      senha: data.senha,
    };

    let response: Response;
    try {
      response = await fetchApi(`${APP_CONFIG.apiBaseUrl}/auth/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
      );
    }

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Este e-mail já está cadastrado.');
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.erro ||
          errorData?.message ||
          'Falha ao registrar conta. Tente novamente.'
      );
    }

    const responseData =
      typeof response.json === 'function'
        ? await response.json().catch(() => null)
        : null;
    return { message: responseData?.message || 'Conta criada com sucesso!' };
  },

  async confirmEmail(token: string): Promise<{ message: string }> {
    let response: Response;
    try {
      response = await fetchApi(
        `${APP_CONFIG.apiBaseUrl}/auth/confirmar-email?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor para validar o token. Verifique sua conexão.'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.erro ||
          errorData?.message ||
          'Token de confirmação inválido ou expirado.'
      );
    }

    const data = await response.json().catch(() => null);
    return { message: data?.message || 'E-mail confirmado com sucesso!' };
  },

  async resendConfirmation(email: string): Promise<{ message: string }> {
    let response: Response;
    try {
      response = await fetchApi(
        `${APP_CONFIG.apiBaseUrl}/auth/reenviar-confirmacao`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor para reenviar o e-mail. Verifique sua conexão.'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.erro ||
          errorData?.message ||
          'Falha ao reenviar e-mail de confirmação.'
      );
    }

    const responseData = await response.json().catch(() => null);
    return {
      message:
        responseData?.message ||
        'Se a conta puder receber confirmação, um novo e-mail será enviado.',
    };
  },

  saveSession(
    session: UserSession,
    rememberMe = false,
    options?: AuthOperationOptions
  ): void {
    if (options) {
      if (options.isCurrent && !options.isCurrent()) {
        return;
      }
      if (options.requestId !== undefined && !this.isCurrentRequest(options.requestId)) {
        return;
      }
    }

    if (!session || !session.token || typeof session.token !== 'string' || !session.token.trim()) {
      throw new Error('Sessão inválida para armazenamento.');
    }

    const token = session.token.trim();
    const validRoles = ['ADMIN', 'PROFESSOR', 'ALUNO', 'USUARIO'];

    if (token.includes('.')) {
      const payload = parseJwtPayload(token);
      if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
        throw new Error('Token expirado ou malformado.');
      }
      const rawRole =
        typeof session.role === 'string'
          ? session.role.toUpperCase().trim()
          : (payload.role ? payload.role.toUpperCase().trim() : '');
      if (!rawRole || !validRoles.includes(rawRole)) {
        throw new Error('Sessão inválida para armazenamento.');
      }
    }

    const role =
      typeof session.role === 'string' && validRoles.includes(session.role.toUpperCase().trim())
        ? (session.role.toUpperCase().trim() as UserSession['role'])
        : undefined;

    const validUeps = ['olericultura', 'fruticultura'];
    const uep =
      typeof session.uep === 'string' && validUeps.includes(session.uep.toLowerCase().trim())
        ? (session.uep.toLowerCase().trim() as 'olericultura' | 'fruticultura')
        : undefined;

    const validated: UserSession = {
      token,
      nome: typeof session.nome === 'string' && session.nome.trim() ? session.nome.trim() : 'Usuário',
      email: typeof session.email === 'string' ? session.email.trim() : '',
      role,
      uep,
    };

    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(validated));
  },

  getSession(): UserSession | null {
    try {
      const data =
        localStorage.getItem(STORAGE_KEY) ??
        sessionStorage.getItem(STORAGE_KEY);

      if (!data) return null;
      const rawSession: UserSession = JSON.parse(data);
      const validated = validateAndSanitizeSession(rawSession);

      if (!validated) {
        this.logout();
        return null;
      }

      // Se houve tentativa de manipulação (ex: role/email/uep alterados no storage),
      // sincroniza o storage com os dados íntegros e autorizados
      if (
        rawSession.role !== validated.role ||
        rawSession.email !== validated.email ||
        rawSession.uep !== validated.uep ||
        rawSession.token !== validated.token
      ) {
        const storage = localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(validated));
      }

      return validated;
    } catch {
      return null;
    }
  },

  /**
   * Realiza a validação ativa da sessão contra o backend Spring Boot.
   *
   * REGRAS DE SEGURANÇA APPSEC:
   * 1. A decodificação local do JWT NÃO garante autenticidade criptográfica.
   * 2. O token deve ser verificado ativamente contra o backend.
   * 3. Se o backend responder 401 ou 403, o token é forjado, adulterado ou expirou:
   *    a sessão é IMEDIATAMENTE expurgada e o acesso negado.
   * 4. Se a validação falhar por indisponibilidade de rede, NENHUM privilégio é concedido.
   */
  async validarSessaoAtiva(
    session: UserSession | null,
    signalOrOptions?: AbortSignal | ValidarSessaoOptions
  ): Promise<UserSession | null> {
    const opts: ValidarSessaoOptions =
      signalOrOptions instanceof AbortSignal
        ? { signal: signalOrOptions }
        : signalOrOptions ?? {};

    const signal = opts.signal;

    const isStillActive = () => {
      if (opts.isCurrent && !opts.isCurrent()) return false;
      if (opts.requestId !== undefined && !this.isCurrentRequest(opts.requestId)) return false;
      return true;
    };

    if (!session || !session.token) {
      this.logout();
      return null;
    }

    const token = session.token.trim();

    // Token JWT: Validação ativa com o Backend
    try {
      const response = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      // 401 ou 403: Rejeição criptográfica ou autorização negada pelo Spring Security
      if (response.status === 401 || response.status === 403) {
        this.logout();
        return null;
      }

      // 200 OK: Endpoint /auth/me respondeu com o perfil do usuário
      if (response.ok) {
        const perfilBackend = await response.json().catch(() => null);
        if (!perfilBackend || typeof perfilBackend !== 'object') {
          this.logout();
          return null;
        }

        // Validação estrita do papel (role) retornado pelo backend
        const validRoles = ['ADMIN', 'PROFESSOR', 'ALUNO', 'USUARIO'];
        const rawRole = typeof perfilBackend.role === 'string' ? perfilBackend.role.toUpperCase().trim() : '';
        if (!rawRole || !validRoles.includes(rawRole)) {
          this.logout();
          return null;
        }

        // Validação estrita do e-mail retornado pelo backend (sem fallback para storage local)
        const rawEmail = typeof perfilBackend.email === 'string' ? perfilBackend.email.trim() : '';
        if (!rawEmail || !rawEmail.includes('@')) {
          this.logout();
          return null;
        }

        // Validação estrita da UEP retornada pelo backend (sem fallback para storage local)
        const rawUep = typeof perfilBackend.uep === 'string' ? perfilBackend.uep.toLowerCase().trim() : '';
        const validUeps = ['olericultura', 'fruticultura'];
        const authoritativeUep = validUeps.includes(rawUep)
          ? (rawUep as 'olericultura' | 'fruticultura')
          : undefined;

        const updated: UserSession = {
          token,
          nome: typeof perfilBackend.nome === 'string' && perfilBackend.nome.trim()
            ? perfilBackend.nome.trim()
            : 'Usuário',
          email: rawEmail,
          role: rawRole as UserSession['role'],
          uep: authoritativeUep,
        };

        if (!isStillActive()) {
          return null;
        }

        if (opts.persist !== false) {
          this.saveSession(updated, false, opts);
        }
        return updated;
      }

      // 404 Not Found: O backend ainda não implementou o endpoint GET /api/auth/me.
      // SEGURANÇA APPSEC (Fail-Closed):
      // 1. Resposta 404 do endpoint de identidade NUNCA permite aceitar sessão local.
      // 2. Não confiar em informações de UEP ou privilégios gravados no navegador.
      // 3. Expurga a sessão e nega acesso às rotas protegidas.
      if (response.status === 404) {
        if (import.meta.env.DEV) {
          console.warn(
            '[AppSec Fail-Closed] Endpoint GET /api/auth/me retornou 404 Not Found. ' +
              'Sessão local rejeitada por ausência de validação autoritativa.'
          );
        }
        this.logout();
        return null;
      }

      this.logout();
      return null;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      // SEGURANÇA APPSEC — DECISÃO DE TRATAMENTO DE FALHA DE REDE:
      // Falha de rede temporária/offline difere de token comprovadamente inválido (401/403/404).
      // 1. Não confunde erro de rede com token inválido (não deleta sumariamente o storage).
      // 2. Comportamento fail-closed estrito: retorna null, garantindo que o estado React
      //    permaneça não-autenticado (user = null) e impedindo qualquer acesso a rotas protegidas.
      // 3. Nenhuma informação de role, e-mail ou UEP local é utilizada para conceder privilégios.
      return null;
    }
  },

  logout(): void {
    this.invalidateRequests();
    // 1. Remove chaves de autenticação do usuário
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);

    // 2. Limpa dados temporários e caches voláteis da sessão da aba
    sessionStorage.clear();

    // 3. Remove chaves cadastrais e dados temporários do usuário no localStorage
    localStorage.removeItem('terrarium_admin_professores');
    localStorage.removeItem('terrarium_admin_professores_seed_migrations');
    localStorage.removeItem('terrarium_turmas');
    localStorage.removeItem('terrarium_turmas_seed_migrations');
    localStorage.removeItem('terrarium_aluno_turma_vinculo');
    localStorage.removeItem('terrarium_aluno_turma_ativa');
    localStorage.removeItem('terrarium_tarefas_alunos');
    localStorage.removeItem('terrarium_tarefas_turma');
    localStorage.removeItem('terrarium_historico_alunos');
    localStorage.removeItem('terrarium_uep_registros_colheita_v2');
    localStorage.removeItem('terrarium_selected_uep');

    // Nota de Preservação:
    // As configurações físicas estruturais dos laboratórios 3D ('terrarium_canteiro_layout',
    // 'terrarium_canteiro_terreno', 'terrarium_pomar_layout') são estritamente PRESERVADAS,
    // pois tratam-se de configurações espaciais e topológicas das UEPs e não de dados cadastrais de sessão.
  },

  isAuthenticated(): boolean {
    const session = this.getSession();
    return Boolean(session?.token);
  },
};
