import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { UepProvider } from '../contexts/UepContext';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { AdminDashboardPage } from '../modules/admin/pages/AdminDashboardPage';
import { AlunoMapaPage } from '../modules/olericultura/pages/aluno/AlunoMapaPage';
import { AlunoCanteiroDetailPage } from '../modules/olericultura/pages/aluno/AlunoCanteiroDetailPage';
import { TurmasProfessorPage } from '../modules/olericultura/pages/professor/TurmasProfessorPage';
import { TurmaDetalheProfessorPage } from '../modules/olericultura/pages/professor/TurmaDetalheProfessorPage';

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
const GestaoCanteirosPage = React.lazy(() =>
  import('../modules/olericultura/pages/professor/GestaoCanteirosPage').then((m) => ({ default: m.GestaoCanteirosPage }))
);
const ColheitaPage = React.lazy(() =>
  import('../modules/olericultura/pages/professor/ColheitaPage').then((m) => ({ default: m.ColheitaPage }))
);
const PomarPage = React.lazy(() =>
  import('../modules/fruticultura/pages/PomarPage').then((m) => ({ default: m.PomarPage }))
);
const ConfiguracoesLayoutPage = React.lazy(() =>
  import('../modules/olericultura/pages/professor/ConfiguracoesLayoutPage').then((m) => ({ default: m.ConfiguracoesLayoutPage }))
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
              {/* Autenticação */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />

              {/* Rotas Protegidas - Perfil Administrador */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              {/* Rotas Protegidas - Perfil Professor */}
              <Route element={<ProtectedRoute allowedRoles={['PROFESSOR']} />}>
                <Route path="/mapa" element={<MapaPage />} />
                <Route path="/olericultura/professor/mapa" element={<MapaPage />} />
                <Route path="/canteiro/:id" element={<CanteiroDetailPage />} />
                <Route path="/olericultura/professor/canteiro/:id" element={<CanteiroDetailPage />} />
                <Route path="/cronograma" element={<GestaoCanteirosPage />} />
                <Route path="/olericultura/professor/cronograma" element={<GestaoCanteirosPage />} />
                <Route path="/gestao-canteiros" element={<GestaoCanteirosPage />} />
                <Route path="/olericultura/professor/gestao-canteiros" element={<GestaoCanteirosPage />} />
                <Route path="/colheita" element={<ColheitaPage />} />
                <Route path="/olericultura/professor/colheita" element={<ColheitaPage />} />
                <Route path="/turmas" element={<TurmasProfessorPage />} />
                <Route path="/olericultura/professor/turmas" element={<TurmasProfessorPage />} />
                <Route path="/turmas/:id" element={<TurmaDetalheProfessorPage />} />
                <Route path="/olericultura/professor/turmas/:id" element={<TurmaDetalheProfessorPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesLayoutPage />} />
                <Route path="/olericultura/configuracoes" element={<ConfiguracoesLayoutPage />} />
                <Route path="/fruticultura/professor/pomar" element={<PomarPage />} />
              </Route>

              {/* Rotas Protegidas - Perfil Aluno */}
              <Route element={<ProtectedRoute allowedRoles={['ALUNO']} />}>
                <Route path="/olericultura/aluno/mapa" element={<AlunoMapaPage />} />
                <Route path="/olericultura/aluno/canteiro/:id" element={<AlunoCanteiroDetailPage />} />
                <Route path="/olericultura/aluno/cronograma" element={<GestaoCanteirosPage />} />
                <Route path="/olericultura/aluno/gestao-canteiros" element={<GestaoCanteirosPage />} />
                <Route path="/olericultura/aluno/colheita" element={<ColheitaPage />} />
                <Route path="/fruticultura/aluno/pomar" element={<PomarPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </UepProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
