export const APP_CONFIG = {
  name: 'Terrarium',
  subtitle: 'Gestão de UEPs - Vegetais',
  version: '1.0.0',
  institution: 'IFPE Campus Belo Jardim',
  apiBaseUrl: (() => {
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
      ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
      : 'http://localhost:8080/api';
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  })(),
  storageKeys: {
    session: 'terrarium_auth_session',
  },
} as const;
