export const APP_CONFIG = {
  name: 'Terrarium',
  subtitle: 'Gestão UEP Vegetais',
  version: '1.0.0',
  institution: 'IFPE Campus Belo Jardim',
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8080/api',
  storageKeys: {
  },
} as const;
