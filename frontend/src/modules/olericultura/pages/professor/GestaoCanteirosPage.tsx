import React, { useState } from 'react';
import { Menu, Sprout } from 'lucide-react';
import { BackButton } from '../../../../components/BackButton';
import { TerrariumMenu } from '../../components/TerrariumMenu';
import { CronogramaSemanal } from '../../components/CronogramaSemanal';
import { APP_CONFIG } from '../../../../config/constants';
import { useAuth } from '../../../../contexts/AuthContext';

export const GestaoCanteirosPage: React.FC = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profile: 'professor' | 'aluno' =
    user?.role?.toLowerCase() === 'aluno' ? 'aluno' : 'professor';

  const backPath = profile === 'aluno' ? '/olericultura/aluno/mapa' : '/mapa';

  return (
    <div className="min-h-screen bg-[#f5f8f3] text-slate-800 pb-16 font-sans">
      {/* Top Header & Navigation */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu do sistema"
            className="group flex h-11 items-center gap-2 rounded-2xl bg-[#27633b] px-4 text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-4 w-4 transition group-hover:rotate-6" />
            <span className="text-xs font-bold tracking-wider uppercase">Menu</span>
          </button>

          <BackButton to={backPath} />
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-900/10 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#27633b] to-[#4ade80] text-white shadow-sm">
            <Sprout className="h-4 w-4" />
          </div>
          <div className="text-right">
            <h1 className="text-sm font-bold text-[#27633b] leading-tight">
              {APP_CONFIG.name}
            </h1>
            <p className="text-[10px] font-semibold text-emerald-900/70 tracking-wide uppercase">
              Gestão de Canteiros • Turmas
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area: Visão Panorâmica de Todos os Canteiros por Turma */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <CronogramaSemanal modo="panoramico" perfil={profile} />
      </main>

      {/* Terrarium Menu Lateral */}
      <TerrariumMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFocusLocation={() => {}}
      />
    </div>
  );
};
