import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, LogOut, ShieldCheck, Sprout } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useUep } from '../../../contexts/UepContext';
import { identifyRoleByEmail } from '../../auth/utils/roleIdentifier';

export const PomarPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { setSelectedUep } = useUep();
  const navigate = useNavigate();

  const userRole = user ? identifyRoleByEmail(user.email, user.role) : 'PROFESSOR';
  const isAdmin = userRole === 'ADMIN';
  const isAluno = userRole === 'ALUNO';

  const handleSwitchToOlericultura = () => {
    setSelectedUep('olericultura');
    navigate(isAluno ? '/olericultura/aluno/mapa' : '/olericultura/professor/mapa');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbf7f0] p-6 text-slate-800 font-sans">
      <div className="w-full max-w-lg rounded-3xl border border-amber-900/10 bg-white/95 p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-700 shadow-inner">
          <Apple className="h-10 w-10 text-amber-600 animate-pulse" />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800 border border-amber-200">
          <span>UEP Fruticultura • Pomar Experimental</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Módulo em Desenvolvimento
        </h1>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Você está autenticado como{' '}
          <strong className="text-amber-700 uppercase">
            {isAdmin ? 'Admin' : isAluno ? 'Aluno' : 'Professor'}
          </strong>{' '}
          ({user?.nome || user?.email}). A modelagem tridimensional e fichas de campo das fruteiras estão sendo preparadas pela equipe.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/admin')}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Painel do Admin
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sair da conta
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSwitchToOlericultura}
            leftIcon={<Sprout className="h-4 w-4" />}
          >
            Acessar Olericultura
          </Button>
        </div>
      </div>
    </div>
  );
};
