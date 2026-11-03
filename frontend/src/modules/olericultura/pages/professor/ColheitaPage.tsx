import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Sprout,
  Scale,
  TrendingUp,
  CheckCircle2,
  Search,
  Plus,
  Calendar,
  ExternalLink,
  PackageCheck,
} from 'lucide-react';
import { BackButton } from '../../../../components/BackButton';
import { TerrariumMenu } from '../../components/TerrariumMenu';
import { APP_CONFIG } from '../../../../config/constants';
import { useAuth } from '../../../../contexts/AuthContext';
import { CANTEIROS_DATA, obterSetorPorCultura } from '../../data/horticulturaData';
import {
  RegistroColheitaItem,
  carregarRegistrosColheita,
  adicionarRegistroColheita,
} from '../../data/colheitaStore';

const formatarKg = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export const ColheitaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const profile: 'professor' | 'aluno' =
    user?.role?.toLowerCase() === 'aluno' ? 'aluno' : 'professor';
  const backPath = profile === 'aluno' ? '/olericultura/aluno/mapa' : '/mapa';

  const [registros, setRegistros] = useState<RegistroColheitaItem[]>(() =>
    carregarRegistrosColheita()
  );
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  // Estado para registrar nova pesagem de colheita
  const [modalAberto, setModalAberto] = useState(false);
  const [novoCanteiroId, setNovoCanteiroId] = useState('c-01');
  const [novoKg, setNovoKg] = useState('');
  const [novoDestino, setNovoDestino] = useState('Refeitório Estudantil IFPE');

  const canteirosHortalicas = useMemo(
    () => CANTEIROS_DATA.filter((c) => c.tipo === 'hortalica' && !c.cultura.toLowerCase().includes('vazio')),
    []
  );

  // Consolidação de quilos produzidos agrupados por vegetal (cultura)
  const resumoPorVegetal = useMemo(() => {
    const mapa = new Map<
      string,
      {
        cultura: string;
        variedade: string;
        categoria: string;
        totalKg: number;
        totalPrevistoKg: number;
        canteiros: string[];
      }
    >();

    registros.forEach((item) => {
      if (busca.trim() !== '') {
        const termo = busca.toLowerCase().trim();
        const match =
          item.cultura.toLowerCase().includes(termo) ||
          item.variedade.toLowerCase().includes(termo) ||
          item.canteiroCodigo.toLowerCase().includes(termo) ||
          item.responsavel.toLowerCase().includes(termo);
        if (!match) return;
      }

      const categoria = obterSetorPorCultura(item.cultura) || 'Hortaliças';
      if (categoriaFiltro !== 'todas' && categoria !== categoriaFiltro) {
        return;
      }

      const atual = mapa.get(item.cultura);
      if (atual) {
        atual.totalKg += item.kgProduzidos;
        if (!atual.canteiros.includes(item.canteiroCodigo)) {
          atual.canteiros.push(item.canteiroCodigo);
          atual.totalPrevistoKg += item.kgPrevistos;
        }
      } else {
        mapa.set(item.cultura, {
          cultura: item.cultura,
          variedade: item.variedade,
          categoria,
          totalKg: item.kgProduzidos,
          totalPrevistoKg: item.kgPrevistos,
          canteiros: [item.canteiroCodigo],
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) => b.totalKg - a.totalKg);
  }, [registros, busca, categoriaFiltro]);

  const totalGeralKg = useMemo(
    () => resumoPorVegetal.reduce((acc, item) => acc + item.totalKg, 0),
    [resumoPorVegetal]
  );

  const totalPrevistoGeralKg = useMemo(
    () => resumoPorVegetal.reduce((acc, item) => acc + item.totalPrevistoKg, 0),
    [resumoPorVegetal]
  );

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    registros.forEach((r) => {
      const cat = obterSetorPorCultura(r.cultura);
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    return registros.filter((item) => {
      const categoria = obterSetorPorCultura(item.cultura) || 'Hortaliças';
      if (categoriaFiltro !== 'todas' && categoria !== categoriaFiltro) return false;
      if (busca.trim() === '') return true;
      const termo = busca.toLowerCase().trim();
      return (
        item.cultura.toLowerCase().includes(termo) ||
        item.variedade.toLowerCase().includes(termo) ||
        item.canteiroCodigo.toLowerCase().includes(termo) ||
        item.responsavel.toLowerCase().includes(termo) ||
        item.turma.toLowerCase().includes(termo)
      );
    });
  }, [registros, busca, categoriaFiltro]);

  const handleRegistrarColheita = (e: React.FormEvent) => {
    e.preventDefault();
    const peso = Number(novoKg.replace(',', '.'));
    if (!Number.isFinite(peso) || peso <= 0) return;

    const canteiroRef = CANTEIROS_DATA.find((c) => c.id === novoCanteiroId);
    if (!canteiroRef) return;

    const colheitaAnterior = registros.find(
      (r) => r.canteiroId === canteiroRef.id
    );

    const atualizados = adicionarRegistroColheita({
      canteiroId: canteiroRef.id,
      canteiroCodigo: canteiroRef.codigo,
      cultura: canteiroRef.cultura,
      variedade: canteiroRef.variedade || '',
      turma: canteiroRef.turmaResponsavel,
      responsavel: canteiroRef.estudanteLider || 'Equipe do Canteiro',
      dataColheita: new Date().toLocaleDateString('pt-BR'),
      kgProduzidos: peso,
      kgPrevistos:
        colheitaAnterior?.kgPrevistos ??
        Number(((canteiroRef.areaM2 || 7.2) * 3.0).toFixed(1)),
      destino: novoDestino,
      observacao: 'Colheita realizada no canteiro',
      status: 'colhido',
    });

    setRegistros(atualizados);
    setNovoKg('');
    setModalAberto(false);
  };

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
              Colheita & Produção • UEP
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Banner Principal & Botão de Registrar Pesagem */}
        <section className="rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/30 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#1a4428]">
                <Scale className="h-3.5 w-3.5" />
                <span>Balanço de Produção Agronômica</span>
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Colheita e Produção por Vegetal (kg)
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Acompanhamento consolidado de quilos colhidos por cultura, rendimento em relação à previsão da ficha e histórico por canteiro.
              </p>
            </div>

            {profile === 'professor' && (
              <button
                onClick={() => setModalAberto(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#27633b] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#1a4428] transition shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Pesagem de Colheita</span>
              </button>
            )}
          </div>

          {/* KPIs Principais */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Produzido (Colhido)
                </span>
                <Scale className="h-4 w-4 text-[#27633b]" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#27633b]">
                {formatarKg(totalGeralKg)} <span className="text-base font-bold">kg</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Soma de todas as pesagens registradas na UEP
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Vegetais Contabilizados
                </span>
                <PackageCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {resumoPorVegetal.length} <span className="text-base font-bold text-slate-500">culturas</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Em {registrosFiltrados.length} lotes de colheita registrados
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rendimento Real vs Previsto
                </span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-blue-700">
                {totalPrevistoGeralKg > 0
                  ? `${Math.round((totalGeralKg / totalPrevistoGeralKg) * 100)}%`
                  : '100%'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Previsto pelas fichas: {formatarKg(totalPrevistoGeralKg)} kg
              </p>
            </div>
          </div>
        </section>

        {/* Barra de Busca e Filtro por Categoria */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por vegetal (ex: Alface, Couve, Tomate), código do canteiro ou aluno..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:border-[#27633b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filtro-categoria-colheita" className="text-xs font-bold text-slate-600 shrink-0">
              Família / Categoria:
            </label>
            <select
              id="filtro-categoria-colheita"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#27633b] focus:outline-none"
            >
              <option value="todas">Todas as culturas</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Grade de Produção Consolidada por Vegetal */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Produção Consolidada por Vegetal (kg)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Ordenado do maior para o menor volume colhido
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumoPorVegetal.map((veg) => {
              const percentualDoTotal =
                totalGeralKg > 0 ? Math.round((veg.totalKg / totalGeralKg) * 100) : 0;

              return (
                <div
                  key={veg.cultura}
                  className="flex flex-col justify-between rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-lg bg-emerald-100/80 px-2.5 py-1 text-[11px] font-semibold text-[#1a4428]">
                        {veg.categoria}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {veg.canteiros.map((cod) => (
                          <span
                            key={cod}
                            className="rounded-md bg-[#27633b] px-2 py-0.5 font-mono text-[11px] font-bold text-white"
                          >
                            {cod}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h4 className="mt-3 text-lg font-extrabold text-slate-900 leading-tight">
                      {veg.cultura}
                    </h4>
                    {veg.variedade && (
                      <p className="text-xs italic text-slate-500 mt-0.5">{veg.variedade}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                          Quantidade Produzida
                        </span>
                        <span className="text-2xl font-extrabold text-[#27633b]">
                          {formatarKg(veg.totalKg)} kg
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Previsto
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {formatarKg(veg.totalPrevistoKg)} kg
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                        <span>Participação no total colhido</span>
                        <span className="text-[#27633b] font-bold">{percentualDoTotal}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          style={{ width: `${Math.max(percentualDoTotal, 4)}%` }}
                          className="h-full rounded-full bg-[#27633b]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tabela Detalhada de Lotes Colhidos por Canteiro */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Histórico de Pesagens por Canteiro
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detalhamento de cada colheita realizada pelas turmas e equipes responsáveis
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Canteiro</th>
                  <th className="py-3.5 px-4">Vegetal / Cultura</th>
                  <th className="py-3.5 px-4">Equipe & Turma</th>
                  <th className="py-3.5 px-4">Data da Colheita</th>
                  <th className="py-3.5 px-4 text-right">Previsto (kg)</th>
                  <th className="py-3.5 px-4 text-right">Produzido (kg)</th>
                  <th className="py-3.5 px-4">Destinação</th>
                  <th className="py-3.5 px-4 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrosFiltrados.map((reg) => (
                  <tr key={reg.id} className="hover:bg-emerald-50/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#27633b] font-mono text-xs font-bold text-white">
                        {reg.canteiroCodigo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs">{reg.cultura}</p>
                      {reg.variedade && (
                        <p className="text-[11px] italic text-slate-500">{reg.variedade}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{reg.responsavel}</p>
                      <p className="text-[11px] text-slate-500">{reg.turma}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                        {reg.dataColheita}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                      {formatarKg(reg.kgPrevistos)} kg
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/90 px-2.5 py-1 font-extrabold text-[#1a4428]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                        {formatarKg(reg.kgProduzidos)} kg
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-700 font-medium">{reg.destino}</p>
                      {reg.observacao && (
                        <p className="text-[11px] italic text-slate-500">{reg.observacao}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            profile === 'aluno'
                              ? `/olericultura/aluno/canteiro/${reg.canteiroId}`
                              : `/canteiro/${reg.canteiroId}`
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#27633b] hover:bg-emerald-50 transition"
                      >
                        <span>Ver Canteiro</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal para o Professor registrar nova pesagem de colheita */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-emerald-900/10">
            <h3 className="text-lg font-extrabold text-slate-900">
              Registrar Pesagem de Colheita
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Informe o canteiro colhido e o peso aferido na balança (em kg) para somar à produção da UEP.
            </p>

            <form onSubmit={handleRegistrarColheita} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Canteiro e Vegetal
                </label>
                <select
                  value={novoCanteiroId}
                  onChange={(e) => setNovoCanteiroId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800 focus:border-[#27633b] focus:outline-none"
                >
                  {canteirosHortalicas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.cultura} ({c.estudanteLider || 'Sem líder'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantidade Produzida (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={novoKg}
                  onChange={(e) => setNovoKg(e.target.value)}
                  placeholder="Ex: 18.5"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold text-slate-800 focus:border-[#27633b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Destinação da Produção
                </label>
                <input
                  type="text"
                  value={novoDestino}
                  onChange={(e) => setNovoDestino(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 focus:border-[#27633b] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#27633b] px-5 py-2.5 font-bold text-white hover:bg-[#1a4428] transition shadow-sm"
                >
                  Salvar Pesagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Lateral */}
      <TerrariumMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFocusLocation={() => navigate(backPath)}
      />
    </div>
  );
};

