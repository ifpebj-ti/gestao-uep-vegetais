import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  GraduationCap,
  Sprout,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ListTodo,
  Plus,
  Compass,
  FileText,
  UserCheck,
} from 'lucide-react';
import { TerrariumMap } from '../../components/TerrariumMap';
import { EntrarTurmaModal } from '../../components/EntrarTurmaModal';
import { Button } from '../../../../components/Button';
import { APP_CONFIG } from '../../../../config/constants';
import { useAuth } from '../../../../contexts/AuthContext';
import { UepContext } from '../../../../contexts/UepContext';
import { CANTEIROS_DATA, CanteiroData } from '../../data/horticulturaData';
import { Turma, turmaService, TarefaAluno } from '../../../../services/turmaService';

export const AlunoMapaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const uepContext = useContext(UepContext);
  const setSelectedUep = uepContext?.setSelectedUep || (() => {});

  const [modalEntrarTurmaAberto, setModalEntrarTurmaAberto] = useState(false);
  const [modoVisualizacao, setModoVisualizacao] = useState<'meus_canteiros' | 'mapa_geral'>('meus_canteiros');

  const alunoEmail = user?.email || 'aluno@discente.ifpe.edu.br';
  const alunoNome = user?.nome || 'Estudante IFPE';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Carrega ou busca a turma em que o aluno está vinculado
  const [turmaAtiva, setTurmaAtiva] = useState<Turma | null>(() =>
    turmaService.obterTurmaDoAluno(alunoEmail)
  );

  // Lista de tarefas do estudante
  const [tarefas, setTarefas] = useState<TarefaAluno[]>(() =>
    turmaService.listarTarefas(undefined, alunoEmail)
  );

  // Canteiros sob responsabilidade do aluno (derivados da sua turma)
  const meusCanteiros = useMemo(() => {
    if (!turmaAtiva) return [];
    return CANTEIROS_DATA.filter((c) => turmaAtiva.canteirosIds.includes(c.id));
  }, [turmaAtiva]);

  const tarefasPendentes = useMemo(
    () => tarefas.filter((t) => !t.concluida),
    [tarefas]
  );

  const tarefasConcluidas = useMemo(
    () => tarefas.filter((t) => t.concluida),
    [tarefas]
  );

  const handleTurmaVinculadaComSucesso = (turma: Turma) => {
    setTurmaAtiva(turma);
    setSelectedUep(turma.uep);
    setTarefas(turmaService.listarTarefas(undefined, alunoEmail));
    setModalEntrarTurmaAberto(false);
  };

  const handleAlternarTarefa = (tarefaId: string, statusAtual: boolean) => {
    const atualizada = turmaService.alternarStatusTarefa(tarefaId, !statusAtual, alunoNome);
    setTarefas((prev) => prev.map((t) => (t.id === tarefaId ? atualizada : t)));
  };

  return (
    <div className="flex h-screen flex-col bg-[#f4f1e7] text-slate-800 overflow-hidden font-sans">
      {/* Modal de Primeiro Acesso: Digite o Código da Turma */}
      <EntrarTurmaModal
        alunoEmail={alunoEmail}
        isOpen={modalEntrarTurmaAberto || !turmaAtiva}
        onSuccess={handleTurmaVinculadaComSucesso}
        onClose={turmaAtiva ? () => setModalEntrarTurmaAberto(false) : undefined}
      />

      {/* Barra de Navegação Superior */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-emerald-950/10 bg-white/90 px-4 backdrop-blur-md sm:px-6 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-brand text-lg font-bold text-[#27633b]">
                {APP_CONFIG.name}
              </span>
              <span className="rounded-full bg-[#27633b]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#27633b]">
                Área do Aluno
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {APP_CONFIG.institution} &bull; Gestão Prática de Canteiros
            </p>
          </div>
        </div>

        {/* Informações da Turma Ativa */}
        <div className="flex items-center gap-3">
          {turmaAtiva ? (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-900">
              <GraduationCap className="h-4 w-4 text-emerald-700" />
              <span>
                Turma: <strong>{turmaAtiva.codigo}</strong> ({turmaAtiva.nome})
              </span>
              <button
                onClick={() => setModalEntrarTurmaAberto(true)}
                className="ml-1 text-[11px] font-bold text-emerald-700 underline hover:text-emerald-950"
              >
                Trocar
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalEntrarTurmaAberto(true)}
              leftIcon={<GraduationCap className="h-4 w-4" />}
            >
              Inserir Código de Turma
            </Button>
          )}

          {/* Toggle de Visualização: Meus Canteiros vs. Mapa 3D */}
          <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold">
            <button
              onClick={() => setModoVisualizacao('meus_canteiros')}
              className={`rounded-lg px-3 py-1.5 transition ${
                modoVisualizacao === 'meus_canteiros'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meus Canteiros
            </button>
            <button
              onClick={() => setModoVisualizacao('mapa_geral')}
              className={`rounded-lg px-3 py-1.5 transition ${
                modoVisualizacao === 'mapa_geral'
                  ? 'bg-[#27633b] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mapa da UEP
            </button>
          </div>

          {/* Botão de Sair / Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            aria-label="Sair da conta"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Corpo da Página do Aluno */}
      {modoVisualizacao === 'mapa_geral' ? (
        /* Modo Consulta Geral: Mapa Interativo 3D */
        <div className="relative flex-1">
          <TerrariumMap
            selectedCanteiroId={null}
            onSelectCanteiro={(canteiro: CanteiroData | null) => {
              if (canteiro) {
                navigate(`/olericultura/aluno/canteiro/${canteiro.id}`);
              }
            }}
          />
        </div>
      ) : (
        /* Modo Painel de Acompanhamento do Aluno */
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Boas-vindas ao Aluno */}
            <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#27633b]">
                    Painel do Estudante
                  </span>
                  <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    Olá, {alunoNome.split(' ')[0]}!
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Aqui você gerencia seus canteiros sob orientação do{' '}
                    <strong>{turmaAtiva?.professorNome || 'Professor'}</strong> e lança suas tarefas diárias de campo.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3 text-center min-w-[100px]">
                    <span className="block text-[11px] font-bold uppercase text-slate-400">
                      Canteiros
                    </span>
                    <span className="text-xl font-extrabold text-slate-800">
                      {meusCanteiros.length}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3 text-center min-w-[100px]">
                    <span className="block text-[11px] font-bold uppercase text-emerald-700">
                      Tarefas Pendentes
                    </span>
                    <span className="text-xl font-extrabold text-emerald-800">
                      {tarefasPendentes.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Principal: Seus Canteiros (Esquerda) e Lista de Tarefas (Direita) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Seção 1: Meus Canteiros Designados (2 Colunas) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-[#27633b]" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Meus Canteiros Designados
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    Clique no canteiro para abrir a ficha simplificada e tarefas
                  </span>
                </div>

                {meusCanteiros.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
                    <Sprout className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-700">
                      Nenhum canteiro vinculado no momento
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Peça ao seu professor para vincular sua turma aos canteiros da horta.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {meusCanteiros.map((canteiro) => {
                      const tarefasDoCanteiro = tarefas.filter(
                        (t) => t.canteiroId === canteiro.id && !t.concluida
                      );

                      return (
                        <div
                          key={canteiro.id}
                          onClick={() =>
                            navigate(`/olericultura/aluno/canteiro/${canteiro.id}`)
                          }
                          className="group relative flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-xl bg-[#27633b]/10 px-2.5 py-1 text-xs font-extrabold text-[#27633b]">
                                {canteiro.codigo}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  backgroundColor: `${canteiro.statusColor}18`,
                                  color: canteiro.statusColor,
                                }}
                              >
                                {canteiro.statusLabel}
                              </span>
                            </div>

                            <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-[#27633b] transition">
                              {canteiro.cultura}
                            </h3>
                            {canteiro.variedade && (
                              <p className="text-xs text-slate-500">
                                Cultivar: {canteiro.variedade}
                              </p>
                            )}

                            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>{canteiro.diasPlantio} dias</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-[11px] font-semibold text-slate-500">
                              {tarefasDoCanteiro.length === 0
                                ? 'Nenhuma pendência'
                                : `${tarefasDoCanteiro.length} tarefa(s) pendente(s)`}
                            </span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-slate-600 group-hover:bg-[#27633b] group-hover:text-white transition">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seção 2: Minhas Tarefas de Campo & Visto do Professor (1 Coluna) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-[#27633b]" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Minhas Atividades
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {tarefasConcluidas.length}/{tarefas.length} Concluídas
                  </span>
                </div>

                <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm space-y-3">
                  {tarefas.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Você ainda não cadastrou tarefas. Abra um canteiro para planejar suas atividades práticas!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tarefas.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                            t.concluida
                              ? 'border-emerald-200/60 bg-emerald-50/40 text-slate-500'
                              : 'border-stone-200/80 bg-stone-50/60 text-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={t.concluida}
                            onChange={() => handleAlternarTarefa(t.id, t.concluida)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#27633b]"
                          />

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-bold ${
                                t.concluida ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {t.titulo}
                            </p>
                            {t.descricao && (
                              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                                {t.descricao}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                              <span className="rounded-md bg-stone-200/70 px-1.5 py-0.5 font-bold uppercase text-slate-700">
                                {t.canteiroId.toUpperCase()}
                              </span>

                              {t.vistoProfessor ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
                                  <UserCheck className="h-3 w-3" />
                                  <span>Visto Docente</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  <span>Aguardando Visto</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

