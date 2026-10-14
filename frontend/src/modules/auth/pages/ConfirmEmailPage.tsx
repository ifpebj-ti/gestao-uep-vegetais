import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../../../services/authService';

type StatusType = 'idle' | 'loading' | 'success' | 'error';

export const ConfirmEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token');

    const [tokenInput, setTokenInput] = useState(tokenFromUrl || '');
    const [status, setStatus] = useState<StatusType>(tokenFromUrl ? 'loading' : 'idle');
    const [message, setMessage] = useState<string>('');
    const tokenAutomaticamenteProcessado = useRef<string | null>(null);

    const handleConfirmToken = useCallback(async (tokenToVerify: string) => {
        if (!tokenToVerify.trim()) {
            setStatus('error');
            setMessage('Por favor, informe o token de confirmação.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await authService.confirmEmail(tokenToVerify.trim());
            setStatus('success');
            setMessage(response.message || 'E-mail confirmado com sucesso!');
        } catch (error: unknown) {
            setStatus('error');
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível validar o e-mail. O link pode ter expirado ou ser inválido.'
            );
        }
    }, []);

    useEffect(() => {
        if (tokenFromUrl && tokenAutomaticamenteProcessado.current !== tokenFromUrl) {
            tokenAutomaticamenteProcessado.current = tokenFromUrl;
            handleConfirmToken(tokenFromUrl);
        }
    }, [tokenFromUrl, handleConfirmToken]);

    const handleSubmitManual = (e: React.FormEvent) => {
        e.preventDefault();
        handleConfirmToken(tokenInput);
    };

    return (
        <AuthLayout>
            {status === 'loading' && (
                <div className="text-center py-6" role="status">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8efdf] text-[#27633b]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#26352a]">
                        Validando confirmação...
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Aguarde enquanto confirmamos o seu endereço de e-mail institucional.
                    </p>
                </div>
            )}

            {status === 'success' && (
                <div className="text-center" role="status">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <p className="text-sm font-semibold text-[#658342]">Conta ativada!</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">
                        E-mail confirmado com sucesso
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        {message || 'Sua conta acadêmica está ativa e pronta para uso no sistema.'}
                    </p>

                    <div className="mt-8">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => navigate('/login')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#27633b] py-3.5 text-base font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#174b32]"
                        >
                            <span>Ir para o login</span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700 ring-8 ring-red-50">
                        <AlertCircle className="h-8 w-8" />
                    </div>

                    <p className="text-sm font-semibold text-red-600">Erro na validação</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">
                        Falha ao confirmar e-mail
                    </h2>
                    <p role="alert" className="mt-3 text-sm text-slate-600 leading-relaxed">
                        {message}
                    </p>

                    <div className="mt-8 space-y-3">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setStatus('idle')}
                            className="w-full rounded-xl bg-[#27633b] py-3 text-sm font-bold text-white hover:bg-[#174b32]"
                        >
                            Digitar código manualmente
                        </Button>

                        <Link
                            to="/login"
                            className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                        >
                            Voltar para o login
                        </Link>
                    </div>
                </div>
            )}

            {status === 'idle' && (
                <div>
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-[#658342]">Confirmação de conta</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">
                            Ative seu acesso
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Informe o código ou token que você recebeu em sua caixa de entrada institucional.
                        </p>
                    </div>

                    {message && (
                        <div
                            role="alert"
                            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                        >
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                            <p>{message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmitManual} className="space-y-5">
                        <Input
                            id="token"
                            label="Token / Código de confirmação"
                            placeholder="Cole ou digite o código recebido"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full rounded-xl bg-[#27633b] py-3.5 text-base font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#174b32]"
                        >
                            Confirmar e-mail
                        </Button>

                        <p className="pt-2 text-center text-sm text-slate-500">
                            <Link to="/login" className="font-semibold text-[#27633b] hover:text-[#174b32]">
                                Voltar para o login
                            </Link>
                        </p>
                    </form>
                </div>
            )}
        </AuthLayout>
    );
};
