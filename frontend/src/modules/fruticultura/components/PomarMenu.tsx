import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Compass,
  ChevronRight,
  Apple,
  Sprout,
  LogOut,
  ShieldCheck,
  TreeDeciduous,
} from 'lucide-react';
import { APP_CONFIG } from '../../../config/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { useUep } from '../../../contexts/UepContext';
import { identifyRoleByEmail } from '../../auth/utils/roleIdentifier';
import { QuadraPomar, CORES_FRUTEIRAS, isQuadraEquipamento, totalPlantas } from '../data/pomarData';

export interface PomarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  quadras: QuadraPomar[];
  onFocusQuadra: (quadraId: string) => void;
}

export const PomarMenu: React.FC<PomarMenuProps> = ({ isOpen, onClose, quadras, onFocusQuadra }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setSelectedUep } = useUep();

  if (!isOpen) return null;

  const role = user ? identifyRoleByEmail(user.email, user.role) : 'PROFESSOR';
  const isAdmin = role === 'ADMIN';
  const isAluno = role === 'ALUNO';
  const perfilLabel = isAdmin ? 'Admin' : isAluno ? 'Aluno' : 'Professor';
  const nomeUsuario = user?.nome || 'Usuário';

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleFocus = (id: string) => {
    onClose();
    onFocusQuadra(id);
  };

  const handleSwitchToOlericultura = () => {
    setSelectedUep('olericultura');
    handleNavigate(isAluno ? '/olericultura/aluno/mapa' : '/olericultura/professor/mapa');
  };

  return (
    <div className="fixed inset-0 z-50 flex print:hidden">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      <div className="relative flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-emerald-900/10 bg-gradient-to-r from-emerald-50/60 to-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#27633b] text-white shadow-md">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#27633b] font-brand leading-tight">{APP_CONFIG.name}</h2>
              <p className="text-[11px] font-semibold text-emerald-800">{APP_CONFIG.institution}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Saudação e perfil */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">
                Bem - vindo, <span className="text-[#27633b] font-bold">{nomeUsuario}</span>
              </p>
              {user?.email && <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>}
            </div>
            <span className="rounded-full bg-[#27633b]/10 px-2.5 py-1 text-[11px] font-bold text-[#27633b] shrink-0">
              {perfilLabel}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
          {isAdmin && (
            <button
              onClick={() => handleNavigate('/admin')}
              className="mb-2 flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 font-bold text-[#174b32] hover:bg-emerald-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#27633b]" />
                <span>Painel do Administrador</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#27633b]" />
            </button>
          )}

          <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3">
            Módulos do Pomar
          </div>

          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-3 font-bold text-[#27633b]">
            <div className="flex items-center gap-3">
              <Compass className="h-4 w-4" />
              <span>{isAluno ? 'Minhas Quadras & Mapa' : 'Mapa do Pomar'}</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#27633b]" />
          </div>

          <div className="pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3">
            Quadras
          </div>

          {quadras.map((q) => {
            const equip = isQuadraEquipamento(q);
            return (
              <button
                key={q.id}
                onClick={() => handleFocus(q.id)}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TreeDeciduous
                    className="h-4 w-4 shrink-0"
                    style={{ color: CORES_FRUTEIRAS[q.tipoFruteira].label }}
                  />
                  <span className="truncate">{q.nome}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  {equip ? 'Infra' : `${totalPlantas(q)} plantas`}
                </span>
              </button>
            );
          })}

          <div className="pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3">
            Sistema
          </div>

          <button
            onClick={handleSwitchToOlericultura}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <Sprout className="h-4 w-4 text-emerald-700" />
            <span>Acessar Olericultura</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            <span>Sair da Conta</span>
          </button>
        </nav>

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

