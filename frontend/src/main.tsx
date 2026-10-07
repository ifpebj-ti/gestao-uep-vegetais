import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRoutes  from './routes/AppRoutes';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
const application = <AppRoutes />;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId} locale="pt-BR">
        {application}
      </GoogleOAuthProvider>
    ) : application}
  </React.StrictMode>
);
