import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, ArrowLeft, Sprout } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useUep } from '../../../contexts/UepContext';

export const PomarPage: React.FC = () => {
  const { user } = useAuth();
  const { setSelectedUep } = useUep();
  const navigate = useNavigate();

  const handleSwitchToOlericultura = () => {
    setSelectedUep('olericultura');
    const isAluno = user?.role?.toLowerCase() === 'aluno';
    navigate(isAluno ? '/olericultura/aluno/mapa' : '/olericultura/professor/mapa');
  };

  const isAluno = user?.role?.toLowerCase() === 'aluno';

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
          <strong className="text-amber-700 uppercase">{isAluno ? 'Aluno' : 'Professor'}</strong> ({user?.nome || user?.email}).
          A modelagem tridimensional e fichas de campo das fruteiras estão sendo preparadas pela equipe.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/selecionar-uep')}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:scale-105 active:scale-95 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Trocar de UEP</span>
          </button>

          <button
            onClick={handleSwitchToOlericultura}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#27633b] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition"
          >
            <Sprout className="h-4 w-4" />
            <span>Acessar Olericultura</span>
          </button>
        </div>
      </div>
    </div>
  );
};
