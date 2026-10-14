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
import { ModeloCultivoApi, PrevisaoColheitaApi } from '../../../services/canteiroService';

export interface FichaCampoData {
  grupo: string;
  canteiroCodigo: string;
  cultura: string;
  variedade: string;
  dataPlantio: string;
  espacamento: string;
  plantasPorCanteiro: string;
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
  persistida?: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  modeloCultivoId?: string | null;
  areaCanteiroM2?: number | null;
  plantasPorCanteiroValor?: number | null;
  previsaoKg?: PrevisaoColheitaApi | null;
}

const formatadorMetros = new Intl.NumberFormat('pt-BR', {
  useGrouping: false,
  maximumFractionDigits: 4,
});

export function formatarEspacamento(espacamentoLinhasM: number, espacamentoPlantasM: number): string {
  return `${formatadorMetros.format(espacamentoLinhasM)} m x ${formatadorMetros.format(espacamentoPlantasM)} m`;
}

export function normalizarEspacamento(valor?: string | null): string {
  if (!valor) return '';

  const partes = valor.match(/^\s*([\d.,]+)\s*m\s*x\s*([\d.,]+)\s*m\s*$/i);
  if (!partes) return valor;

  const linhas = Number(partes[1].replace(',', '.'));
  const plantas = Number(partes[2].replace(',', '.'));
  return Number.isFinite(linhas) && Number.isFinite(plantas)
    ? formatarEspacamento(linhas, plantas)
    : valor;
}

export function calcularPlantasDoCanteiro(
  area: number | null,
  modelo: ModeloCultivoApi,
): number | null {
  if (!area || area <= 0) return null;

  // Os valores da API são decimais; a escala comum evita que imprecisões
  // binárias do JavaScript alterem o mesmo piso calculado pelo BigDecimal.
  const escalaDecimal = 1_000_000;
  const dividirComPisoDecimal = (total: number, passo: number) =>
    Math.floor(
      Math.round(total * escalaDecimal) / Math.round(passo * escalaDecimal),
    );

  const fileiras = dividirComPisoDecimal(1, modelo.espacamentoLinhasM);
  const plantasPorFileira = dividirComPisoDecimal(area, modelo.espacamentoPlantasM);
  return fileiras * plantasPorFileira;
}

interface FichaCampoOlericulturaProps {
  canteiro: CanteiroData;
  perfil?: 'professor' | 'aluno';
  podeEditar?: boolean;
  fichaInicial?: FichaCampoData | null;
  onSalvar?: (ficha: FichaCampoData) => void | Promise<void>;
  modelosCultivo?: ModeloCultivoApi[];
  onSalvarModelo?: (modelo: ModeloCultivoApi) => void | Promise<void>;
  onModeloSelecionado?: (modelo: ModeloCultivoApi | null) => void;
}

