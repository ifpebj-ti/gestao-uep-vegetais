import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Copy,
  CheckCircle2,
  Calendar,
  Sprout,
  Apple,
  X,
  AlertCircle,
  KeyRound,
  Trash2,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { Button } from '../../../../components/Button';
import { TerrariumMenu } from '../../components/TerrariumMenu';
import { APP_CONFIG } from '../../../../config/constants';
import { Turma, turmaService } from '../../../../services/turmaService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUep } from '../../../../contexts/UepContext';
import { CANTEIROS_DATA } from '../../data/horticulturaData';

export const TurmasProfessorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedUep } = useUep();

  const professorEmail = user?.email || 'george@belojardim.ifpe.edu.br';
  const professorNome = user?.nome || 'Prof. George Henrique';

  const [turmas, setTurmas] = useState<Turma[]>(() =>
    turmaService.listarTurmasPorProfessor(professorEmail)
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalNovaTurma, setModalNovaTurma] = useState(false);
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<Turma | null>(null);
  const [nomeTurma, setNomeTurma] = useState('');
  const [canteirosSelecionados, setCanteirosSelecionados] = useState<string[]>(['c-01', 'c-02', 'c-18']);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleExcluirTurma = (id: string) => {
    turmaService.excluirTurma(id);
    setTurmas(turmaService.listarTurmasPorProfessor(professorEmail));
    setTurmaParaExcluir(null);
  };

  const handleCopiarCodigo = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleToggleCanteiro = (canteiroId: string) => {
    setCanteirosSelecionados((prev) =>
      prev.includes(canteiroId) ? prev.filter((id) => id !== canteiroId) : [...prev, canteiroId]
    );
  };

  const handleCriarTurma = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const nome = nomeTurma.trim();
    if (!nome) {
      setErro('Por favor, informe o nome ou disciplina da turma.');
      return;
    }

    try {
      const nova = turmaService.criarTurma({
        nome,
        professorEmail,
        professorNome,
        uep: selectedUep || 'olericultura',
        canteirosIds: canteirosSelecionados.length > 0 ? canteirosSelecionados : ['c-01', 'c-02'],
      });

      setTurmas(turmaService.listarTurmasPorProfessor(professorEmail));
      setNomeTurma('');
      setCanteirosSelecionados(['c-01', 'c-02', 'c-18']);
      setModalNovaTurma(false);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao cadastrar turma.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1e7] text-slate-800 font-sans">
      {/* Topo / Header de Navegação */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-emerald-950/10 bg-white/90 px-4 backdrop-blur-md sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu do sistema"
            className="group flex h-10 items-center gap-2 rounded-2xl bg-[#27633b] px-3.5 text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-4 w-4 transition group-hover:rotate-6" />
            <span className="text-xs font-bold tracking-wider uppercase">Menu</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-lg">
                Minhas Turmas & Códigos de Acesso
              </h1>
              <span className="rounded-full bg-[#27633b]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#27633b]">
                Docente
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {professorNome} &bull; Gestão de discentes e liberação de canteiros
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 rounded-2xl border border-emerald-900/10 bg-white/90 px-3.5 py-1.5 shadow-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#27633b] to-[#4ade80] text-white shadow-xs">
            <Sprout className="h-3.5 w-3.5" />
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#27633b] leading-tight font-brand block">
              {APP_CONFIG.name}
            </span>
            <span className="text-[9px] font-semibold text-emerald-900/70 tracking-wide uppercase block">
              UEP Olericultura &bull; IFPE
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Card Informativo com Orientação para a Sala de Aula */}
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#27633b] text-white shadow-md">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#174b32]">
                  Como funciona o acesso dos alunos aos canteiros?
                </h2>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Ao cadastrar uma turma, o Terrarium gera um <strong>Código Curto</strong> (ex: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-900 font-bold">AGRO-459</code>).
                  Basta escrever este código no quadro da sala. Quando o discente logar com o e-mail institucional e digitar o código, ele terá acesso automático aos canteiros vinculados para registrar suas atividades de campo.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalNovaTurma(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Nova Turma
            </Button>
          </div>
        </div>

        {/* Listagem de Turmas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#27633b]" />
              <h2 className="text-lg font-bold text-slate-900">
                Turmas Ativas ({turmas.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Copie o código e envie para os alunos da disciplina
            </span>
          </div>

          {turmas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-700">
                Nenhuma turma cadastrada no momento
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                Crie sua primeira turma para gerar códigos de acesso aos alunos e designar canteiros práticos da horta.
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setModalNovaTurma(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Criar Turma Agora
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {turmas.map((turma) => {
                const totalAlunos = turmaService.listarAlunosDaTurma(turma.id).length;

                return (
                  <div
                    key={turma.id}
                    className="flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:shadow-md transition"
                  >
                    <div>
                      {/* Topo do Card: Nome, Tag de UEP e Botão Excluir */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => navigate(`/olericultura/professor/turmas/${turma.id}`)}
                          className="cursor-pointer group flex-1"
                        >
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {turma.uep === 'olericultura' ? 'Horta / Olericultura' : 'Pomar / Fruticultura'}
                          </span>
                          <h3 className="mt-2 text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#27633b] transition">
                            {turma.nome}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => setTurmaParaExcluir(turma)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                          title="Excluir Turma"
                          aria-label={`Excluir turma ${turma.nome}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Destaque do Código de Acesso */}
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-3.5">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Código de Acesso dos Alunos
                          </span>
                          <span className="text-xl font-extrabold font-mono tracking-wider text-[#27633b]">
                            {turma.codigo}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant={copiadoId === turma.id ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleCopiarCodigo(turma.codigo, turma.id)}
                          leftIcon={
                            copiadoId === turma.id ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )
                          }
                        >
                          {copiadoId === turma.id ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>

                      {/* Canteiros vinculados */}
                      <div className="mt-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Canteiros Práticos Designados:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {turma.canteirosIds.map((cid) => (
                            <span
                              key={cid}
                              className="rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-bold text-slate-700"
                            >
                              {cid.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ações e Rodapé do Card */}
                    <div className="mt-5 space-y-3 pt-3 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/olericultura/professor/turmas/${turma.id}`)}
                        leftIcon={<Users className="h-4 w-4" />}
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Ver Alunos ({totalAlunos})
                      </Button>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Criada em {new Date(turma.criadaEm).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span className="font-semibold text-emerald-700">Ativa para matrícula</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Criar Nova Turma */}
      {modalNovaTurma && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#27633b]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Cadastrar Nova Turma
                  </h3>
                  <p className="text-xs text-slate-400">
                    Um código curto será gerado automaticamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNovaTurma(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {erro && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleCriarTurma} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nome da Turma / Disciplina
                </label>
                <input
                  type="text"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  placeholder="Ex: Agronomia 2026.1 - Olericultura Geral"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Canteiros Designados para a Prática dos Alunos
                </label>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Selecione os canteiros que os alunos dessa turma irão gerenciar:
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {CANTEIROS_DATA.slice(0, 12).map((c) => {
                    const isSelected = canteirosSelecionados.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleCanteiro(c.id)}
                        className={`flex items-center justify-between rounded-lg p-2 text-xs font-bold transition border cursor-pointer ${
                          isSelected
                            ? 'border-[#27633b] bg-[#27633b] text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{c.codigo}</span>
                        <span className="text-[10px] opacity-80">{c.cultura.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalNovaTurma(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar e Gerar Código
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Confirmar Exclusão da Turma */}
      {turmaParaExcluir && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900">Excluir Turma?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Tem certeza de que deseja excluir a turma <strong>{turmaParaExcluir.nome}</strong> (Código:{' '}
              {turmaParaExcluir.codigo})? Os alunos vinculados perderão o acesso aos canteiros desta turma.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setTurmaParaExcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                fullWidth
                onClick={() => handleExcluirTurma(turmaParaExcluir.id)}
              >
                Sim, Excluir Turma
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Geral do Sistema (Slide-Over Drawer) */}
      <TerrariumMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

