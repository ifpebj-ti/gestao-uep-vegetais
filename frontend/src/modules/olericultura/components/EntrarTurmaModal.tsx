import React, { useState } from 'react';
import { KeyRound, GraduationCap, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Turma, turmaService } from '../../../services/turmaService';

interface EntrarTurmaModalProps {
  alunoEmail: string;
  isOpen: boolean;
  onSuccess: (turma: Turma) => void;
  onClose?: () => void;
}

export const EntrarTurmaModal: React.FC<EntrarTurmaModalProps> = ({
  alunoEmail,
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [codigoInput, setCodigoInput] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [turmaEncontrada, setTurmaEncontrada] = useState<Turma | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const limpo = codigoInput.trim().toUpperCase();
    if (!limpo) {
      setErro('Por favor, digite o código da turma fornecido pelo professor.');
      return;
    }

    setCarregando(true);
    try {
      const turma = turmaService.vincularAlunoPorCodigo(alunoEmail, limpo);
      setTurmaEncontrada(turma);
      setTimeout(() => {
        onSuccess(turma);
      }, 700);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Falha ao vincular com a turma.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8efdf] text-[#27633b] ring-8 ring-[#e8efdf]/40">
          <GraduationCap className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#27633b]">
            Acesso do Estudante
          </span>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
            Digite o Código da Turma
          </h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Informe o código fornecido pelo professor no quadro da sala de aula (Ex: <strong>AGRO-459</strong>) para vincular seus canteiros práticos.
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{erro}</span>
          </div>
        )}

        {turmaEncontrada && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Turma {turmaEncontrada.nome} vinculada com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="codigo-turma-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Código da Turma
            </label>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="codigo-turma-input"
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                placeholder="Ex: AGRO-459"
                className="w-full uppercase font-mono tracking-wider rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-center text-base font-bold text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:border-[#27633b] focus:bg-white focus:outline-hidden"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 text-center">
              Dica: para demonstração use o código <strong>AGRO-459</strong> (Olericultura) ou <strong>FRUT-102</strong> (Fruticultura).
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={carregando}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Entrar na Turma
            </Button>

            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onClose}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

