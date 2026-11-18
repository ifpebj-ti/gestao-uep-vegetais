import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { ApiError } from '../../../services/apiClient';
import { invitationService } from '../../../services/invitationService';
import { AuthLayout } from '../components/AuthLayout';

type Status = 'form' | 'loading' | 'success' | 'error';

export const AcceptInvitationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get('token')?.trim() ?? '');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [status, setStatus] = useState<Status>(token ? 'form' : 'error');
  const [mensagem, setMensagem] = useState(
    token ? '' : 'O link de convite está incompleto. Solicite um novo convite ao administrador.'
  );

  useEffect(() => {
    if (token) {
      // O token permanece somente em memória após ser lido do link.
      navigate('/aceitar-convite', { replace: true });
    }
  }, [navigate, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem('');

    if (!token) {
      setStatus('error');
      setMensagem('O link de convite está incompleto. Solicite um novo convite ao administrador.');
      return;
    }
    if (senha.length < 6 || senha.length > 72) {
      setMensagem('A senha deve ter entre 6 e 72 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setMensagem('As senhas não coincidem. Confira os dois campos e tente novamente.');
      return;
    }

    setStatus('loading');
    try {
      const response = await invitationService.acceptProfessorInvitation(token, senha);
      setStatus('success');
      setMensagem(response.message || 'Senha definida. Agora você pode entrar na sua conta.');
      setSenha('');
      setConfirmarSenha('');
    } catch (error) {
      setStatus('form');
      if (error instanceof ApiError && [400, 404, 409, 410, 422].includes(error.status)) {
        setMensagem('Este convite é inválido, expirou ou já foi utilizado. Peça ao administrador para enviar um novo.');
      } else {
        setMensagem(
          error instanceof Error
            ? error.message
            : 'Não foi possível aceitar o convite. Tente novamente.'
        );
      }
    }
  }

  return (
    <AuthLayout>
      {status === 'success' ? (
        <section className="text-center" role="status">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#658342]">Convite aceito</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">Sua senha está definida</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{mensagem}</p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            className="mt-8"
            onClick={() => navigate('/login', { replace: true })}
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            Ir para o login
          </Button>
        </section>
      ) : (
        <>
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8efdf] text-[#27633b]">
            <KeyRound className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#658342]">Acesso de professor</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">Defina sua senha</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Crie uma senha para concluir o convite e acessar o sistema.
          </p>

          {status === 'error' ? (
            <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4" role="alert">
              <div className="flex items-start gap-3 text-red-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm leading-relaxed">{mensagem}</p>
              </div>
              <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-[#27633b] hover:underline">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <Input
                id="senha-convite"
                name="new-password"
                type={mostrarSenha ? 'text' : 'password'}
                label="Senha"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={status === 'loading'}
                helperText="Use entre 6 e 72 caracteres."
                rightIcon={(
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((value) => !value)}
                    className="px-1 text-slate-400 transition-colors hover:text-[#27633b] focus:outline-none"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={mostrarSenha}
                  >
                    {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                )}
              />
              <Input
                id="confirmar-senha-convite"
                name="confirm-password"
                type={mostrarConfirmacao ? 'text' : 'password'}
                label="Confirme sua senha"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                required
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                disabled={status === 'loading'}
                error={confirmarSenha && confirmarSenha !== senha ? 'As senhas não coincidem.' : undefined}
                rightIcon={(
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmacao((value) => !value)}
                    className="px-1 text-slate-400 transition-colors hover:text-[#27633b] focus:outline-none"
                    aria-label={mostrarConfirmacao ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    aria-pressed={mostrarConfirmacao}
                  >
                    {mostrarConfirmacao ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                )}
              />
              {mensagem && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {mensagem}
                </p>
              )}
              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={status === 'loading'}>
                Aceitar convite
              </Button>
            </form>
          )}
          {status !== 'error' && (
            <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-[#27633b] hover:text-[#174b32]">
              Voltar para o login
            </Link>
          )}
        </>
      )}
    </AuthLayout>
  );
};
