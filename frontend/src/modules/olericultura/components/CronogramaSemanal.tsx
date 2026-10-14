import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CanteiroCronograma,
  ESTILO_FASES,
  FaseSemanaInfo,
  getCronogramaCanteiro,
  getTodosCanteirosCronograma,
  SEMANAS_CRONOGRAMA,
  SemanaHeader,
} from '../data/cronogramaData';
import {
  CheckCircle2,
  Droplets,
  ExternalLink,
  Filter,
  GraduationCap,
  Layers,
  Leaf,
  Search,
  Sprout,
  UserCheck,
  X,
  Info,
  Sparkles,
} from 'lucide-react';

interface CronogramaSemanalProps {
  canteiroId?: string; // ID do canteiro específico
  modo?: 'individual' | 'panoramico'; // 'individual' = apenas o canteiro do aluno; 'panoramico' = visão geral de todos os canteiros
  perfil?: 'professor' | 'aluno';
  onSelectCanteiro?: (canteiroId: string) => void;
}

export const CronogramaSemanal: React.FC<CronogramaSemanalProps> = ({
  canteiroId,
  modo,
  perfil = 'professor',
  onSelectCanteiro,
}) => {
  const navigate = useNavigate();

  // Se 'modo' não for explicitado, se tem canteiroId é 'individual', caso contrário 'panoramico'
  const modoAtivo = modo || (canteiroId ? 'individual' : 'panoramico');

  // Canteiro específico no modo individual
  const canteiroIndividual = useMemo(() => {
    return getCronogramaCanteiro(canteiroId || 'c-01');
  }, [canteiroId]);

  // Lista de todos os canteiros para o modo panorâmico
  const todosCanteiros = useMemo(() => {
    return getTodosCanteirosCronograma();
  }, []);

  // Filtros para o modo panorâmico
  const [busca, setBusca] = useState('');
  const [turmaFiltro, setTurmaFiltro] = useState<string>('todas');
  const [setorFiltro, setSetorFiltro] = useState<string>('todos');

  // Estado do Modal de Detalhes da Semana
  const [modalDetalhe, setModalDetalhe] = useState<{
    canteiro: CanteiroCronograma;
    moduloNome?: string;
    semana: SemanaHeader;
    faseInfo: FaseSemanaInfo;
  } | null>(null);

  // Vistos do professor salvos localmente
  const [vistosDocente, setVistosDocente] = useState<Record<string, boolean>>({
    'c-01-41': true,
    'c-02-41': true,
    'c-03-41': true,
    'c-06-41': true,
    'c-04-41': true,
    'c-05-41': true,
    'c-07-41': true,
    'c-18-41': true,
  });

  const [pareceresDocente, setPareceresDocente] = useState<Record<string, string>>({
    'c-01-42': 'Ponto ideal de colheita atingido. Manter folhas frescas para a pesagem UEP.',
    'c-18-42': 'Ponto ideal de corte alcançado com 36 dias de ciclo. Excelente coloração roxa.',
  });

  const [anotacaoTemp, setAnotacaoTemp] = useState('');

  // Turmas únicas para o filtro
  const turmasUnicas = useMemo(() => {
    const turmas = new Set(todosCanteiros.map((c) => c.turma).filter(Boolean));
    return Array.from(turmas);
  }, [todosCanteiros]);

  // Setores únicos para o filtro
  const setoresUnicos = useMemo(() => {
    const sets = new Set(todosCanteiros.map((c) => c.setor));
    return Array.from(sets);
  }, [todosCanteiros]);

  // Lista filtrada para o modo panorâmico
  const canteirosFiltrados = useMemo(() => {
    return todosCanteiros.filter((c) => {
      const matchBusca =
        c.cultura.toLowerCase().includes(busca.toLowerCase()) ||
        c.variedade.toLowerCase().includes(busca.toLowerCase()) ||
        c.estudanteLider.toLowerCase().includes(busca.toLowerCase()) ||
        c.codigo.toLowerCase().includes(busca.toLowerCase());

      const matchTurma =
        turmaFiltro === 'todas' || c.turma.toLowerCase() === turmaFiltro.toLowerCase();

      const matchSetor =
        setorFiltro === 'todos' || c.setor.toLowerCase().includes(setorFiltro.toLowerCase());

      return matchBusca && matchTurma && matchSetor;
    });
  }, [todosCanteiros, busca, turmaFiltro, setorFiltro]);

  // Manipular clique numa célula da semana
  const handleAbrirDetalhe = (
    canteiro: CanteiroCronograma,
    semana: SemanaHeader,
    faseInfo: FaseSemanaInfo,
    moduloNome?: string
  ) => {
    const key = `${canteiro.id}-${semana.numero}`;
    setAnotacaoTemp(pareceresDocente[key] || faseInfo.observacaoProfessor || '');
    setModalDetalhe({
      canteiro,
      semana,
      faseInfo,
      moduloNome,
    });
  };

  const handleToggleVisto = (canteiroId: string, semanaNum: number) => {
    const key = `${canteiroId}-${semanaNum}`;
    setVistosDocente((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSalvarParecer = () => {
    if (!modalDetalhe) return;
    const key = `${modalDetalhe.canteiro.id}-${modalDetalhe.semana.numero}`;
    setPareceresDocente((prev) => ({
      ...prev,
      [key]: anotacaoTemp,
    }));
    setModalDetalhe((prev) =>
      prev
        ? {
            ...prev,
            faseInfo: {
              ...prev.faseInfo,
              observacaoProfessor: anotacaoTemp,
            },
          }
        : null
    );
  };

  const handleNavegarCanteiro = (id: string) => {
    if (onSelectCanteiro) {
      onSelectCanteiro(id);
    } else {
      const path = perfil === 'aluno' ? `/olericultura/aluno/canteiro/${id}` : `/canteiro/${id}`;
      navigate(path);
    }
  };

  // Renderizar ícone da cultura
  const renderIconeCultura = (icone: string) => {
    switch (icone) {
      case 'cenoura':
      case 'rabanete':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 shadow-sm">
            <Sprout className="h-5 w-5" />
          </div>
        );
      case 'couve':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-800 shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
        );
      case 'ervas':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
        );
      case 'solo':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-500/15 text-stone-700 shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 shadow-sm">
            <Sprout className="h-5 w-5" />
          </div>
        );
    }
  };

  // =========================================================================
  // CASO 1: MODO INDIVIDUAL (Dentro do Detalhe do Canteiro do Aluno)
  // Apenas os módulos e o cronograma semanal DESTE aluno e canteiro!
  // =========================================================================
  if (modoAtivo === 'individual') {
    return (
      <div className="space-y-6 font-sans">
        {/* Tabela de Módulos deste Canteiro (Estilo Horta Fácil com Visual Moderno) */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th
                  rowSpan={2}
                  className="p-3.5 border-r border-slate-200 min-w-[220px] align-middle"
                >
                  Descrição / Divisão do Canteiro
                </th>
                <th
                  className="p-3 text-center border-r border-slate-200 text-slate-700 font-bold bg-slate-100/50"
                >
                  Semana Anterior
                </th>
                <th
                  className="p-3 text-center border-x-2 border-emerald-500 bg-emerald-50/80 text-emerald-900 font-extrabold"
                >
                  Semana Atual (HOJE)
                </th>
                <th
                  colSpan={7}
                  className="p-2.5 text-center text-slate-700 font-extrabold bg-slate-100/70"
                >
                  Semanas Seguintes
                </th>
              </tr>

              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-600 font-semibold">
                {/* Semana Anterior */}
                <th className="p-2.5 text-center border-r border-slate-200">
                  <div className="font-bold text-slate-800">
                    {SEMANAS_CRONOGRAMA[0].dataInicio}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {SEMANAS_CRONOGRAMA[0].labelRelativa}
                  </div>
                </th>

                {/* Semana Atual (Destacada) */}
                <th className="p-2.5 text-center border-x-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold">
                  <div className="font-extrabold text-[#1a5d33] text-[11px]">
                    {SEMANAS_CRONOGRAMA[1].dataInicio}
                  </div>
                  <div className="inline-block rounded-md bg-[#1a5d33] text-white px-2 py-0.2 text-[9px] font-bold">
                    HOJE
                  </div>
                </th>

                {/* Semanas Seguintes (1ª a 7ª) */}
                {SEMANAS_CRONOGRAMA.slice(2).map((sem) => (
                  <th key={sem.numero} className="p-2.5 text-center border-r border-slate-200 last:border-r-0">
                    <div className="font-bold text-slate-800">{sem.dataInicio}</div>
                    <div className="text-[9px] text-slate-500">{sem.rotuloFoto1}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150 text-xs">
              {/* Linha Geral da Cultura deste Canteiro */}
              <tr className="bg-emerald-900/5 font-bold text-slate-900">
                <td className="p-3.5 border-r border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1a5d33] text-white font-mono text-[10px]">
                      {canteiroIndividual.codigo}
                    </span>
                    <span>{canteiroIndividual.cultura}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({canteiroIndividual.variedade})
                    </span>
                  </div>
                </td>
                {SEMANAS_CRONOGRAMA.map((sem) => {
                  const faseInfo = canteiroIndividual.fasesGerais[sem.numero];
                  if (!faseInfo) return <td key={sem.numero} className="p-2 text-center" />;
                  const estilo = ESTILO_FASES[faseInfo.fase];

                  return (
                    <td
                      key={sem.numero}
                      onClick={() => handleAbrirDetalhe(canteiroIndividual, sem, faseInfo, 'Visão Geral do Canteiro')}
                      className={`p-2 text-center cursor-pointer transition hover:bg-emerald-100/50 ${
                        sem.isAtual
                          ? 'border-x-2 border-emerald-500 bg-emerald-50/40'
                          : 'border-r border-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block rounded-xl px-2.5 py-1 text-[11px] font-bold shadow-sm transition hover:scale-105 ${estilo.bg} ${estilo.text} border ${estilo.border}`}
                      >
                        {faseInfo.label}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Módulos do Canteiro do Aluno */}
              {canteiroIndividual.modulos.map((modulo, idx) => (
                <tr
                  key={modulo.id}
                  className={`hover:bg-slate-50 transition ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <td className="p-3.5 border-r border-slate-200 pl-6">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">└─</span>
                      <div>
                        <p className="font-bold text-slate-800">{modulo.nome}</p>
                        <p className="text-[10px] text-slate-500">{modulo.descricao}</p>
                      </div>
                    </div>
                  </td>

                  {SEMANAS_CRONOGRAMA.map((sem) => {
                    const fase = modulo.fases[sem.numero];
                    if (!fase) {
                      return (
                        <td
                          key={sem.numero}
                          className={`p-2 text-center text-slate-300 ${
                            sem.isAtual
                              ? 'border-x-2 border-emerald-500 bg-emerald-50/40'
                              : 'border-r border-slate-200'
                          }`}
                        >
                          —
                        </td>
                      );
                    }
                    const estilo = ESTILO_FASES[fase.fase];

                    return (
                      <td
                        key={sem.numero}
                        onClick={() => handleAbrirDetalhe(canteiroIndividual, sem, fase, modulo.nome)}
                        className={`p-2 text-center cursor-pointer transition hover:bg-emerald-50 ${
                          sem.isAtual
                            ? 'border-x-2 border-emerald-500 bg-emerald-50/40'
                            : 'border-r border-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block rounded-xl px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 ${estilo.bg} ${estilo.text} border ${estilo.border}`}
                        >
                          {fase.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legenda das Fases Fenológicas */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Info className="h-4 w-4 text-emerald-700" />
            <span>Legenda das Fases Fenológicas & Manejo Agroecológico</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#15532b]" />
              <span className="font-semibold text-slate-800">Colheita e Pesagem</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-800">Crescimento / Vegetativo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-teal-400" />
              <span className="font-semibold text-slate-800">Desenvolvimento / Engrossamento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="font-semibold text-slate-800">Mudas / Transplante</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              <span className="font-semibold text-slate-800">Semeadura Direta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-400" />
              <span className="font-semibold text-slate-800">Descanso / Manejo de Solo</span>
            </div>
          </div>
        </div>

        {/* Modal Interativo de Detalhes da Semana */}
        {modalDetalhe && renderModalDetalhe()}
      </div>
    );
  }

  // =========================================================================
  // CASO 2: MODO PANORÂMICO (Disponível em Gestão de Canteiros do Menu)
  // Visão geral de TODOS os canteiros dos alunos agrupados por turma!
  // =========================================================================
  return (
    <div className="space-y-6 font-sans">
      {/* Topo: Título da Gestão de Canteiros por Turma */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#1a5d33]">
                <Sprout className="h-4 w-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Gestão de Canteiros • Acompanhamento Semanal da Turma
              </h2>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-[#1a5d33]">
                Ciclo 2026.2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Visão panorâmica semanal de todas as culturas e alunos responsáveis. Clique num canteiro para acessar seus módulos individuais.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 self-start sm:self-auto">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Semana Atual:</span>
            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-mono font-bold text-[#1a5d33]">
              14/10/2026 (SEM 42)
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros: Turma, Setor e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cultura, aluno ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Filtro por Turma */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={turmaFiltro}
              onChange={(e) => setTurmaFiltro(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="todas">Todas as Turmas</option>
              {turmasUnicas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Setor */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="todos">Todos os Setores</option>
              {setoresUnicos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Exibindo <strong>{canteirosFiltrados.length}</strong> canteiros cadastrados
        </div>
      </div>

      {/* Tabela Panorâmica de Todos os Canteiros por Turma (Foto 2) */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="p-4 border-r border-slate-200 min-w-[260px]">
                Cultura / Cultivar & Canteiro
              </th>
              <th className="p-4 border-r border-slate-200 min-w-[170px]">
                Setor & Dimensão
              </th>

              {/* Coluna Semana Anterior */}
              <th className="p-3 text-center border-r border-slate-200 min-w-[105px]">
                <span className="block text-slate-800 font-extrabold">SEM 41</span>
                <span className="block text-[9px] font-semibold text-slate-400">
                  {SEMANAS_CRONOGRAMA[0].dataInicio}
                </span>
              </th>

              {/* Coluna Semana Atual (DESTAQUE VERDE IGUAL FOTO 2) */}
              <th className="p-3 text-center border-x-2 border-emerald-500 bg-emerald-50/80 min-w-[130px]">
                <span className="block text-[#1a5d33] font-black text-xs">SEM 42 (ATUAL)</span>
                <span className="inline-block rounded-md bg-[#1a5d33] text-white px-2 py-0.2 text-[9px] font-bold">
                  HOJE
                </span>
              </th>

              {/* Colunas Semanas Futuras */}
              {SEMANAS_CRONOGRAMA.slice(2, 8).map((sem) => (
                <th
                  key={sem.numero}
                  className="p-3 text-center border-r border-slate-200 last:border-r-0 min-w-[105px]"
                >
                  <span className="block text-slate-800 font-extrabold">SEM {sem.numero}</span>
                  <span className="block text-[9px] font-semibold text-slate-400">
                    {sem.dataInicio}
                  </span>
                </th>
              ))}

              <th className="p-3 text-center min-w-[100px]">
                Ação
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-150 text-xs">
            {canteirosFiltrados.map((canteiro) => {
              return (
                <tr
                  key={canteiro.id}
                  className="transition hover:bg-emerald-50/30"
                >
                  {/* Coluna 1: Cultura, Lote, Canteiro, Aluno Responsável */}
                  <td className="p-4 border-r border-slate-200">
                    <div className="flex items-center gap-3">
                      {renderIconeCultura(canteiro.icone)}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">
                            {canteiro.cultura}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-600">
                            {canteiro.lote}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="font-mono font-bold text-emerald-800">
                            {canteiro.codigo}
                          </span>{' '}
                          • {canteiro.variedade}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mt-1">
                          <span className="text-slate-400">Aluno(a):</span>
                          <span className="font-bold text-slate-800">
                            {canteiro.estudanteLider}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Coluna 2: Setor e Dimensão */}
                  <td className="p-4 border-r border-slate-200 align-middle">
                    <div>
                      <span className="inline-block rounded-lg bg-emerald-100/90 text-emerald-900 px-2.5 py-0.5 text-[11px] font-bold">
                        {canteiro.setorBadge}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        {canteiro.dimensao}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {canteiro.turma}
                      </p>
                    </div>
                  </td>

                  {/* Coluna Semana 41 (Anterior) */}
                  <td
                    onClick={() =>
                      handleAbrirDetalhe(
                        canteiro,
                        SEMANAS_CRONOGRAMA[0],
                        canteiro.fasesGerais[41]
                      )
                    }
                    className="p-2.5 text-center border-r border-slate-200 align-middle cursor-pointer transition hover:bg-slate-100"
                  >
                    {(() => {
                      const fase = canteiro.fasesGerais[41];
                      if (!fase) return <span className="text-slate-300">—</span>;
                      const estilo = ESTILO_FASES[fase.fase];
                      return (
                        <span
                          className={`inline-block rounded-xl px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 ${estilo.bg} ${estilo.text} border ${estilo.border}`}
                        >
                          {fase.label}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Coluna Semana 42 (ATUAL / HOJE - DESTAQUE VERDE) */}
                  <td
                    onClick={() =>
                      handleAbrirDetalhe(
                        canteiro,
                        SEMANAS_CRONOGRAMA[1],
                        canteiro.fasesGerais[42]
                      )
                    }
                    className="p-2.5 text-center border-x-2 border-emerald-500 bg-emerald-50/40 align-middle cursor-pointer transition hover:bg-emerald-100/50"
                  >
                    {(() => {
                      const fase = canteiro.fasesGerais[42];
                      if (!fase) return <span className="text-slate-300">—</span>;
                      const estilo = ESTILO_FASES[fase.fase];
                      const key = `${canteiro.id}-42`;
                      const temVisto = vistosDocente[key];

                      return (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block rounded-xl px-3 py-1.5 text-[11px] font-black shadow-sm transition hover:scale-105 ${estilo.bg} ${estilo.text} border ${estilo.border}`}
                          >
                            {fase.label}
                          </span>
                          {temVisto && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>Visto Prof.</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Colunas Semanas Seguintes (SEM 43 a SEM 48) */}
                  {SEMANAS_CRONOGRAMA.slice(2, 8).map((sem) => {
                    const fase = canteiro.fasesGerais[sem.numero];

                    return (
                      <td
                        key={sem.numero}
                        onClick={() => fase && handleAbrirDetalhe(canteiro, sem, fase)}
                        className="p-2.5 text-center border-r border-slate-200 last:border-r-0 align-middle cursor-pointer transition hover:bg-slate-100"
                      >
                        {fase ? (
                          (() => {
                            const estilo = ESTILO_FASES[fase.fase];
                            return (
                              <span
                                className={`inline-block rounded-xl px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 ${estilo.bg} ${estilo.text} border ${estilo.border}`}
                              >
                                {fase.label}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Coluna Ação: Ver Canteiro do Aluno */}
                  <td className="p-2.5 text-center align-middle">
                    <button
                      onClick={() => handleNavegarCanteiro(canteiro.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-[#1a5d33] border border-emerald-200 hover:bg-[#1a5d33] hover:text-white transition"
                      title="Ver detalhes e módulos deste canteiro"
                    >
                      <span>Módulos</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda das Fases Fenológicas */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Info className="h-4 w-4 text-emerald-700" />
          <span>Legenda das Fases Fenológicas & Manejo Agroecológico</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#15532b]" />
            <span className="font-semibold text-slate-800">Colheita e Pesagem</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-800">Crescimento / Vegetativo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-teal-400" />
            <span className="font-semibold text-slate-800">Desenvolvimento / Engrossamento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="font-semibold text-slate-800">Mudas / Transplante</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-400" />
            <span className="font-semibold text-slate-800">Semeadura Direta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            <span className="font-semibold text-slate-800">Descanso / Manejo de Solo</span>
          </div>
        </div>
      </div>

      {/* Modal Interativo de Detalhes da Semana */}
      {modalDetalhe && renderModalDetalhe()}
    </div>
  );

  // Render do Modal de Detalhe da Semana
  function renderModalDetalhe() {
    if (!modalDetalhe) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
          {/* Topo do Modal */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-[#1a5d33] px-2.5 py-0.5 rounded-lg">
                  {modalDetalhe.canteiro.codigo}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {modalDetalhe.canteiro.cultura} • {modalDetalhe.semana.labelRelativa}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Período: {modalDetalhe.semana.dataInicio} a {modalDetalhe.semana.dataFim}
                {modalDetalhe.moduloNome ? ` • ${modalDetalhe.moduloNome}` : ''}
              </p>
            </div>

            <button
              onClick={() => setModalDetalhe(null)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Identificação do Aluno Responsável */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-100">
            <div className="flex items-center gap-2.5 text-xs">
              <UserCheck className="h-4 w-4 text-[#1a5d33]" />
              <div>
                <span className="text-slate-500 text-[11px] block">Aluno(a) Líder do Canteiro:</span>
                <strong className="text-slate-900">{modalDetalhe.canteiro.estudanteLider}</strong> ({modalDetalhe.canteiro.turma})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-900 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-xs">
                {modalDetalhe.canteiro.setor}
              </span>
            </div>
          </div>

          {/* Protocolo de Manejo da Semana */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-emerald-700" />
              <span>Protocolo de Manejo & Irrigação da Semana</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Irrigação */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-sky-600" />
                  Irrigação Programada
                </span>
                <p className="text-slate-600">{modalDetalhe.faseInfo.irrigacao}</p>
              </div>

              {/* Nutrição e Adubação */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                  Nutrição & Adubação
                </span>
                <p className="text-slate-600">{modalDetalhe.faseInfo.nutricao}</p>
              </div>
            </div>

            {/* Tratos Culturais Recomendados */}
            {modalDetalhe.faseInfo.tratosCulturais.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">
                  Tratos Culturais & Ações de Campo:
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-600">
                  {modalDetalhe.faseInfo.tratosCulturais.map((trato, i) => (
                    <li key={i}>{trato}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Checklist de Tarefas Práticas dos Alunos */}
          {modalDetalhe.faseInfo.tarefasPraticas.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>Checklist de Atividades Práticas da Turma</span>
              </h4>
              <div className="space-y-2">
                {modalDetalhe.faseInfo.tarefasPraticas.map((tarefa) => (
                  <label
                    key={tarefa.id}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 bg-white hover:bg-slate-50 cursor-pointer transition text-xs"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={tarefa.concluida !== undefined ? tarefa.concluida : true}
                      className="h-4 w-4 rounded text-[#1a5d33] focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">{tarefa.titulo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Parecer Docente & Visto do Professor George Guimarães */}
          <div className="rounded-2xl border border-emerald-900/15 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Visto Docente de Acompanhamento (Prof. George Guimarães)
              </span>

              <button
                onClick={() =>
                  handleToggleVisto(
                    modalDetalhe.canteiro.id,
                    modalDetalhe.semana.numero
                  )
                }
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  vistosDocente[
                    `${modalDetalhe.canteiro.id}-${modalDetalhe.semana.numero}`
                  ]
                    ? 'bg-[#1a5d33] text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {vistosDocente[
                    `${modalDetalhe.canteiro.id}-${modalDetalhe.semana.numero}`
                  ]
                    ? 'Visto Aplicado ✓'
                    : 'Assinar Visto Docente'}
                </span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Observações e Feedback do Professor para o Aluno:
              </label>
              <textarea
                rows={2}
                value={anotacaoTemp}
                onChange={(e) => setAnotacaoTemp(e.target.value)}
                placeholder="Ex: Excelente desenvolvimento vegetativo. Manter irrigação nos horários recomendados..."
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSalvarParecer}
                className="rounded-xl bg-[#1a5d33] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#124223] transition"
              >
                Salvar Avaliação do Manejo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
