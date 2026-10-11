import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Apple, ArrowRight, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '../../../config/constants';
import { UepType } from '../../../types/uep';
import { useUep } from '../../../contexts/UepContext';

interface UepOption {
  id: UepType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const UEP_OPTIONS: UepOption[] = [
  {
    id: 'olericultura',
    title: 'Olericultura',
    description:
      'Gestão agronômica de canteiros, ciclos de plantio, fichas de campo e colheita.',
    icon: <Sprout className="h-10 w-10 text-emerald-600" />,
  },
  {
    id: 'fruticultura',
    title: 'Fruticultura',
    description:
      'Gestão de talhões frutíferos, tratos culturais, podas, mudas e controle de safra.',
    icon: <Apple className="h-10 w-10 text-amber-600" />,
  },
];

export const SelectUepPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedUep } = useUep();

  const handleSelectUep = (uepId: UepType) => {
    setSelectedUep(uepId);
    navigate('/login', {
      state: { selectedUep: uepId },
    });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#174b32] via-[#22633b] to-[#658342] px-4 py-12 text-white sm:px-6">
      {/* Efeitos de círculos concêntricos e orgânicos idênticos ao AuthLayout */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-34 h-44 w-44 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#a7b86b]/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full border border-white/10"
      />

      <div className="relative w-full max-w-4xl text-center">
        {/* Cabeçalho */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#d7e6b7] backdrop-blur-md shadow-xs">
          <ShieldCheck className="h-4 w-4" />
          <span>{APP_CONFIG.institution}</span>
        </div>

        <h1
          style={{ fontFamily: "'Libra Serif Modern', serif" }}
          className="font-brand text-4xl font-extrabold tracking-tight text-white sm:text-6xl drop-shadow-sm"
        >
          {APP_CONFIG.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-white/85 sm:text-lg">
          Selecione a Unidade de Ensino e Produção (UEP) que deseja acessar:
        </p>

        {/* Grade de Seleção de UEP */}
        <div className="mt-10 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
          {UEP_OPTIONS.map((uep) => (
            <button
              key={uep.id}
              type="button"
              onClick={() => handleSelectUep(uep.id)}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/20 bg-white p-8 text-left shadow-xl shadow-black/15 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus:outline-hidden cursor-pointer"
            >
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 transition-transform duration-200 group-hover:scale-105">
                  {uep.icon}
                </div>

                <h2
                  style={{ fontFamily: "'Libra Serif Modern', serif" }}
                  className="font-brand mt-6 text-2xl font-bold text-slate-900"
                >
                  {uep.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {uep.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <span className="text-sm font-bold text-[#27633b] transition-colors group-hover:text-[#174b32]">
                  Entrar na unidade
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-[#27633b] transition-all group-hover:translate-x-1 group-hover:bg-[#27633b] group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Rodapé institucional */}
        <p className="mt-12 text-xs text-white/60">
          {APP_CONFIG.subtitle} &bull; v{APP_CONFIG.version}
        </p>
      </div>
    </main>
  );
};
