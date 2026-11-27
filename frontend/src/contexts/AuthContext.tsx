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
    const currentRequestId = ++authRequestIdRef.current;

    const initializeAuth = async () => {
      try {
        const activeSession = authService.getSession();
        if (activeSession && activeSession.token) {
          const validated = await authService.validarSessaoAtiva(activeSession, controller.signal);
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
    const currentRequestId = ++authRequestIdRef.current;
    setIsLoading(true);
    try {
      const session = await authService.login(credentials);
      if (currentRequestId === authRequestIdRef.current) {
        setUser(session);
      }
      return session;
    } finally {
      if (currentRequestId === authRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loginWithGoogle = async (credential: string): Promise<UserSession> => {
    const currentRequestId = ++authRequestIdRef.current;
    setIsLoading(true);
    try {
      const session = await authService.loginWithGoogle(credential);
      if (currentRequestId === authRequestIdRef.current) {
        setUser(session);
      }
      return session;
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
        isAuthenticated: Boolean(user?.token),
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
