import React, { useState, useEffect } from 'react';
import { CanteiroData } from '../data/horticulturaData';
import {
  Printer,
  CheckCircle2,
  Sprout,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export interface FichaCampoData {
  grupo: string;
  canteiroCodigo: string;
  cultura: string;
  dataPlantio: string;
  espacamento: string;
  plantasPorCanteiro: string;
  plantasPorHa: string;
  previsaoColheita: string;
  adubacao: string;
  controlePragas: string;
  limpaCapina: string;
  obs: string;
  statusEntrega: 'pendente' | 'entregue' | 'aprovado';
  dataEntrega?: string;
  vistoProfessor?: {
    assinado: boolean;
    dataVisto?: string;
    parecer?: string;
  };
}

interface FichaCampoOlericulturaProps {
  canteiro: CanteiroData;
  perfil?: 'professor' | 'aluno';
  onSalvar?: (ficha: FichaCampoData) => void;
}

// Helpers para valores agronômicos padrão coerentes com a cultura
function getValoresPadrao(canteiro: CanteiroData): FichaCampoData {
  const dPlantio = new Date(canteiro.dataPlantio + 'T00:00:00');
  const dColheita = new Date(dPlantio);
  dColheita.setDate(dColheita.getDate() + (canteiro.diasPrevistosColheita || 45));

  const formatData = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const area = canteiro.areaM2 || 7.2;
  const plantasCanteiro = Math.round(area * 16); // densidade média de hortaliças
  const plantasHa = Math.round(10000 * 16);

  return {
    grupo: `${canteiro.turmaResponsavel} — Equipe Líder: ${canteiro.estudanteLider}`,
    canteiroCodigo: canteiro.codigo,
    cultura: canteiro.variedade ? `${canteiro.cultura} (${canteiro.variedade})` : canteiro.cultura,
    dataPlantio: formatData(dPlantio),
    espacamento: '0,25 m × 0,25 m',
    plantasPorCanteiro: `${plantasCanteiro} plantas`,
    plantasPorHa: `${plantasHa.toLocaleString('pt-BR')} pl/ha`,
    previsaoColheita: formatData(dColheita),
    adubacao:
      canteiro.adubacao ||
      'Adubação de fundação: 3 kg/m² de composto orgânico maturada (baia 4) + 150g/m² de cinzas vegetais incorporadas ao solo.\nAdubação de cobertura: Aplicação quinzenal de biofertilizante foliar enriquecido a 2% e rega com Bokashi líquido aos 15 e 30 dias após transplante.',
    controlePragas:
      'Monitoramento semanal preventivo contra pulgões (Myzus persicae) e lagartas desfolhadoras.\nInstalação de 2 armadilhas cromotrópicas adesivas amarelas na cabeceira do canteiro. Aplicação profilática de calda bordalesa a 1% e extrato alcoólico de nim (10ml/L). Nenhuma praga em nível de dano econômico no momento.',
    limpaCapina:
      'Capina manual seletiva realizada a cada 10 dias nas entrelinhas e coroamento das mudas.\nManutenção de cobertura morta (mulching de palhada seca de capim com 4cm de espessura) para reter umidade, amenizar temperatura do solo e impedir emergência de plantas espontâneas.',
    obs:
      canteiro.observacoes ||
      'Excelente vigor e uniformidade no pegamento das mudas após o transplante. Sistema de irrigação por gotejamento suprindo a demanda hídrica ideal. Solo com boa agregação e aeração.',
    statusEntrega: 'entregue',
    dataEntrega: formatData(dPlantio),
    vistoProfessor: {
      assinado: true,
      dataVisto: formatData(new Date()),
      parecer: 'Canteiro bem conduzido. Espaçamento adequado e cobertura morta preservando a umidade recomendada.',
    },
  };
}

export const FichaCampoOlericultura: React.FC<FichaCampoOlericulturaProps> = ({
  canteiro,
  perfil = 'professor',
  onSalvar,
}) => {
  const storageKey = `terrarium_ficha_${canteiro.id}`;

  const [ficha, setFicha] = useState<FichaCampoData>(() => {
    try {
      const salvo = localStorage.getItem(storageKey);
      if (salvo) {
        return JSON.parse(salvo);
      }
    } catch (e) {
      console.warn('Erro ao carregar ficha do localStorage:', e);
    }
    return getValoresPadrao(canteiro);
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [parecerInput, setParecerInput] = useState(ficha.vistoProfessor?.parecer || '');

  // Sincroniza se o canteiro mudar
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(storageKey);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        setFicha(parsed);
        setParecerInput(parsed.vistoProfessor?.parecer || '');
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    const padrao = getValoresPadrao(canteiro);
    setFicha(padrao);
    setParecerInput(padrao.vistoProfessor?.parecer || '');
  }, [canteiro.id, storageKey]);

  const handleConcederVisto = () => {
    const atualizado: FichaCampoData = {
      ...ficha,
      vistoProfessor: {
        assinado: true,
        dataVisto: new Date().toLocaleDateString('pt-BR'),
        parecer: parecerInput || 'Visto concedido pelo docente responsável.',
      },
      statusEntrega: 'aprovado',
    };
    setFicha(atualizado);
    try {
      localStorage.setItem(storageKey, JSON.stringify(atualizado));
    } catch (e) {
      console.warn(e);
    }
    setMensagemSucesso('Visto e avaliação registrados com sucesso pelo Prof. George Guimarães!');
    setTimeout(() => setMensagemSucesso(''), 4000);
    onSalvar?.(atualizado);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações & Notificações */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-emerald-900/10 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#27633b]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Ficha de Campo Oficial do Canteiro
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            title="Imprimir formato original em papel para aula de campo"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Banner de Sucesso */}
      {mensagemSucesso && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in print:hidden">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* DOCUMENTO DA FICHA DE CAMPO (ESPELHO FIEL DO PAPEL ENTREGUE) */}
      {/* ============================================================ */}
      <div className="rounded-3xl border-2 border-slate-300/80 bg-white p-6 sm:p-9 shadow-md print:p-0 print:border-none print:shadow-none font-sans text-slate-800">
        
        {/* CABEÇALHO DO PAPEL */}
        <div className="border-b-2 border-slate-800 pb-3 text-center">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 font-serif">
            OLERICULTURA – George Guimarães
          </h1>
          <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase mt-0.5">
            IFPE Campus Belo Jardim
          </p>
        </div>

        {/* METADADOS / STATUS DE PREENCHIMENTO */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Situação:</span>
            {ficha.statusEntrega === 'aprovado' ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Ficha Avaliada & Vistada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                <Clock className="h-3 w-3" /> Preenchida pelo Grupo de Alunos
              </span>
            )}
          </div>
          {ficha.dataEntrega && (
            <span className="text-[11px]">Última entrega registrada em: <strong>{ficha.dataEntrega}</strong></span>
          )}
        </div>

        {/* FORMULÁRIO / DADOS DE IDENTIFICAÇÃO (Linhas do Papel) */}
        <div className="mt-5 space-y-3.5 text-sm">
          
          {/* Linha 1: Grupo */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 border-b border-dotted border-slate-400 pb-1.5">
            <span className="font-bold text-slate-900 shrink-0">Grupo:</span>
            <span className="text-slate-800 font-semibold">{ficha.grupo || '—'}</span>
          </div>

          {/* Linha 2: Canteiro, Cultura, Data do Plantio */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-baseline border-b border-dotted border-slate-400 pb-1.5">
            {/* Canteiro */}
            <div className="sm:col-span-3 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Canteiro:</span>
              <span className="font-black text-slate-900 underline decoration-slate-400 underline-offset-4">
                {ficha.canteiroCodigo}
              </span>
            </div>

            {/* Cultura */}
            <div className="sm:col-span-5 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Cultura:</span>
              <span className="text-slate-800 font-semibold">{ficha.cultura}</span>
            </div>

            {/* Data do Plantio/semeio/transplantio */}
            <div className="sm:col-span-4 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 text-xs shrink-0">Data do Plantio/semeio/transplantio:</span>
              <span className="font-mono font-semibold text-slate-800">{ficha.dataPlantio}</span>
            </div>
          </div>

          {/* Linha 3: Espaçamento, Plantas/canteiro, Plantas/Ha */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-baseline border-b border-dotted border-slate-400 pb-1.5">
            {/* Espaçamento */}
            <div className="sm:col-span-4 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Espaçamento:</span>
              <span className="text-slate-800 font-semibold">{ficha.espacamento}</span>
            </div>

            {/* Plantas/canteiro */}
            <div className="sm:col-span-4 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Plantas/canteiro:</span>
              <span className="text-slate-800 font-semibold">{ficha.plantasPorCanteiro}</span>
            </div>

            {/* Plantas/Ha */}
            <div className="sm:col-span-4 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Plantas/Ha:</span>
              <span className="text-slate-800 font-semibold">{ficha.plantasPorHa}</span>
            </div>
          </div>

          {/* Linha 4: Previsão de Colheita */}
          <div className="flex items-baseline gap-2 border-b border-dotted border-slate-400 pb-1.5">
            <span className="font-bold text-slate-900 shrink-0">Previsão de Colheita:</span>
            <span className="font-mono font-semibold text-slate-800">{ficha.previsaoColheita}</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* OS 4 QUADROS PRINCIPAIS DE REGISTRO (CONFORME FOLHA DE PAPEL) */}
        {/* ============================================================ */}
        <div className="mt-6 border-2 border-slate-800 divide-y-2 divide-slate-800 rounded-lg overflow-hidden bg-white">
          
          {/* 1. ADUBAÇÃO */}
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sprout className="h-4 w-4 text-[#27633b] print:hidden" />
              <span>Adubação:</span>
            </h3>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {ficha.adubacao || 'Nenhum registro de adubação preenchido.'}
            </p>
          </div>

          {/* 2. CONTROLE DE PRAGAS */}
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700 print:hidden" />
              <span>Controle de Pragas:</span>
            </h3>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {ficha.controlePragas || 'Nenhum registro de controle de pragas preenchido.'}
            </p>
          </div>

          {/* 3. LIMPA/CAPINA */}
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600 print:hidden" />
              <span>Limpa/Capina:</span>
            </h3>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {ficha.limpaCapina || 'Nenhum registro de capina preenchido.'}
            </p>
          </div>

          {/* 4. OBS */}
          <div className="p-4 sm:p-5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-600 print:hidden" />
              <span>OBS:</span>
            </h3>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {ficha.obs || 'Nenhuma observação registrada.'}
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEÇÃO DE AVALIAÇÃO / VISTO DO PROFESSOR GEORGE GUIMARÃES     */}
        {/* ============================================================ */}
        <div className="mt-6 rounded-2xl border border-emerald-900/15 bg-gradient-to-br from-emerald-50/50 to-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-900/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#27633b] text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Validação da entrega da ficha de campo
                </h4>
              </div>
            </div>

            {ficha.vistoProfessor?.assinado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                ✓ Visto Concedido em {ficha.vistoProfessor.dataVisto}
              </span>
            )}
          </div>

          <div className="mt-3 text-xs">
            {perfil === 'professor' ? (
              <div className="space-y-3">
                <label className="block text-slate-700 font-semibold">
                  Parecer do Professor sobre o Manejo do Canteiro:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={parecerInput}
                    onChange={(e) => setParecerInput(e.target.value)}
                    placeholder="Adicione um comentário ou feedback para o grupo..."
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#27633b] focus:outline-none"
                  />
                  <button
                    onClick={handleConcederVisto}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#27633b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a4428] transition shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{ficha.vistoProfessor?.assinado ? 'Atualizar Visto' : 'Dar Visto na Ficha'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-semibold text-slate-600">Parecer do Docente:</span>
                <p className="mt-1 italic text-slate-700 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  {ficha.vistoProfessor?.parecer || 'Aguardando avaliação presencial do Prof. George Guimarães.'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
