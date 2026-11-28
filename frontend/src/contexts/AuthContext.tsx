import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authService, LoginCredentials, UserSession } from '../services/authService';

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserSession>;
  loginWithGoogle: (credential: string) => Promise<UserSession>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authRequestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const currentRequestId = authService.nextRequestId();
    authRequestIdRef.current = currentRequestId;

    const initializeAuth = async () => {
      try {
        const activeSession = authService.getSession();
        if (activeSession && activeSession.token) {
          const validated = await authService.validarSessaoAtiva(activeSession, {
            signal: controller.signal,
            requestId: currentRequestId,
            isCurrent: () => isMounted && currentRequestId === authRequestIdRef.current,
            persist: true,
          });
          if (isMounted && currentRequestId === authRequestIdRef.current) {
            setUser(validated);
          }
        } else {
          if (isMounted && currentRequestId === authRequestIdRef.current) {
            setUser(null);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Requisição cancelada por desmontagem; nenhuma atualização de estado deve ocorrer
          return;
        }
        console.error('Falha ao validar sessão de autenticação com o backend:', err);
        // Fail-closed: se falhar ou houver exceção, expurga sessão e impede acesso
        authService.logout();
        if (isMounted && currentRequestId === authRequestIdRef.current) {
          setUser(null);
        }
      } finally {
        if (isMounted && currentRequestId === authRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<UserSession> => {
    const currentRequestId = authService.nextRequestId();
    authRequestIdRef.current = currentRequestId;
    setIsLoading(true);
    try {
      // 1. Autenticação de credenciais via POST /api/auth/login
      const session = await authService.login(credentials);

      // Verificação do identificador de requisição após a chamada assíncrona inicial
      if (currentRequestId !== authRequestIdRef.current) {
        throw new Error('Operação de autenticação cancelada ou substituída.');
      }

      // 2. Validação ativa obrigatória do token contra o endpoint autoritativo GET /api/auth/me
      const validated = await authService.validarSessaoAtiva(session, {
        requestId: currentRequestId,
        isCurrent: () => currentRequestId === authRequestIdRef.current,
        persist: true,
      });

      // Verificação do identificador de requisição após a validação autoritativa
      if (currentRequestId !== authRequestIdRef.current) {
        throw new Error('Operação de autenticação cancelada ou substituída.');
      }

      if (!validated) {
        authService.logout();
        throw new Error('Não foi possível validar o perfil autoritativo do usuário junto ao servidor.');
      }

      // 3. Somente preenche o estado user após confirmação do perfil pelo backend
      setUser(validated);
      return validated;
    } finally {
      if (currentRequestId === authRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loginWithGoogle = async (credential: string): Promise<UserSession> => {
    const currentRequestId = authService.nextRequestId();
    authRequestIdRef.current = currentRequestId;
    setIsLoading(true);
    try {
      // 1. Autenticação de credencial via POST /api/auth/login/google
      const session = await authService.loginWithGoogle(credential);

      // Verificação do identificador de requisição após a chamada assíncrona inicial
      if (currentRequestId !== authRequestIdRef.current) {
        throw new Error('Operação de autenticação cancelada ou substituída.');
      }

      // 2. Validação ativa obrigatória do token contra o endpoint autoritativo GET /api/auth/me
      const validated = await authService.validarSessaoAtiva(session, {
        requestId: currentRequestId,
        isCurrent: () => currentRequestId === authRequestIdRef.current,
        persist: true,
      });

      // Verificação do identificador de requisição após a validação autoritativa
      if (currentRequestId !== authRequestIdRef.current) {
        throw new Error('Operação de autenticação cancelada ou substituída.');
      }

      if (!validated) {
        authService.logout();
        throw new Error('Não foi possível validar o perfil autoritativo da conta Google junto ao servidor.');
      }

      // 3. Somente preenche o estado user após confirmação do perfil pelo backend
      setUser(validated);
      return validated;
    } finally {
      if (currentRequestId === authRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const logout = (): void => {
    authRequestIdRef.current++;
    authService.logout();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && user.token && user.role),
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
};
