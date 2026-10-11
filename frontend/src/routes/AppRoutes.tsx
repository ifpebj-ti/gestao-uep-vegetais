import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { UepProvider } from '../contexts/UepContext';
import { ProtectedRoute } from './ProtectedRoute';
import { SelectUepPage } from '../modules/auth/pages/SelectUepPage';
import { LoginPage } from '../modules/auth/pages/LoginPage';

// Code-splitting via React.lazy para reduzir o bundle inicial
const ForgotPasswordPage = React.lazy(() =>
  import('../modules/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const RegisterPage = React.lazy(() =>
  import('../modules/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ConfirmEmailPage = React.lazy(() =>
  import('../modules/auth/pages/ConfirmEmailPage').then((m) => ({ default: m.ConfirmEmailPage }))
);
const MapaPage = React.lazy(() =>
  import('../modules/olericultura/pages/professor/MapaPage').then((m) => ({ default: m.MapaPage }))
);
const CanteiroDetailPage = React.lazy(() =>
  import('../modules/olericultura/pages/professor/CanteiroDetailPage').then((m) => ({ default: m.CanteiroDetailPage }))
);
const PomarPage = React.lazy(() =>
  import('../modules/fruticultura/pages/PomarPage').then((m) => ({ default: m.PomarPage }))
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
        <UepProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Passo 1 da Jornada: Escolha da UEP */}
              <Route path="/" element={<SelectUepPage />} />
              <Route path="/selecionar-uep" element={<SelectUepPage />} />

              {/* Passo 2 da Jornada: Autenticação */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />

              {/* Rotas Protegidas - Perfil Professor */}
              <Route element={<ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']} />}>
                <Route path="/mapa" element={<MapaPage />} />
                <Route path="/olericultura/professor/mapa" element={<MapaPage />} />
                <Route path="/canteiro/:id" element={<CanteiroDetailPage />} />
                <Route path="/olericultura/professor/canteiro/:id" element={<CanteiroDetailPage />} />
                <Route path="/fruticultura/professor/pomar" element={<PomarPage />} />
              </Route>

              {/* Rotas Protegidas - Perfil Aluno */}
              <Route element={<ProtectedRoute allowedRoles={['ALUNO', 'ADMIN']} />}>
                <Route path="/olericultura/aluno/mapa" element={<MapaPage />} />
                <Route path="/olericultura/aluno/canteiro/:id" element={<CanteiroDetailPage />} />
                <Route path="/fruticultura/aluno/pomar" element={<PomarPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </UepProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}