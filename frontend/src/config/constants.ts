export const APP_CONFIG = {
  name: 'Terrarium',
  subtitle: 'Gestão de UEPs - Vegetais',
  version: '1.0.0',
  institution: 'IFPE Campus Belo Jardim',
  apiBaseUrl: (() => {
    // Se estiver rodando no navegador na porta padrão (Nginx/Docker), usa proxy relativo /api
    if (typeof window !== 'undefined' && (!window.location.port || window.location.port === '80')) {
      return '/api';
    }
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
      ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
      : '/api';
    // Substitui localhost:8080 por 127.0.0.1:8080 para evitar ERR_CONNECTION_RESET do IPv6 no Windows
    const safeUrl = envUrl.replace('//localhost:8080', '//127.0.0.1:8080');
    return safeUrl.endsWith('/api') ? safeUrl : `${safeUrl}/api`;
  })(),
  storageKeys: {
    session: 'terrarium_auth_session',
  },
} as const;
