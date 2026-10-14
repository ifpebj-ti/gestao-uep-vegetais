import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from './Button';

interface UnauthorizedAccessProps {
  userRole?: string;
  onGoBack?: () => void;
}

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  userRole,
  onGoBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1e7] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-red-950/5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-red-600">
          Erro 403 &bull; Acesso Restrito
        </span>

        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
          Permissão Insuficiente
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Seu perfil institucional{' '}
          {userRole ? (
            <strong className="rounded-md bg-stone-100 px-1.5 py-0.5 text-slate-800">
              {userRole}
            </strong>
          ) : (
            'atual'
          )}{' '}
          não tem permissão para acessar esta área restrita.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={handleBack}
            className="w-full justify-center gap-2 rounded-xl bg-[#27633b] py-3 text-sm font-bold text-white hover:bg-[#174b32]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página anterior
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Home className="h-4 w-4" />
            Ir para a seleção de UEP
          </Button>
        </div>
      </div>
    </main>
  );
};
