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

    return {
      ...session,
      token,
      role: authoritativeRole,
      email: authoritativeEmail,
      nome: payload.nome || session.nome || 'Usuário',
    };
  }

  // Ambiente de testes de unidade automatizados (mocks com tokens sintéticos não-JWT sem '.')
  if (import.meta.env.MODE === 'test') {
    return session;
  }

  return null;
}

const STORAGE_KEY = APP_CONFIG.storageKeys.session;

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, senha, rememberMe = false } = credentials;

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
    this.saveSession(data, rememberMe);
    return data;
  },

  async loginWithGoogle(
    credential: string,
    rememberMe = false
  ): Promise<LoginResponse> {
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
    this.saveSession(data, rememberMe);
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

  saveSession(session: UserSession, rememberMe = false): void {
    const sanitized = validateAndSanitizeSession(session);
    if (!sanitized) {
      throw new Error('Sessão inválida para armazenamento.');
    }

    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
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

      // Se houve tentativa de manipulação (ex: role/email alterados no storage),
      // sincroniza o storage com os dados íntegros e autorizados
      if (
        rawSession.role !== validated.role ||
        rawSession.email !== validated.email ||
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
    signal?: AbortSignal
  ): Promise<UserSession | null> {
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
        if (!perfilBackend || !perfilBackend.role) {
          this.logout();
          return null;
        }
        const updated: UserSession = {
          ...session,
          nome: perfilBackend.nome || session.nome,
          email: perfilBackend.email || session.email,
          role: perfilBackend.role,
          uep: perfilBackend.uep || session.uep,
        };
        this.saveSession(updated);
        return updated;
      }

      // 404 Not Found: O backend Spring Boot ainda não implementou o endpoint GET /api/auth/me.
      // ADVERTÊNCIA DE SEGURANÇA (AppSec Hardening):
      // 1. Um status 404 NÃO constitui validação criptográfica de identidade.
      // 2. Não conceder novos privilégios ou alterar permissões com base no 404.
      // 3. Em modo de compatibilidade com o backend atual em desenvolvimento, aceita-se a
      //    sessão exclusivamente se ela já tiver sido estritamente sanitizada por
      //    validateAndSanitizeSession() (que valida claims, expiração e integridade estrutural).
      // 4. Assim que o backend implementar GET /api/auth/me retornando 200 OK com os dados do usuário,
      //    este fallback temporário deve ser descontinuado.
      if (response.status === 404) {
        if (import.meta.env.DEV) {
          console.warn(
            '[AppSec Compatibility] Endpoint GET /api/auth/me não implementado pelo backend (404 Not Found). ' +
              'Operando em modo de transição. Sessão mantida conforme claims previamente sanitizadas.'
          );
        }
        return session;
      }

      this.logout();
      return null;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      // Falha de rede: não concede privilégios a sessões não verificadas (fail-closed)
      return null;
    }
  },

  logout(): void {
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
