import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CANTEIROS_DATA, CanteiroData } from '../../data/horticulturaData';
import {
  Calendar,
  CheckCircle2,
  Sprout,
  FileText,
  Menu,
} from 'lucide-react';
import { FichaCampoOlericultura } from '../../components/FichaCampoOlericultura';
import { TerrariumMenu } from '../../components/TerrariumMenu';
import { BackButton } from '../../../../components/BackButton';

export const CanteiroDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Sidebar Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Active user profile (can be toggled in view if needed, default to professor)
  const [profile] = useState<'professor' | 'aluno'>('professor');
  const [activeTab, setActiveTab] = useState<'ficha' | 'manejo' | 'historico'>('ficha');

  const canteiro: CanteiroData | undefined = CANTEIROS_DATA.find((c) => c.id === id);

  if (!canteiro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9f6] p-6 text-center font-sans">
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#27633b]">
            <Sprout className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-800">Canteiro não encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            O identificador solicitado não corresponde a nenhum canteiro ou setor cadastrado.
          </p>
          <BackButton
            to="/mapa"
            variant="solid"
            className="mt-6 w-full justify-center py-3 text-sm rounded-xl"
          />
        </div>
      </div>
    );
  }

  const progressoCiclo = Math.min(
    100,
    Math.round((canteiro.diasPlantio / Math.max(canteiro.diasPrevistosColheita, 1)) * 100)
  );

  return (
    <div className="min-h-screen bg-[#f5f8f3] text-slate-800 pb-16 font-sans print:min-h-0 print:bg-white print:p-0 print:m-0">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION: MENU E BOTÃO VOLTAR                  */}
      {/* ======================================================== */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-4 sm:px-6 print:hidden">
        <div className="flex items-center gap-3">
          {/* Botão Menu */}
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu do sistema"
            className="group flex h-11 items-center gap-2 rounded-2xl bg-[#27633b] px-4 text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-4 w-4 transition group-hover:rotate-6" />
            <span className="text-xs font-bold tracking-wider uppercase">Menu</span>
          </button>

          {/* Botão Reutilizável de Voltar */}
          <BackButton to="/mapa" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CONTEÚDO PRINCIPAL                                    */}
      {/* ======================================================== */}
      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 print:max-w-none print:m-0 print:p-0">

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 p-6 sm:p-8 shadow-sm print:hidden">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

            {/* Informações Básicas do Canteiro */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#27633b] font-mono text-sm font-bold text-white shadow-sm">
                  {canteiro.codigo}
                </span>
                <span className="rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-semibold text-[#1a4428]">
                  {canteiro.setor}
                </span>
                <span
                  style={{ backgroundColor: `${canteiro.statusColor}18`, color: canteiro.statusColor }}
                  className="rounded-lg px-3 py-1 text-xs font-bold"
                >
                  {canteiro.statusLabel}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  {canteiro.cultura}
                </h1>
                {canteiro.variedade && (
                  <p className="mt-1 text-sm font-medium italic text-slate-500">
                    Variedade: {canteiro.variedade}
                  </p>
                )}
              </div>
            </div>

            {/* Grupo Responsável e Turma (Diretamente no card maior) */}
            <div className="flex flex-col justify-center gap-3 sm:min-w-[240px] sm:text-right shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Grupo Responsável:
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {canteiro.estudanteLider}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Turma:
                </span>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {canteiro.turmaResponsavel}
                </p>
              </div>
            </div>

          </div>

          {/* Ciclo Fenológico Progress Bar */}
          <div className="mt-6 border-t border-emerald-900/10 pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#27633b]" />
                <span>Ciclo Fenológico: {canteiro.diasPlantio} de {canteiro.diasPrevistosColheita} dias estimados</span>
              </div>
              <span className="text-[#27633b] font-bold">{progressoCiclo}% completo</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5">
              <div
                style={{ width: `${progressoCiclo}%`, backgroundColor: canteiro.statusColor }}
                className="h-full rounded-full transition-all duration-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SEÇÃO PRINCIPAL (LARGURA TOTAL): ABAS E FICHA DE CAMPO*/}
        {/* ======================================================== */}
        <div className="mt-8 space-y-6 print:mt-0 print:space-y-0">

          {/* Navegação entre Abas (Sem "Parâmetros Agronômicos") */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto print:hidden">
            <button
              onClick={() => setActiveTab('ficha')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === 'ficha'
                  ? 'bg-[#27633b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Ficha de Campo (Olericultura)</span>
            </button>
            <button
              onClick={() => setActiveTab('manejo')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === 'manejo'
                  ? 'bg-[#27633b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Manejo & Irrigação
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === 'historico'
                  ? 'bg-[#27633b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Histórico & Cronograma
            </button>
          </div>

          {/* Aba 1: Ficha de Campo Oficial do Professor George Guimarães */}
          {activeTab === 'ficha' && (
            <FichaCampoOlericultura
              canteiro={canteiro}
              perfil={profile}
            />
          )}

          {/* Aba 2: Manejo & Irrigação */}
          {activeTab === 'manejo' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Protocolo de Manejo Agroecológico</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Irrigação Automatizada de Precisão</p>
                    <p className="text-slate-500 mt-0.5">Programada para 2 pulsos diários às 06:00 e 17:00 com vazão controlada ({canteiro.irrigacao}).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Controle Fitossanitário Preventivo</p>
                    <p className="text-slate-500 mt-0.5">Aplicação quinzenal de extrato de nim e calda sulfocálcica orgânica certificada.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Cobertura Morta (Mulching)</p>
                    <p className="text-slate-500 mt-0.5">Palhada seca de capim para conservação da umidade e controle de plantas espontâneas.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Histórico */}
          {activeTab === 'historico' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Linha do Tempo das Intervenções</h3>
              <ol className="relative border-l border-emerald-200 ml-3 space-y-5 text-xs">
                <li className="ml-5">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-600" />
                  <span className="font-semibold text-slate-400">Há 3 dias</span>
                  <h4 className="font-bold text-slate-800">Adubação de cobertura com Bokashi líquido</h4>
                  <p className="text-slate-500">Realizada pelos alunos responsáveis sob supervisão do Prof. George Guimarães.</p>
                </li>
                <li className="ml-5">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                  <span className="font-semibold text-slate-400">Há 14 dias</span>
                  <h4 className="font-bold text-slate-800">Raleio e desbaste entre plantas</h4>
                  <p className="text-slate-500">Uniformização do espaçamento entre mudas conforme ficha de campo.</p>
                </li>
                <li className="ml-5">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                  <span className="font-semibold text-slate-400">{canteiro.dataPlantio}</span>
                  <h4 className="font-bold text-slate-800">Preparo do canteiro e plantio inicial</h4>
                  <p className="text-slate-500">Incorporação de 3kg/m² de composto orgânico da baia 4 da UEP.</p>
                </li>
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* Menu Lateral Deslizante (TerrariumMenu) */}
      <TerrariumMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFocusLocation={() => navigate('/mapa')}
      />
    </div>
  );
};
