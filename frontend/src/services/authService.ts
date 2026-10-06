import { APP_CONFIG } from '../config/constants';

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
}

export interface UserSession {
  token: string;
  nome: string;
  email: string;
  role?: 'ADMIN' | 'USUARIO' | 'PROFESSOR' | 'ALUNO' | string;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
}

const STORAGE_KEY = APP_CONFIG.storageKeys.session;

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, senha, rememberMe = false } = credentials;

    let response: Response;
    try {
      response = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/login`, {
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

  async register(data: RegisterData): Promise<{ message: string }> {
    const payload = {
      nome: data.nome.trim(),
      email: data.email.trim(),
      senha: data.senha,
    };

    let response: Response;
    try {
      response = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/registrar`, {
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
      response = await fetch(
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
      response = await fetch(
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
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
  },

  getSession(): UserSession | null {
    try {
      const data =
        localStorage.getItem(STORAGE_KEY) ??
        sessionStorage.getItem(STORAGE_KEY);

      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  },

  isAuthenticated(): boolean {
    const session = this.getSession();
    return Boolean(session?.token);
  },
};