// Helpers para valores agronômicos padrão coerentes com a cultura
export function getValoresPadrao(canteiro: CanteiroData): FichaCampoData {
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
  const espacamentoPadraoM = 0.25;
  const plantasCanteiro = Math.floor(1 / espacamentoPadraoM)
    * Math.floor(area / espacamentoPadraoM);

  return {
    grupo: `${canteiro.turmaResponsavel} — Equipe Líder: ${canteiro.estudanteLider}`,
    canteiroCodigo: canteiro.codigo,
    variedade: canteiro.variedade || '',
    cultura: canteiro.cultura,
    dataPlantio: formatData(dPlantio),
    espacamento: '0,25 m x 0,25 m',
    plantasPorCanteiro: `${plantasCanteiro} plantas`,
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
  podeEditar: podeEditarProp,
  fichaInicial,
  onSalvar,
  modelosCultivo = [],
  onSalvarModelo,
  onModeloSelecionado,
}) => {
  const podeEditar = podeEditarProp ?? perfil === 'professor';
  const [ficha, setFicha] = useState<FichaCampoData>(
    () => fichaInicial || getValoresPadrao(canteiro)
  );

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [parecerInput, setParecerInput] = useState(ficha.vistoProfessor?.parecer || '');
  const [mensagemErro, setMensagemErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  const [modeloEditado, setModeloEditado] = useState<ModeloCultivoApi | null>(null);

  useEffect(() => {
    const proximaFicha = fichaInicial || getValoresPadrao(canteiro);
    setFicha(proximaFicha);
    setParecerInput(proximaFicha.vistoProfessor?.parecer || '');
  }, [canteiro.id, fichaInicial]);

  useEffect(() => {
    const selecionado = modelosCultivo.find((modelo) => modelo.id === ficha.modeloCultivoId) || null;
    setModeloEditado(selecionado);
    if (selecionado) {
      const area = ficha.areaCanteiroM2 ?? canteiro.areaM2 ?? null;
      const plantasCalculadas = calcularPlantasDoCanteiro(area, selecionado);
      setFicha((atual) => ({
        ...atual,
        cultura: selecionado.cultura,
        variedade: selecionado.variedade || '',
        areaCanteiroM2: atual.areaCanteiroM2 ?? canteiro.areaM2 ?? null,
        espacamento: formatarEspacamento(selecionado.espacamentoLinhasM, selecionado.espacamentoPlantasM),
        plantasPorCanteiroValor: plantasCalculadas,
        plantasPorCanteiro: plantasCalculadas == null ? '' : `${plantasCalculadas} plantas`,
      }));
    }
  }, [ficha.modeloCultivoId, modelosCultivo, canteiro.areaM2]);

  const atualizarCampo = <K extends keyof FichaCampoData>(campo: K, valor: FichaCampoData[K]) => {
    setFicha((atual) => ({ ...atual, [campo]: valor }));
  };

  const persistir = async (fichaParaSalvar: FichaCampoData, mensagem: string) => {
    if (!onSalvar || !podeEditar) return;

    setSalvando(true);
    setMensagemErro('');
    try {
      await onSalvar(fichaParaSalvar);
      setMensagemSucesso(mensagem);
      window.setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível salvar a ficha.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvar = () => persistir(ficha, 'Ficha salva no servidor com sucesso.');

  const handleConcederVisto = async () => {
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
    await persistir(atualizado, 'Visto e avaliação registrados com sucesso.');
    setMensagemSucesso('Visto e avaliação registrados com sucesso pelo Prof. George Guimarães!');
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  const handleImprimir = () => {
    window.print();
  };

  const selecionarModelo = (modeloId: string) => {
    const modelo = modelosCultivo.find((item) => item.id === modeloId) || null;
    setModeloEditado(modelo);
    onModeloSelecionado?.(modelo);
    atualizarCampo('modeloCultivoId', modelo?.id || null);
    if (modelo) {
      atualizarCampo('cultura', modelo.cultura);
      atualizarCampo('variedade', modelo.variedade || '');
      const area = ficha.areaCanteiroM2 ?? canteiro.areaM2 ?? 0;
      const plantasCalculadas = calcularPlantasDoCanteiro(area, modelo);
      atualizarCampo('espacamento', formatarEspacamento(modelo.espacamentoLinhasM, modelo.espacamentoPlantasM));
      atualizarCampo('plantasPorCanteiroValor', plantasCalculadas);
      atualizarCampo('plantasPorCanteiro', plantasCalculadas == null ? '' : `${plantasCalculadas} plantas`);
    }
  };

  const atualizarModelo = <K extends keyof ModeloCultivoApi>(campo: K, valor: ModeloCultivoApi[K]) => {
    if (!modeloEditado) return;

    const proximoModelo = { ...modeloEditado, [campo]: valor };
    setModeloEditado(proximoModelo);

    if (campo === 'espacamentoLinhasM' || campo === 'espacamentoPlantasM') {
      const area = ficha.areaCanteiroM2 || canteiro.areaM2 || 0;
      const plantasCalculadas = calcularPlantasDoCanteiro(area, proximoModelo);
      atualizarCampo('plantasPorCanteiroValor', plantasCalculadas);
      atualizarCampo('plantasPorCanteiro', plantasCalculadas == null ? '' : `${plantasCalculadas} plantas`);
      atualizarCampo('espacamento', formatarEspacamento(proximoModelo.espacamentoLinhasM, proximoModelo.espacamentoPlantasM));
    }
  };

  const atualizarAreaCanteiro = (valor: number | null) => {
    atualizarCampo('areaCanteiroM2', valor);
    if (!modeloEditado) return;

    const plantasCalculadas = calcularPlantasDoCanteiro(valor, modeloEditado);
    atualizarCampo('plantasPorCanteiroValor', plantasCalculadas);
    atualizarCampo('plantasPorCanteiro', plantasCalculadas == null ? '' : `${plantasCalculadas} plantas`);
  };

  const handleSalvarModelo = async () => {
    if (!modeloEditado || !onSalvarModelo) return;
    setSalvandoModelo(true);
    setMensagemErro('');
    try {
      await onSalvarModelo(modeloEditado);
      setMensagemSucesso('Parâmetros agronômicos atualizados com sucesso.');
      window.setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Não foi possível salvar o modelo de cultivo.');
    } finally {
      setSalvandoModelo(false);
    }
  };

  const renderCampo = (campo: keyof FichaCampoData, className = 'text-slate-800 font-semibold') => {
    const valor = String(ficha[campo] ?? '');
    if (!podeEditar) return <span className={className}>{valor || '—'}</span>;

    return (
      <input
        aria-label={String(campo)}
        value={valor}
        onChange={(evento) => atualizarCampo(campo, evento.target.value)}
        className={`min-w-0 flex-1 rounded-md border border-emerald-200 bg-emerald-50/30 px-2 py-1 text-xs text-slate-800 focus:border-[#27633b] focus:outline-none ${className}`}
      />
    );
  };

  const renderTexto = (campo: keyof FichaCampoData, placeholder: string) => {
    const valor = String(ficha[campo] ?? '');
    if (!podeEditar) {
      return <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">{valor || placeholder}</p>;
    }

    return (
      <textarea
        aria-label={String(campo)}
        value={valor}
        onChange={(evento) => atualizarCampo(campo, evento.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-y rounded-lg border border-emerald-200 bg-emerald-50/30 p-2 text-xs leading-relaxed text-slate-700 focus:border-[#27633b] focus:outline-none"
      />
    );
  };

  return (
    <div className="space-y-4 print:space-y-0 print:m-0 print:p-0">
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
          {podeEditar && (
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex items-center gap-1.5 rounded-xl bg-[#27633b] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1a4428] disabled:cursor-wait disabled:opacity-60 transition shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{salvando ? 'Salvando...' : 'Salvar ficha'}</span>
            </button>
          )}
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

      {mensagemErro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 shadow-sm print:hidden">
          {mensagemErro}
        </div>
      )}

      {podeEditar && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm print:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Editar ficha do canteiro</h3>
              <p className="text-xs text-slate-600">As alterações ficam pendentes até você salvar no servidor.</p>
            </div>
            <select
              aria-label="status da ficha"
              value={ficha.statusEntrega}
              onChange={(evento) => atualizarCampo('statusEntrega', evento.target.value as FichaCampoData['statusEntrega'])}
              className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="pendente">Pendente</option>
              <option value="entregue">Entregue</option>
              <option value="aprovado">Aprovado</option>
            </select>
          </div>
          <div className="mb-3 rounded-xl border border-emerald-200 bg-white p-3">
            <label className="text-xs font-semibold text-slate-700">
              Modelo agronômico da cultura
              <select
                aria-label="modelo agronômico da cultura"
                value={ficha.modeloCultivoId || ''}
                onChange={(evento) => selecionarModelo(evento.target.value)}
                className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-normal text-slate-800"
              >
                <option value="">Selecione um modelo para calcular a previsão</option>
                {modelosCultivo.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.cultura}{modelo.variedade ? ` - ${modelo.variedade}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {modeloEditado && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-slate-700">
                  Área (m²)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={ficha.areaCanteiroM2 ?? canteiro.areaM2 ?? ''}
                    onChange={(evento) => atualizarAreaCanteiro(evento.target.value ? Number(evento.target.value) : null)}
                    className="mt-1 w-full rounded-lg border border-emerald-200 px-2 py-2 text-xs font-normal"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Plantas por canteiro
                  <input
                    type="number"
                    min="0.01"
                    step="1"
                    value={ficha.plantasPorCanteiroValor ?? ''}
                    readOnly
                    aria-readonly="true"
                    className="mt-1 w-full rounded-lg border border-emerald-200 bg-slate-50 px-2 py-2 text-xs font-normal"
                  />
                  <span className="mt-1 block text-[11px] font-normal text-slate-500">
                    Calculado pela largura fixa de 1 m e pelo comprimento do canteiro.
                  </span>
                </label>
              </div>
            )}
            {modeloEditado && perfil === 'professor' && onSalvarModelo && (
              <div className="mt-3 border-t border-emerald-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">Parâmetros editáveis pelo professor</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Linhas (m)
                    <input type="number" min="0.0001" step="0.01" value={modeloEditado.espacamentoLinhasM} onChange={(e) => atualizarModelo('espacamentoLinhasM', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-emerald-200 px-2 py-2 text-xs font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Plantas (m)
                    <input type="number" min="0.0001" step="0.01" value={modeloEditado.espacamentoPlantasM} onChange={(e) => atualizarModelo('espacamentoPlantasM', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-emerald-200 px-2 py-2 text-xs font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Média kg por planta
                    <input type="number" min="0.0001" step="0.01" value={modeloEditado.pesoMedioKgPorPlanta} onChange={(e) => atualizarModelo('pesoMedioKgPorPlanta', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-emerald-200 px-2 py-2 text-xs font-normal" />
                  </label>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Fator de aproveitamento
                    <input type="number" min="0.01" max="1" step="0.01" value={modeloEditado.fatorAproveitamento} onChange={(e) => atualizarModelo('fatorAproveitamento', Number(e.target.value))} className="mt-1 w-40 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-normal" />
                  </label>
                  <button type="button" onClick={handleSalvarModelo} disabled={salvandoModelo} className="rounded-lg bg-[#27633b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                    {salvandoModelo ? 'Salvando...' : 'Salvar parâmetros'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['grupo', 'Grupo'],
              ['canteiroCodigo', 'Código do canteiro'],
              ['cultura', 'Cultura'],
              ['dataPlantio', 'Data do plantio'],
              ['espacamento', 'Espaçamento'],
              ['plantasPorCanteiro', 'Plantas por canteiro'],
              ['previsaoColheita', 'Previsão de colheita'],
            ] as const).map(([campo, rotulo]) => (
              <label key={campo} className="text-xs font-semibold text-slate-700">
                {rotulo}
                <input
                  aria-label={rotulo}
                  value={String(ficha[campo] ?? '')}
                  onChange={(evento) => atualizarCampo(campo, evento.target.value)}
                  readOnly={Boolean(ficha.modeloCultivoId && (campo === 'espacamento' || campo === 'plantasPorCanteiro'))}
                  aria-readonly={ficha.modeloCultivoId && (campo === 'espacamento' || campo === 'plantasPorCanteiro') ? 'true' : undefined}
                  className={`mt-1 w-full rounded-lg border border-emerald-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#27633b] focus:outline-none ${ficha.modeloCultivoId && (campo === 'espacamento' || campo === 'plantasPorCanteiro') ? 'bg-slate-50' : 'bg-white'}`}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([
              ['adubacao', 'Adubação'],
              ['controlePragas', 'Controle de pragas'],
              ['limpaCapina', 'Limpa/capina'],
              ['obs', 'Observações'],
            ] as const).map(([campo, rotulo]) => (
              <label key={campo} className="text-xs font-semibold text-slate-700">
                {rotulo}
                <textarea
                  aria-label={rotulo}
                  value={String(ficha[campo] ?? '')}
                  onChange={(evento) => atualizarCampo(campo, evento.target.value)}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 focus:border-[#27633b] focus:outline-none"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm print:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Previsão de colheita</h3>
            <p className="mt-1 text-xs text-slate-600">Estimativa baseada no modelo agronômico e nos dados do canteiro.</p>
          </div>
          <span className="text-right text-2xl font-black text-amber-800">
            {ficha.previsaoKg?.previsaoKg != null ? `${ficha.previsaoKg.previsaoKg.toLocaleString('pt-BR')} kg` : '—'}
          </span>
        </div>
        {ficha.previsaoKg && (
          <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
            <span><strong>Modelo:</strong> {ficha.previsaoKg.modeloCultivoNome || 'Não selecionado'}</span>
            <span><strong>Plantas estimadas:</strong> {ficha.previsaoKg.plantasEstimadas?.toLocaleString('pt-BR') || '—'}</span>
            <span><strong>Aproveitamento:</strong> {ficha.previsaoKg.fatorAproveitamento ? `${(ficha.previsaoKg.fatorAproveitamento * 100).toLocaleString('pt-BR')}%` : '—'}</span>
          </div>
        )}
        {ficha.previsaoKg && (
          <div className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
            <span><strong>Área considerada:</strong> {ficha.previsaoKg.areaCanteiroM2 != null ? `${ficha.previsaoKg.areaCanteiroM2.toLocaleString('pt-BR')} m²` : '—'}</span>
            <span><strong>Espaçamento:</strong> {ficha.previsaoKg.espacamentoLinhasM != null && ficha.previsaoKg.espacamentoPlantasM != null ? formatarEspacamento(ficha.previsaoKg.espacamentoLinhasM, ficha.previsaoKg.espacamentoPlantasM) : '—'}</span>
            <span><strong>Média da cultura:</strong> {ficha.previsaoKg.pesoMedioKgPorPlanta != null ? `${ficha.previsaoKg.pesoMedioKgPorPlanta} kg/planta` : '—'}</span>
          </div>
        )}
        {ficha.previsaoKg?.aviso && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-2 text-xs font-semibold text-amber-900">
            {ficha.previsaoKg.aviso}
          </p>
        )}
      </section>

      {/* ============================================================ */}
      {/* DOCUMENTO DA FICHA DE CAMPO  */}
      {/* ============================================================ */}
      <div
        id="printable-ficha-campo"
        className="printable-ficha rounded-3xl border-2 border-slate-300/80 bg-white p-6 sm:p-9 shadow-md print:p-4 print:border-2 print:border-slate-800 print:shadow-none print:rounded-lg font-sans text-slate-800"
      >

        {/* CABEÇALHO  */}
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
          <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-dotted border-slate-400 pb-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,2.2fr)] sm:items-start">
            {/* Canteiro */}
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="font-bold text-slate-900">Canteiro:</span>
              <span className="font-black text-slate-900 underline decoration-slate-400 underline-offset-4">
                {ficha.canteiroCodigo}
              </span>
            </div>

            {/* Cultura */}
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="font-bold text-slate-900">Cultura:</span>
              <span className="text-slate-800 font-semibold">
                {ficha.cultura}
              </span>
              {ficha.variedade && (
                <span className="text-slate-600 italic">({ficha.variedade})</span>
              )}
            </div>

            {/* Data do Plantio/semeio/transplantio */}
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="font-bold text-slate-900 text-xs">
                Data do Plantio/semeio/transplantio:
              </span>
              <span className="font-mono font-bold text-slate-900 break-words">
                {ficha.dataPlantio}
              </span>
            </div>
          </div>

          {/* Linha 3: Espaçamento, Plantas/canteiro, Plantas/Ha */}
          {/* Linha 3: Espaçamento e Plantas/canteiro */}
          <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-dotted border-slate-400 pb-2 sm:grid-cols-2 sm:items-start">
            {/* Espaçamento */}
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="font-bold text-slate-900 shrink-0">Espaçamento:</span>
              <span className="min-w-0 break-words text-slate-800 font-semibold">{ficha.espacamento}</span>
            </div>

            {/* Plantas/canteiro */}
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="font-bold text-slate-900">Plantas/canteiro:</span>
              <span className="min-w-0 break-words text-slate-800 font-semibold">{ficha.plantasPorCanteiro}</span>
            </div>

            {/* Plantas/Ha */}
          </div>

          {/* Linha 4: Previsão de Colheita */}
          <div className="flex min-w-0 flex-col gap-1.5 border-b border-dotted border-slate-400 pb-2 sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-bold text-slate-900 shrink-0">Previsão de Colheita:</span>
            <span className="font-mono font-bold text-slate-900 break-words">{ficha.previsaoColheita}</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* OS 4 QUADROS PRINCIPAIS DE REGISTRO  */}
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
        <div className="mt-6 rounded-2xl border border-emerald-900/15 bg-gradient-to-br from-emerald-50/50 to-white p-5 print:mt-4 print:border-slate-800 print:bg-white print:rounded-lg print:p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-900/10 pb-3 print:border-slate-300">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#27633b] text-white print:hidden">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Validação da entrega da ficha de campo
                </h4>
              </div>
            </div>

            {ficha.vistoProfessor?.assinado ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 print:bg-white print:border print:border-slate-800 print:text-slate-900">
                ✓ Visto Concedido em {ficha.vistoProfessor.dataVisto}
              </span>
            ) : (
              <span className="hidden print:inline-block text-[11px] font-semibold text-slate-700">
                Assinatura do Docente: ____________________________
              </span>
            )}
          </div>

          <div className="mt-3 text-xs">
            {perfil === 'professor' && podeEditar ? (
              <div className="space-y-3">
                <label className="block text-slate-700 font-semibold print:hidden">
                  Parecer do Professor sobre o Manejo do Canteiro:
                </label>
                <div className="flex flex-col sm:flex-row gap-2 print:hidden">
                  <input
                    type="text"
                    value={parecerInput}
                    onChange={(e) => setParecerInput(e.target.value)}
                    placeholder="Adicione um comentário ou feedback para o grupo..."
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#27633b] focus:outline-none"
                  />
                  <button
                    onClick={handleConcederVisto}
                    disabled={salvando}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#27633b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a4428] transition shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{ficha.vistoProfessor?.assinado ? 'Atualizar Visto' : 'Dar Visto na Ficha'}</span>
                  </button>
                </div>
                {/* Texto impresso do parecer caso o professor esteja visualizando */}
                <div className="hidden print:block text-xs">
                  <span className="font-bold text-slate-800">Parecer do Professor: </span>
                  <span className="text-slate-700">
                    {ficha.vistoProfessor?.parecer || '____________________________________________________________________'}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-semibold text-slate-600">Parecer do Docente:</span>
                <p className="mt-1 italic text-slate-700 bg-white/70 p-2.5 rounded-xl border border-emerald-100 print:bg-white print:border-none print:p-0">
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
