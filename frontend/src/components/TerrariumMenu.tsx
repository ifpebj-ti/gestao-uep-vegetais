import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Compass,
  Layers,
  ChevronRight,
  Sprout,
  Leaf,
  FileText,
  Settings,
  LogOut,
  Calendar,
  Droplets,
} from 'lucide-react';
import { APP_CONFIG } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { PerfilUsuario } from '../data/horticulturaData';

export interface TerrariumMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusLocation?: (locationId: 'agua' | 'composteira' | 'recepcao') => void;
}

export const TerrariumMenu: React.FC<TerrariumMenuProps> = ({
  isOpen,
  onClose,
  onFocusLocation,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  // Deriva o perfil diretamente da sessão de login
  const perfil: PerfilUsuario = (() => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'aluno') {
      return 'aluno';
    }
    return 'professor';
  })();

  const nomeUsuario = user?.nome || 'Usuário';
  const isMapActive = location.pathname === '/mapa' || location.pathname === '/map';

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleFocusItem = (locationId: 'agua' | 'composteira' | 'recepcao') => {
    onClose();
    if (onFocusLocation) {
      onFocusLocation(locationId);
    } else {
      navigate('/mapa');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Slide Drawer */}
      <div className="relative flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/10 bg-gradient-to-r from-emerald-50/60 to-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#27633b] text-white shadow-md">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#27633b] font-brand leading-tight">
                {APP_CONFIG.name}
              </h2>
              <p className="text-[11px] font-semibold text-emerald-800">
                {APP_CONFIG.institution}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Greeting and Role Badge (Derived from login session) */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">
                Bem - vindo, <span className="text-[#27633b] font-bold">{nomeUsuario}</span>
              </p>
              {user?.email && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user.email}
                </p>
              )}
            </div>
            <span className="rounded-full bg-[#27633b]/10 px-2.5 py-1 text-[11px] font-bold text-[#27633b] shrink-0">
              {perfil === 'professor' ? 'Professor' : 'Aluno'}
            </span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
          <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3">
            Módulos do Terrarium
          </div>

          {/* Active Route: Mapa */}
          {isMapActive ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-3 font-bold text-[#27633b]">
              <div className="flex items-center gap-3">
                <Compass className="h-4 w-4" />
                <span>Mapa</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#27633b]" />
            </div>
          ) : (
            <button
              onClick={() => handleNavigate('/mapa')}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-3">
                <Compass className="h-4 w-4 text-emerald-700" />
                <span>Mapa</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          )}

          <button
            onClick={() => handleNavigate('/canteiro/c-01')}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Sprout className="h-4 w-4 text-emerald-700" />
              <span>Gestão de Canteiros</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          {/* Modelos de Culturas */}
          <button
            onClick={() => alert('Módulo de Modelos de Culturas em desenvolvimento')}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <span>Modelos de Culturas</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            onClick={() => alert('Módulo de Cronograma de Plantio em desenvolvimento')}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Cronograma de Manejo</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            onClick={() => handleFocusItem('agua')}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Droplets className="h-4 w-4 text-sky-600" />
              <span>Irrigação & Reservatório</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            onClick={() => handleFocusItem('composteira')}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-amber-700" />
              <span>Compostagem & Minhocário</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          {perfil === 'aluno' && (
            <button
              onClick={() => alert('Minhas Atividades e Relatórios de Campo')}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Minhas Atividades Práticas</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          )}

          <div className="pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3">
            Sistema
          </div>

          <button
            onClick={() => alert('Configurações da UEP e Sensores')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Configurações</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            <span>Sair da Conta</span>
          </button>
        </nav>

        {/* Drawer Footer */}
        <div className="border-t border-slate-100 p-4 text-[11px] text-slate-400 text-center">
          <p className="font-semibold text-slate-600">
            {APP_CONFIG.name} v{APP_CONFIG.version}
          </p>
          <p>{APP_CONFIG.subtitle}</p>
        </div>
      </div>
    </div>
  );
};
