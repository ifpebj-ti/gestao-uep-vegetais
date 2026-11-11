import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  History,
  FileText,
  UserCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { CANTEIROS_DATA } from '../../data/horticulturaData';
import { FichaCampoOlericultura, FichaCampoData } from '../../components/FichaCampoOlericultura';
import { Button } from '../../../../components/Button';
import { BackButton } from '../../../../components/BackButton';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  turmaService,
  TarefaAluno,
  RegistroHistoricoAluno,
} from '../../../../services/turmaService';
import { canteiroService, FichaCampoApi, ModeloCultivoApi } from '../../../../services/canteiroService';

export const AlunoCanteiroDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const alunoEmail = user?.email || 'aluno@discente.ifpe.edu.br';
  const alunoNome = user?.nome || 'Estudante IFPE';

  const canteiro = CANTEIROS_DATA.find((c) => c.id === id) || CANTEIROS_DATA[0];
  const turmaAtiva = turmaService.obterTurmaDoAluno(alunoEmail);

  const [abaAtiva, setAbaAtiva] = useState<'ficha' | 'tarefas' | 'historico'>('ficha');
  const [modelosCultivo, setModelosCultivo] = useState<ModeloCultivoApi[]>([]);

  useEffect(() => {
    let ativo = true;
    canteiroService.getModelosCultivo()
      .then((modelos) => {
        if (ativo) setModelosCultivo(modelos);
      })
      .catch(() => {
        if (ativo) setModelosCultivo([]);
      });

    return () => { ativo = false; };
  }, []);

  const [fichaInicial, setFichaInicial] = useState<FichaCampoData | null>(null);
  const [carregandoFicha, setCarregandoFicha] = useState(true);
  const [erroFicha, setErroFicha] = useState<string | null>(null);

  const converterFicha = (dados: FichaCampoApi): FichaCampoData => ({
    grupo: dados.grupo || '',
    turma: dados.turma || '',
    canteiroCodigo: dados.canteiroCodigo || '',
    cultura: dados.cultura || '',
    variedade: dados.variedade || '',
    dataPlantio: dados.dataPlantio || '',
    espacamento: dados.espacamento || '',
    plantasPorCanteiro: dados.plantasPorCanteiro || '',
    previsaoColheita: dados.previsaoColheita || '',
    adubacao: dados.adubacao || '',
    controlePragas: dados.controlePragas || '',
    limpaCapina: dados.limpaCapina || '',
    obs: dados.obs || '',
    statusEntrega: (dados.statusEntrega || 'pendente') as FichaCampoData['statusEntrega'],
    dataEntrega: dados.dataEntrega || '',
    vistoProfessor: {
      assinado: dados.vistoAssinado,
      dataVisto: dados.dataVisto || undefined,
      parecer: dados.parecer || undefined,
    },
    persistida: dados.persistida,
    updatedAt: dados.updatedAt,
    updatedBy: dados.updatedBy,
    modeloCultivoId: dados.modeloCultivoId,
    areaCanteiroM2: dados.areaCanteiroM2,
    plantasPorCanteiroValor: dados.plantasPorCanteiroValor,
    previsaoKg: dados.previsaoKg,
  });

  useEffect(() => {
    let ativo = true;
    setCarregandoFicha(true);
    setErroFicha(null);
    setFichaInicial(null);

    canteiroService.getFicha(canteiro.id)
      .then((dados) => {
        if (ativo) setFichaInicial(converterFicha(dados));
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        setErroFicha(erro instanceof Error ? erro.message : 'Não foi possível carregar a ficha do servidor.');
      })
      .finally(() => {
        if (ativo) setCarregandoFicha(false);
      });

    return () => { ativo = false; };
  }, [canteiro.id]);

  const handleSalvarFicha = async (ficha: FichaCampoData): Promise<FichaCampoData> => {
    const salva = await canteiroService.saveFicha(canteiro.id, {
      canteiroId: canteiro.id,
      grupo: ficha.grupo,
      turma: ficha.turma || canteiro.turmaResponsavel || '',
      canteiroCodigo: ficha.canteiroCodigo,
      cultura: ficha.cultura,
      variedade: ficha.variedade,
      dataPlantio: ficha.dataPlantio,
      espacamento: ficha.espacamento,
      plantasPorCanteiro: ficha.plantasPorCanteiro,
      previsaoColheita: ficha.previsaoColheita,
      adubacao: ficha.adubacao,
      controlePragas: ficha.controlePragas,
      limpaCapina: ficha.limpaCapina,
      obs: ficha.obs,
      statusEntrega: ficha.statusEntrega,
      dataEntrega: ficha.dataEntrega || null,
      vistoAssinado: ficha.vistoProfessor?.assinado || false,
      dataVisto: ficha.vistoProfessor?.dataVisto || null,
      parecer: ficha.vistoProfessor?.parecer || null,
      updatedAt: null,
      updatedBy: null,
      persistida: ficha.persistida || false,
      modeloCultivoId: ficha.modeloCultivoId || null,
      areaCanteiroM2: ficha.areaCanteiroM2 ?? canteiro.areaM2 ?? null,
      plantasPorCanteiroValor: ficha.plantasPorCanteiroValor ?? null,
      previsaoKg: ficha.previsaoKg || null,
    });

    // Só publica a resposta confirmada pelo servidor depois do PUT concluir.
    const fichaCanonica = converterFicha(salva);
    setFichaInicial(fichaCanonica);

    // Registra a atualização na linha do tempo local para acompanhamento docente.
    turmaService.registrarAcaoHistorico({
      canteiroId: canteiro.id,
      alunoEmail,
      alunoNome,
      acao: 'Ficha de Campo Preenchida',
      detalhes: `Ficha do canteiro ${canteiro.codigo} atualizada (${ficha.cultura}${
        ficha.variedade ? ` - ${ficha.variedade}` : ''
      }). Status: ${ficha.statusEntrega}.`,
    });

    recarregarDados();
    return fichaCanonica;
  };

  // Estado das Tarefas
  const [tarefas, setTarefas] = useState<TarefaAluno[]>(() =>
    turmaService.listarTarefas(canteiro.id, alunoEmail)
  );

  // Estado do Histórico / Linha do Tempo
  const [historico, setHistorico] = useState<RegistroHistoricoAluno[]>(() =>
    turmaService.listarHistorico(canteiro.id)
  );

  // Modal para Aluno Criar Nova Tarefa
  const [modalNovaTarefa, setModalNovaTarefa] = useState(false);
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [descTarefa, setDescTarefa] = useState('');
  const [tipoTarefa, setTipoTarefa] = useState<TarefaAluno['tipo']>('tratos');
  const [dataLimite, setDataLimite] = useState('');
  const [erroModal, setErroModal] = useState<string | null>(null);

  const recarregarDados = () => {
    setTarefas(turmaService.listarTarefas(canteiro.id, alunoEmail));
    setHistorico(turmaService.listarHistorico(canteiro.id));
  };

  const handleSalvarTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal(null);

    const titulo = tituloTarefa.trim();
    if (!titulo) {
      setErroModal('Informe o título da tarefa a ser executada.');
      return;
    }

    try {
      turmaService.criarTarefa({
        canteiroId: canteiro.id,
        turmaId: turmaAtiva?.id || 'turma-padrao',
        alunoEmail,
        alunoNome,
        titulo,
        descricao: descTarefa.trim(),
        tipo: tipoTarefa,
        dataLimite: dataLimite || undefined,
      });

      setTituloTarefa('');
      setDescTarefa('');
      setDataLimite('');
      setModalNovaTarefa(false);
      recarregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : 'Falha ao salvar tarefa.');
    }
  };

  const handleAlternarConclusao = (tarefaId: string, statusAtual: boolean) => {
    turmaService.alternarStatusTarefa(tarefaId, !statusAtual, alunoNome);
    recarregarDados();
  };

  return (
    <div className="min-h-screen bg-[#f4f1e7] text-slate-800 font-sans">
      {/* Topo / Navegação */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-emerald-950/10 bg-white/90 px-4 backdrop-blur-md sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <BackButton to="/olericultura/aluno/mapa" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg">
                Canteiro {canteiro.codigo}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: `${canteiro.statusColor}18`,
                  color: canteiro.statusColor,
                }}
              >
                {canteiro.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cultura: <strong>{canteiro.cultura}</strong> {canteiro.variedade && `(${canteiro.variedade})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setModalNovaTarefa(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Adicionar Tarefa
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Card Resumo do Canteiro */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4 border border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Dias de Plantio
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {canteiro.diasPlantio} dias
              </p>
              <p className="text-[11px] text-slate-500">
                Colheita em ~{canteiro.diasPrevistosColheita} dias
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
              <span className="text-[11px] font-bold uppercase text-emerald-700">
                Setor / Área
              </span>
              <p className="mt-1 text-base font-extrabold text-emerald-950 truncate">
                {canteiro.setor}
              </p>
              <p className="text-[11px] text-emerald-700">Horta Pedagógica</p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
              <span className="text-[11px] font-bold uppercase text-amber-700">
                Visto do Professor
              </span>
              <p className="mt-1 text-sm font-extrabold text-amber-950">
                {turmaAtiva?.professorNome || 'Docente Responsável'}
              </p>
              <p className="text-[11px] text-amber-700">Acompanhamento contínuo</p>
            </div>
          </div>
        </div>

        {/* Abas: Ficha de Campo vs Minhas Tarefas vs Linha do Tempo / Histórico */}
        <div className="flex border-b border-stone-200 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('ficha')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition shrink-0 cursor-pointer ${
              abaAtiva === 'ficha'
                ? 'border-[#27633b] text-[#27633b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Ficha de Campo (Olericultura)</span>
          </button>

          <button
            onClick={() => setAbaAtiva('tarefas')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition shrink-0 cursor-pointer ${
              abaAtiva === 'tarefas'
                ? 'border-[#27633b] text-[#27633b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Minhas Tarefas Práticas ({tarefas.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('historico')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition shrink-0 cursor-pointer ${
              abaAtiva === 'historico'
                ? 'border-[#27633b] text-[#27633b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Linha do Tempo & Histórico ({historico.length})</span>
          </button>
        </div>

        {/* Conteúdo da Aba 1: Ficha de Campo Oficial (Preenchimento pelo Aluno) */}
        {abaAtiva === 'ficha' && (
          <div className="space-y-4">
            {carregandoFicha ? (
              <p role="status" className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-slate-500">
                Carregando ficha de campo do servidor...
              </p>
            ) : erroFicha ? (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                Não foi possível carregar a ficha de campo: {erroFicha}
              </div>
            ) : fichaInicial ? (
              <FichaCampoOlericultura
                canteiro={canteiro}
                perfil="aluno"
                podeEditar={true}
                fichaInicial={fichaInicial}
                onSalvar={handleSalvarFicha}
                modelosCultivo={modelosCultivo}
              />
            ) : null}
          </div>
        )}

        {/* Conteúdo da Aba 2: Tarefas */}
        {abaAtiva === 'tarefas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Cadastre as atividades realizadas no campo. Cada conclusão é registrada na linha do tempo para o professor acompanhar e dar o visto.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setModalNovaTarefa(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nova Tarefa
              </Button>
            </div>

            {tarefas.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
                <ListTodo className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Nenhuma tarefa cadastrada para este canteiro
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Clique em "Nova Tarefa" para planejar seu manejo semanal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {tarefas.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-start justify-between rounded-2xl border p-4 transition ${
                      t.concluida
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-stone-200 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={t.concluida}
                        onChange={() => handleAlternarConclusao(t.id, t.concluida)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 accent-[#27633b] cursor-pointer"
                      />
                      <div>
                        <h4
                          className={`text-sm font-bold ${
                            t.concluida ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {t.titulo}
                        </h4>
                        {t.descricao && (
                          <p className="mt-1 text-xs text-slate-600">
                            {t.descricao}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="capitalize rounded-md bg-stone-100 px-2 py-0.5 font-bold text-slate-600">
                            Tipo: {t.tipo}
                          </span>
                          {t.dataLimite && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Prazo: {t.dataLimite}
                            </span>
                          )}
                          {t.concluida && t.concluidaEm && (
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Concluída em{' '}
                              {new Date(t.concluidaEm).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {t.vistoProfessor ? (
                        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-100/70 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          <UserCheck className="h-4 w-4" />
                          <span>Visto: {t.vistoPor || 'Professor'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Pendente de visto</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da Aba Linha do Tempo / Histórico */}
        {abaAtiva === 'historico' && (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">
              Diário de Campo e Linha do Tempo das Atividades
            </h3>

            {historico.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhum registro no histórico deste canteiro ainda.
              </p>
            ) : (
              <div className="relative pl-6 border-l-2 border-emerald-200 space-y-6">
                {historico.map((h) => (
                  <div key={h.id} className="relative group">
                    {/* Marcador do ponto na linha */}
                    <div className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#27633b] ring-4 ring-[#e8efdf]" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {h.acao}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(h.dataHora).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{h.detalhes}</p>
                      <span className="mt-1 inline-block text-[10px] font-bold text-[#27633b]">
                        Por: {h.alunoNome} ({h.alunoEmail})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal para Aluno Adicionar Tarefa */}
      {modalNovaTarefa && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#27633b]">
                  Canteiro {canteiro.codigo}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Planejar Nova Tarefa
                </h3>
              </div>
              <button
                onClick={() => setModalNovaTarefa(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroModal && (
              <div
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleSalvarTarefa} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  value={tituloTarefa}
                  onChange={(e) => setTituloTarefa(e.target.value)}
                  placeholder="Ex: Realizar rega e desbaste manual"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tipo de Manejo
                </label>
                <select
                  value={tipoTarefa}
                  onChange={(e) => setTipoTarefa(e.target.value as TarefaAluno['tipo'])}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                >
                  <option value="tratos">Tratos Culturais / Desbaste</option>
                  <option value="irrigacao">Irrigação</option>
                  <option value="adubacao">Adubação Orgânica de Cobertura</option>
                  <option value="semeadura">Semeadura / Transplantio</option>
                  <option value="preparo">Preparo de Solo / Compostagem</option>
                  <option value="colheita">Colheita & Pesagem</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Data Limite Prevista (Opcional)
                </label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Observações / Detalhes
                </label>
                <textarea
                  rows={2}
                  value={descTarefa}
                  onChange={(e) => setDescTarefa(e.target.value)}
                  placeholder="Ex: Utilizar regador com crivo fino para não danificar as mudas recém-transplantadas."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalNovaTarefa(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Tarefa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

