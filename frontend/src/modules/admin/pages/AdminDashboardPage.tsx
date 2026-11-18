import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sprout,
  Apple,
  UserPlus,
  Search,
  Pencil,
  UserCheck,
  UserX,
  Send,
  LogOut,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
} from 'lucide-react';
import { APP_CONFIG } from '../../../config/constants';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { UepType } from '../../../types/uep';
import {
  adminService,
  isEmailInstitucionalDocente,
  type ProfessorCadastrado,
  type ResultadoAlteracaoProfessor,
} from '../../../services/adminService';

type Feedback = {
  tipo: 'sucesso' | 'erro' | 'aviso';
  texto: string;
};

type Operacao =
  | { tipo: 'salvar' }
  | { tipo: 'uep' | 'convite' | 'status'; professorId: string };

const estilosFeedback = {
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  erro: 'border-red-200 bg-red-50 text-red-900',
  aviso: 'border-amber-200 bg-amber-50 text-amber-900',
};

function obterStatusProfessor(professor: ProfessorCadastrado) {
  if (professor.convitePendente) {
    return { rotulo: 'Convite pendente', estilo: 'bg-amber-50 text-amber-800' };
  }
  if (!professor.ativo) {
    return {
      rotulo: professor.emailVerificado ? 'Inativo' : 'Inativo · Aguardando confirmação de e-mail',
      estilo: 'bg-slate-100 text-slate-700',
    };
  }
  if (!professor.emailVerificado) {
    return { rotulo: 'Aguardando confirmação de e-mail', estilo: 'bg-amber-50 text-amber-800' };
  }
  return { rotulo: 'Ativo', estilo: 'bg-emerald-50 text-emerald-800' };
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [professores, setProfessores] = useState<ProfessorCadastrado[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [tentativaLista, setTentativaLista] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroUep, setFiltroUep] = useState<'todas' | UepType>('todas');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [operacao, setOperacao] = useState<Operacao | null>(null);

  // Estado do Modal (Criar / Editar)
  const [modalAberto, setModalAberto] = useState(false);
  const [professorEditando, setProfessorEditando] =
    useState<ProfessorCadastrado | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [uepInput, setUepInput] = useState<UepType>('olericultura');
  const [erroModal, setErroModal] = useState<string | null>(null);

  const carregandoLista = professores === null && erroLista === null;
  const salvando = operacao?.tipo === 'salvar';
  const acoesBloqueadas = operacao !== null || modalAberto;

  useEffect(() => {
    let montagemAtiva = true;
    adminService.listarProfessores().then(
      (lista) => {
        if (montagemAtiva) setProfessores(lista);
      },
      (erro: unknown) => {
        if (montagemAtiva) {
          setErroLista(erro instanceof Error ? erro.message : 'Erro ao carregar professores.');
        }
      }
    );
    return () => {
      montagemAtiva = false;
    };
  }, [tentativaLista]);

  useEffect(() => {
    if (feedback?.tipo !== 'sucesso') return;
    const timer = setTimeout(() => {
      setFeedback((atual) => (atual === feedback ? null : atual));
    }, 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const tentarCarregarLista = () => {
    setErroLista(null);
    setTentativaLista((atual) => atual + 1);
  };

  const atualizarNaLista = (professor: ProfessorCadastrado) => {
    setProfessores((lista) => [
      ...(lista ?? []).filter((item) => item.id !== professor.id),
      professor,
    ]);
  };

  const mostrarResultado = (resultado: ResultadoAlteracaoProfessor, texto: string) => {
    atualizarNaLista(resultado.professor);
    if (resultado.emailEnviado === false) {
      setFeedback({
        tipo: 'aviso',
        texto: resultado.message ?? 'Os dados foram salvos, mas o e-mail não pôde ser enviado.',
      });
      return;
    }
    if (resultado.emailEnviado === true) {
      texto += resultado.professor.convitePendente
        ? ' Convite enviado. O acesso depende do aceite do professor.'
        : ' E-mail de confirmação enviado. O acesso depende da confirmação do novo endereço.';
    }
    setFeedback({ tipo: 'sucesso', texto });
  };

  const abrirModalNovo = () => {
    setProfessorEditando(null);
    setNomeInput('');
    setEmailInput('');
    setUepInput('olericultura');
    setErroModal(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (prof: ProfessorCadastrado) => {
    setProfessorEditando(prof);
    setNomeInput(prof.nome);
    setEmailInput(prof.email);
    setUepInput(prof.uep);
    setErroModal(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProfessorEditando(null);
    setErroModal(null);
  };

  const handleSalvarProfessor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (operacao) return;
    setErroModal(null);

    const nomeLimpo = nomeInput.trim();
    const emailLimpo = emailInput.trim().toLowerCase();

    if (!nomeLimpo || !emailLimpo) {
      setErroModal('Por favor, preencha o nome e o e-mail institucional.');
      return;
    }

    if (!isEmailInstitucionalDocente(emailLimpo)) {
      setErroModal(
        'O professor deve ser cadastrado exclusivamente com e-mail institucional (@belojardim.ifpe.edu.br ou @ifpe.edu.br).'
      );
      return;
    }

    setOperacao({ tipo: 'salvar' });
    setFeedback(null);
    try {
      const dados = { nome: nomeLimpo, email: emailLimpo, uep: uepInput };
      const resultado = professorEditando
        ? await adminService.atualizarProfessor(professorEditando.id, dados)
        : await adminService.criarProfessor(dados);
      const { nome, uep } = resultado.professor;
      const nomeUep = uep === 'olericultura' ? 'Olericultura' : 'Fruticultura';
      mostrarResultado(
        resultado,
        professorEditando
          ? `Vínculo de ${nome} atualizado para a UEP ${nomeUep}.`
          : `${nome} foi vinculado à UEP ${nomeUep}.`
      );

      fecharModal();
    } catch (err: unknown) {
      setErroModal(
        err instanceof Error ? err.message : 'Erro ao salvar professor.'
      );
    } finally {
      setOperacao(null);
    }
  };

  const handleTrocarUepRapido = async (prof: ProfessorCadastrado, novaUep: UepType) => {
    if (acoesBloqueadas || prof.uep === novaUep) return;
    setOperacao({ tipo: 'uep', professorId: prof.id });
    setFeedback(null);
    try {
      const atualizado = await adminService.alterarUep(prof.id, novaUep);
      atualizarNaLista(atualizado);
      const nomeUep = atualizado.uep === 'olericultura' ? 'Olericultura' : 'Fruticultura';
      setFeedback({
        tipo: 'sucesso',
        texto: `UEP de ${atualizado.nome} alterada para ${nomeUep}.`,
      });
    } catch (err: unknown) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao alterar UEP.',
      });
    } finally {
      setOperacao(null);
    }
  };

  const handleReenviarConvite = async (prof: ProfessorCadastrado) => {
    if (acoesBloqueadas) return;
    setOperacao({ tipo: 'convite', professorId: prof.id });
    setFeedback(null);
    try {
      const resultado = await adminService.reenviarConvite(prof.id);
      mostrarResultado(resultado, `Convite de ${resultado.professor.nome} renovado.`);
    } catch (err: unknown) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao reenviar convite.',
      });
    } finally {
      setOperacao(null);
    }
  };

  const handleAlterarStatus = async (prof: ProfessorCadastrado) => {
    if (acoesBloqueadas) return;
    if (
      prof.ativo &&
      !window.confirm(
        `Desativar a conta de ${prof.nome}? A desativação remove o acesso ao sistema e preserva os dados e o histórico.`
      )
    ) {
      return;
    }

    setOperacao({ tipo: 'status', professorId: prof.id });
    setFeedback(null);
    try {
      const atualizado = await adminService.alterarStatus(prof.id, !prof.ativo);
      atualizarNaLista(atualizado);
      setFeedback({
        tipo: 'sucesso',
        texto: atualizado.ativo
          ? `Conta de ${atualizado.nome} reativada.`
          : `Conta de ${atualizado.nome} desativada. Os dados e o histórico foram preservados.`,
      });
    } catch (err: unknown) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao alterar o status da conta.',
      });
    } finally {
      setOperacao(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const professoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (professores ?? [])
      .filter((prof) => {
        const correspondeUep = filtroUep === 'todas' || prof.uep === filtroUep;
        const correspondeBusca =
          !termo ||
          prof.nome.toLowerCase().includes(termo) ||
          prof.email.toLowerCase().includes(termo);
        return correspondeUep && correspondeBusca;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [professores, filtroUep, busca]);

  const totalOlericultura = useMemo(
    () => professores?.filter((p) => p.uep === 'olericultura').length ?? '—',
    [professores]
  );
  const totalFruticultura = useMemo(
    () => professores?.filter((p) => p.uep === 'fruticultura').length ?? '—',
    [professores]
  );

  return (
    <div className="min-h-screen bg-[#f4f1e7] text-slate-800">
      {/* Cabeçalho Institucional do Admin */}
      <header className="border-b border-emerald-950/10 bg-gradient-to-r from-[#174b32] via-[#22633b] to-[#3b6e3c] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#d7e6b7]">
              <ShieldCheck className="h-4 w-4" />
              <span>Painel do Administrador &bull; {APP_CONFIG.institution}</span>
            </div>
            <h1
              style={{ fontFamily: "'Libra Serif Modern', serif" }}
              className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              Gestão de Professores e UEPs
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="header-light"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sair ({user?.nome?.split(' ')[0] || 'Admin'})
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Cards de Indicadores (KPIs) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total de Professores
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {professores?.length ?? '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Docentes vinculados às UEPs
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#27633b]/10 text-[#27633b]">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                UEP Olericultura
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {totalOlericultura}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Canteiros, ciclos e colheita
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sprout className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-amber-200/70 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                UEP Fruticultura
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {totalFruticultura}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Pomar experimental e safra
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Apple className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* Mensagem de Feedback */}
        {feedback && (
          <div
            role={feedback.tipo === 'sucesso' ? 'status' : 'alert'}
            className={`mt-6 flex items-center justify-between rounded-2xl border p-4 text-sm font-medium shadow-xs ${
              estilosFeedback[feedback.tipo]
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{feedback.texto}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFeedback(null)}
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Barra de Ferramentas: Busca, Filtro de UEP e Botão de Novo Cadastro */}
        <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar professor por nome ou e-mail..."
                aria-label="Buscar professor"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFiltroUep('todas')}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  filtroUep === 'todas'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({professores?.length ?? '—'})
              </button>
              <button
                type="button"
                onClick={() => setFiltroUep('olericultura')}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  filtroUep === 'olericultura'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Olericultura ({totalOlericultura})
              </button>
              <button
                type="button"
                onClick={() => setFiltroUep('fruticultura')}
                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                  filtroUep === 'fruticultura'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fruticultura ({totalFruticultura})
              </button>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={abrirModalNovo}
            disabled={professores === null || acoesBloqueadas}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Cadastrar Professor
          </Button>
        </section>

        {/* Lista de Professores */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
          {carregandoLista ? (
            <p role="status" className="p-12 text-center text-sm text-slate-600">
              Carregando professores...
            </p>
          ) : erroLista !== null ? (
            <div className="p-8 text-center">
              <div role="alert">
                <p className="font-semibold text-red-900">Não foi possível carregar os professores.</p>
                <p className="mt-1 text-sm text-red-800">{erroLista}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={tentarCarregarLista}>
                Tentar novamente
              </Button>
            </div>
          ) : professoresFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-slate-400">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">
                Nenhum professor encontrado
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Cadastre um novo professor com seu e-mail institucional e escolha sua UEP de atuação.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {professoresFiltrados.map((prof) => {
                const isFruticultura = prof.uep === 'fruticultura';
                const status = obterStatusProfessor(prof);
                const operacaoNaLinha =
                  operacao?.tipo !== 'salvar' && operacao?.professorId === prof.id
                    ? operacao.tipo
                    : null;
                return (
                  <div
                    key={prof.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-stone-50/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold ${
                          isFruticultura
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        }`}
                      >
                        {isFruticultura ? (
                          <Apple className="h-6 w-6 text-amber-600" />
                        ) : (
                          <Sprout className="h-6 w-6 text-emerald-600" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {prof.nome}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isFruticultura
                                ? 'bg-amber-100/80 text-amber-800'
                                : 'bg-emerald-100/80 text-emerald-800'
                            }`}
                          >
                            {isFruticultura ? 'Fruticultura' : 'Olericultura'}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status.estilo}`}>
                            {status.rotulo}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{prof.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Seletor rápido de UEP */}
                      <select
                        aria-label={`UEP de ${prof.nome}`}
                        value={prof.uep}
                        disabled={acoesBloqueadas}
                        onChange={(e) =>
                          handleTrocarUepRapido(
                            prof,
                            e.target.value as UepType
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#27633b] focus:outline-hidden cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="olericultura">UEP: Olericultura</option>
                        <option value="fruticultura">UEP: Fruticultura</option>
                      </select>
                      {operacaoNaLinha === 'uep' && (
                        <span role="status" className="text-xs text-slate-600">Alterando UEP...</span>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => abrirModalEdicao(prof)}
                        disabled={acoesBloqueadas}
                        leftIcon={<Pencil className="h-3.5 w-3.5 text-slate-500" />}
                      >
                        Editar
                      </Button>

                      {prof.convitePendente ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReenviarConvite(prof)}
                          disabled={acoesBloqueadas}
                          isLoading={operacaoNaLinha === 'convite'}
                          aria-label={`Reenviar convite de ${prof.nome}`}
                          leftIcon={<Send className="h-3.5 w-3.5" />}
                        >
                          Reenviar convite
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant={prof.ativo ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleAlterarStatus(prof)}
                          disabled={acoesBloqueadas}
                          isLoading={operacaoNaLinha === 'status'}
                          aria-label={`${prof.ativo ? 'Desativar' : 'Reativar'} ${prof.nome}`}
                          leftIcon={prof.ativo
                            ? <UserX className="h-3.5 w-3.5" />
                            : <UserCheck className="h-3.5 w-3.5" />}
                        >
                          {prof.ativo ? 'Desativar' : 'Reativar'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Cadastro / Edição de Professor (Apenas Nome, E-mail Institucional e UEP) */}
      {modalAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-professor-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#27633b]">
                  {professorEditando ? 'Atualizar Vínculo' : 'Novo Docente'}
                </span>
                <h2
                  id="modal-professor-titulo"
                  className="mt-0.5 text-2xl font-extrabold text-slate-900"
                >
                  {professorEditando
                    ? 'Editar Professor'
                    : 'Cadastrar Professor na UEP'}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {erroModal && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleSalvarProfessor} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="prof-nome"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Nome completo do professor
                </label>
                <input
                  id="prof-nome"
                  type="text"
                  value={nomeInput}
                  disabled={salvando}
                  onChange={(e) => setNomeInput(e.target.value)}
                  placeholder="Ex: Prof. Roberto Almeida"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="prof-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  E-mail institucional docente
                </label>
                <input
                  id="prof-email"
                  type="email"
                  value={emailInput}
                  disabled={salvando}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="professor@belojardim.ifpe.edu.br"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Seleção Visual de UEP */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Unidade de Ensino e Produção (UEP)
                </span>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setUepInput('olericultura')}
                    disabled={salvando}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                      uepInput === 'olericultura'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Olericultura
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Canteiros e hortaliças
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUepInput('fruticultura')}
                    disabled={salvando}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                      uepInput === 'fruticultura'
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Apple className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Fruticultura
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Pomar e frutíferas
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={salvando}>
                  {professorEditando
                    ? 'Salvar Alterações'
                    : 'Vincular Professor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
