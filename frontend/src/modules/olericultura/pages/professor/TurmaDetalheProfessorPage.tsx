import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Copy,
  CheckCircle2,
  Trash2,
  Calendar,
  Sprout,
  ArrowLeft,
  Search,
  AlertCircle,
  X,
  UserX,
  Clock,
} from 'lucide-react';
import { BackButton } from '../../../../components/BackButton';
import { Button } from '../../../../components/Button';
import { turmaService, Turma, AlunoTurmaResumo } from '../../../../services/turmaService';
import { useAuth } from '../../../../contexts/AuthContext';

export const TurmaDetalheProfessorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [turma, setTurma] = useState<Turma | null>(() => (id ? turmaService.buscarTurmaPorId(id) : null));
  const [alunos, setAlunos] = useState<AlunoTurmaResumo[]>(() =>
    id ? turmaService.listarAlunosDaTurma(id) : []
  );

  const [busca, setBusca] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [modalExcluirTurma, setModalExcluirTurma] = useState(false);
  const [alunoParaDesvincular, setAlunoParaDesvincular] = useState<AlunoTurmaResumo | null>(null);

  const recarregar = () => {
    if (!id) return;
    setTurma(turmaService.buscarTurmaPorId(id));
    setAlunos(turmaService.listarAlunosDaTurma(id));
  };

  const handleCopiarCodigo = () => {
    if (!turma) return;
    navigator.clipboard.writeText(turma.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleExcluirTurma = () => {
    if (!turma) return;
    turmaService.excluirTurma(turma.id);
    navigate('/olericultura/professor/turmas', { replace: true });
  };

  const handleDesvincularAluno = () => {
    if (!alunoParaDesvincular) return;
    turmaService.desvincularAlunoDaTurma(alunoParaDesvincular.email);
    setAlunoParaDesvincular(null);
    recarregar();
  };

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter(
      (a) => a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo)
    );
  }, [alunos, busca]);

  if (!turma) {
    return (
      <div className="min-h-screen bg-[#f4f1e7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">Turma não encontrada</h2>
          <p className="mt-2 text-xs text-slate-500">
            A turma solicitada não existe ou foi removida recentemente.
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/olericultura/professor/turmas')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar para Minhas Turmas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1e7] text-slate-800 font-sans">
      {/* Header Superior */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-emerald-950/10 bg-white/90 px-4 backdrop-blur-md sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <BackButton to="/olericultura/professor/turmas" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-lg">{turma.nome}</h1>
              <span className="rounded-full bg-[#27633b]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#27633b]">
                {turma.uep === 'olericultura' ? 'Horta / Olericultura' : 'Pomar / Fruticultura'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gestão de Discentes &bull; Código: <strong>{turma.codigo}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setModalExcluirTurma(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Excluir Turma
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Painel Resumo da Turma */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card do Código de Acesso */}
          <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Código de Acesso dos Alunos
              </span>
              <p className="mt-2 text-3xl font-extrabold font-mono tracking-wider text-[#27633b]">
                {turma.codigo}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Passe este código para os alunos entrarem nos canteiros da turma.
              </p>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant={copiado ? 'primary' : 'outline'}
                size="sm"
                fullWidth
                onClick={handleCopiarCodigo}
                leftIcon={copiado ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copiado ? 'Código Copiado!' : 'Copiar Código'}
              </Button>
            </div>
          </div>

          {/* Card Total de Alunos */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Alunos Matriculados
              </span>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{alunos.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                Discentes com acesso liberado aos canteiros práticos.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <Users className="h-4 w-4" />
              <span>Turma ativa no semestre</span>
            </div>
          </div>

          {/* Card Canteiros Designados */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Canteiros Designados
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {turma.canteirosIds.map((cid) => (
                  <span
                    key={cid}
                    className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-[#27633b]"
                  >
                    {cid.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>Criada em {new Date(turma.criadaEm).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Seção: Lista de Alunos da Turma */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#27633b]" />
              <h2 className="text-lg font-bold text-slate-900">
                Alunos da Turma ({alunos.length})
              </h2>
            </div>

            {/* Barra de Busca de Alunos */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#27633b] focus:outline-hidden"
              />
            </div>
          </div>

          {alunos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-700">
                Nenhum aluno entrou nesta turma ainda
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                Escreva o código <strong>{turma.codigo}</strong> no quadro para os alunos. Assim que eles logarem e digitarem o código, aparecerão automaticamente nesta lista.
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCopiarCodigo}
                  leftIcon={<Copy className="h-4 w-4" />}
                >
                  {copiado ? 'Código Copiado!' : 'Copiar Código da Turma'}
                </Button>
              </div>
            </div>
          ) : alunosFiltrados.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              Nenhum aluno encontrado para o filtro "{busca}".
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200/90 bg-white overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {alunosFiltrados.map((aluno) => (
                  <div
                    key={aluno.email}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:px-6 hover:bg-slate-50/70 transition gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-900 font-bold text-sm">
                        {aluno.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{aluno.nome}</h4>
                        <p className="text-xs text-slate-400">{aluno.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAlunoParaDesvincular(aluno)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Remover discente da turma"
                        aria-label={`Remover discente ${aluno.nome} da turma`}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Confirmar Exclusão da Turma */}
      {modalExcluirTurma && (
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
              Tem certeza de que deseja excluir a turma <strong>{turma.nome}</strong> (Código:{' '}
              {turma.codigo})? Os alunos vinculados perderão o acesso aos canteiros desta turma.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setModalExcluirTurma(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                fullWidth
                onClick={handleExcluirTurma}
              >
                Sim, Excluir Turma
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Desvinculação do Aluno */}
      {alunoParaDesvincular && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <UserX className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900">Remover Aluno da Turma?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Deseja remover o vínculo de <strong>{alunoParaDesvincular.nome}</strong> ({alunoParaDesvincular.email}) desta turma? O aluno precisará digitar o código novamente para reingressar.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setAlunoParaDesvincular(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                fullWidth
                onClick={handleDesvincularAluno}
              >
                Confirmar Remoção
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

