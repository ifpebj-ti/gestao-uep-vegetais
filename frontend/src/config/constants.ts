import frontendPackage from '../../package.json';

const RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const appVersion = frontendPackage.version.trim();

if (!RELEASE_VERSION_PATTERN.test(appVersion)) {
  throw new Error(`Invalid frontend release version: ${appVersion}`);
}

export const APP_CONFIG = {
  name: 'Terrarium',
  subtitle: 'Gestão de UEPs - Vegetais',
  version: appVersion,
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
