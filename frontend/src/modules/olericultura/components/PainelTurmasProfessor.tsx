import React, { useState, useContext } from 'react';
import {
  Users,
  Plus,
  Copy,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { Turma, turmaService } from '../../../services/turmaService';
import { useAuth } from '../../../contexts/AuthContext';
import { UepContext } from '../../../contexts/UepContext';

interface PainelTurmasProfessorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PainelTurmasProfessor: React.FC<PainelTurmasProfessorProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const uepCtx = useContext(UepContext);
  const selectedUep = uepCtx?.selectedUep || 'olericultura';

  const professorEmail = user?.email || 'george@belojardim.ifpe.edu.br';
  const professorNome = user?.nome || 'Prof. George Henrique';

  const [turmas, setTurmas] = useState<Turma[]>(() =>
    turmaService.listarTurmasPorProfessor(professorEmail)
  );

  const [modalNovaTurma, setModalNovaTurma] = useState(false);
  const [nomeTurma, setNomeTurma] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopiarCodigo = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleCriarTurma = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const nome = nomeTurma.trim();
    if (!nome) {
      setErro('Digite o nome da disciplina/turma.');
      return;
    }

    try {
      turmaService.criarTurma({
        nome,
        professorEmail,
        professorNome,
        uep: selectedUep || 'olericultura',
      });
      setTurmas(turmaService.listarTurmasPorProfessor(professorEmail));
      setNomeTurma('');
      setModalNovaTurma(false);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao criar turma.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#27633b]">
                Gestão Pedagógica
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Minhas Turmas & Códigos de Acesso
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 text-xs text-slate-500 shrink-0">
          Passe o <strong>Código Curto</strong> no quadro da sala de aula. Ao digitar o código, os alunos entram direto na sua UEP e têm seus canteiros liberados!
        </div>

        {/* Lista de Turmas Criadas */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {turmas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-xs text-slate-400">
              Você ainda não tem turmas cadastradas. Clique no botão abaixo para gerar seu primeiro código!
            </div>
          ) : (
            turmas.map((turma) => (
              <div
                key={turma.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-stone-200/90 bg-stone-50/70 p-4 transition hover:bg-white hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {turma.nome}
                    </span>
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      {turma.uep}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Criada em {new Date(turma.criadaEm).toLocaleDateString('pt-BR')} &bull;{' '}
                    {turma.canteirosIds.length} canteiros atribuídos
                  </p>
                </div>

                {/* Código em Destaque com botão de Copiar */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 font-mono text-base font-extrabold text-[#174b32]">
                    <span>{turma.codigo}</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopiarCodigo(turma.codigo, turma.id)}
                    leftIcon={
                      copiadoId === turma.id ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-500" />
                      )
                    }
                  >
                    {copiadoId === turma.id ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Botão Criar Turma */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Fechar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setModalNovaTurma(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Criar Nova Turma
          </Button>
        </div>
      </div>

      {/* Submodal: Formulário de Nova Turma */}
      {modalNovaTurma && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <h3 className="text-lg font-bold text-slate-900">
              Criar Nova Turma
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              O sistema irá gerar um código curto aleatório exclusivo para esta turma.
            </p>

            {erro && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleCriarTurma} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Nome da Turma / Disciplina
                </label>
                <input
                  type="text"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  placeholder="Ex: Olericultura Geral 2026.1"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
    </div>
  );
};

