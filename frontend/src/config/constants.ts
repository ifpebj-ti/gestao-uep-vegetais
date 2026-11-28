import packageJson from '../../package.json';

export const APP_CONFIG = {
  name: 'Terrarium',
  subtitle: 'Gestão de UEPs - Vegetais',
  version: packageJson.version,
  institution: 'IFPE Campus Belo Jardim',
  apiBaseUrl: (() => {
    // Se estiver rodando no navegador na porta padrão (Nginx/Docker), usa proxy relativo /api
    if (typeof window !== 'undefined' && (!window.location.port || window.location.port === '80')) {
      return '/api';
    }
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
      ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
      : '/api';
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  })(),
  storageKeys: {
    session: 'terrarium_auth_session_v2',
  },
} as const;
