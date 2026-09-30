import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';

// Code-splitting via React.lazy para reduzir o bundle inicial
const ForgotPasswordPage = React.lazy(() =>
  import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const RegisterPage = React.lazy(() =>
  import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ConfirmEmailPage = React.lazy(() =>
  import('../pages/ConfirmEmailPage').then((m) => ({ default: m.ConfirmEmailPage }))
);
const MapaPage = React.lazy(() =>
  import('../pages/MapaPage').then((m) => ({ default: m.MapaPage }))
);
const CanteiroDetailPage = React.lazy(() =>
  import('../pages/CanteiroDetailPage').then((m) => ({ default: m.CanteiroDetailPage }))
);

const PageLoader: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f4f1e7]">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#27633b] border-t-transparent" />
      <p className="text-sm font-semibold text-[#27633b]">Carregando Terrarium...</p>
    </div>
  </div>
);

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />

            {/* Rotas Protegidas (requerem sessão ativa) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/mapa" element={<MapaPage />} />
              <Route path="/canteiro/:id" element={<CanteiroDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}