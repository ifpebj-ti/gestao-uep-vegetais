import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sprout,
  Apple,
  UserPlus,
  Search,
  Pencil,
  Trash2,
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
  ProfessorCadastrado,
} from '../../../services/adminService';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [professores, setProfessores] = useState<ProfessorCadastrado[]>(() =>
    adminService.listarProfessores()
  );
  const [busca, setBusca] = useState('');
  const [filtroUep, setFiltroUep] = useState<'todas' | UepType>('todas');
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  // Estado do Modal (Criar / Editar)
  const [modalAberto, setModalAberto] = useState(false);
  const [professorEditando, setProfessorEditando] =
    useState<ProfessorCadastrado | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [uepInput, setUepInput] = useState<UepType>('olericultura');
  const [erroModal, setErroModal] = useState<string | null>(null);

  const recarregarLista = () => {
    setProfessores(adminService.listarProfessores());
  };

  const mostrarFeedback = (tipo: 'sucesso' | 'erro', texto: string) => {
    setFeedback({ tipo, texto });
    setTimeout(() => {
      setFeedback((atual) => (atual?.texto === texto ? null : atual));
    }, 4000);
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

  const handleSalvarProfessor = (event: React.FormEvent) => {
    event.preventDefault();
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

    try {
      if (professorEditando) {
        adminService.atualizarProfessor(professorEditando.id, {
          nome: nomeLimpo,
          email: emailLimpo,
          uep: uepInput,
        });
        mostrarFeedback(
          'sucesso',
          `Vínculo de ${nomeLimpo} atualizado para a UEP ${uepInput === 'olericultura' ? 'Olericultura' : 'Fruticultura'}.`
        );
      } else {
        adminService.criarProfessor({
          nome: nomeLimpo,
          email: emailLimpo,
          uep: uepInput,
        });
        mostrarFeedback(
          'sucesso',
          `Professor(a) ${nomeLimpo} vinculado(a) com sucesso à UEP ${uepInput === 'olericultura' ? 'Olericultura' : 'Fruticultura'}!`
        );
      }

      recarregarLista();
      fecharModal();
    } catch (err: unknown) {
      setErroModal(
        err instanceof Error ? err.message : 'Erro ao salvar professor.'
      );
    }
  };

  const handleTrocarUepRapido = (prof: ProfessorCadastrado, novaUep: UepType) => {
    if (prof.uep === novaUep) return;
    try {
      adminService.atualizarProfessor(prof.id, {
        nome: prof.nome,
        email: prof.email,
        uep: novaUep,
      });
      recarregarLista();
      mostrarFeedback(
        'sucesso',
        `UEP de ${prof.nome} alterada para ${novaUep === 'olericultura' ? 'Olericultura' : 'Fruticultura'}.`
      );
    } catch (err: unknown) {
      mostrarFeedback(
        'erro',
        err instanceof Error ? err.message : 'Erro ao alterar UEP.'
      );
    }
  };

  const handleRemoverProfessor = (prof: ProfessorCadastrado) => {
    adminService.removerProfessor(prof.id);
    recarregarLista();
    mostrarFeedback('sucesso', `Professor(a) ${prof.nome} removido(a) da lista.`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const professoresFiltrados = useMemo(() => {
    return professores.filter((prof) => {
      const correspondeUep =
        filtroUep === 'todas' || prof.uep === filtroUep;
      const termo = busca.trim().toLowerCase();
      const correspondeBusca =
        !termo ||
        prof.nome.toLowerCase().includes(termo) ||
        prof.email.toLowerCase().includes(termo);
      return correspondeUep && correspondeBusca;
    });
  }, [professores, filtroUep, busca]);

  const totalOlericultura = useMemo(
    () => professores.filter((p) => p.uep === 'olericultura').length,
    [professores]
  );
  const totalFruticultura = useMemo(
    () => professores.filter((p) => p.uep === 'fruticultura').length,
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
                {professores.length}
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
            role="status"
            className={`mt-6 flex items-center justify-between rounded-2xl border p-4 text-sm font-medium shadow-xs ${
              feedback.tipo === 'sucesso'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
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
                Todas ({professores.length})
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
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Cadastrar Professor
          </Button>
        </section>

        {/* Lista de Professores */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
          {professoresFiltrados.length === 0 ? (
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
                        onChange={(e) =>
                          handleTrocarUepRapido(
                            prof,
                            e.target.value as UepType
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#27633b] focus:outline-hidden cursor-pointer"
                      >
                        <option value="olericultura">UEP: Olericultura</option>
                        <option value="fruticultura">UEP: Fruticultura</option>
                      </select>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => abrirModalEdicao(prof)}
                        leftIcon={<Pencil className="h-3.5 w-3.5 text-slate-500" />}
                      >
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoverProfessor(prof)}
                        aria-label={`Remover ${prof.nome}`}
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      >
                        Remover
                      </Button>
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
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
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
