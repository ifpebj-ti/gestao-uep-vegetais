import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { GoogleButton } from '../components/GoogleButton';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isAcademicEmail = (email: string): boolean => {
    const parts = email.toLowerCase().trim().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];

    return domain === 'discente.ifpe.edu.br' || domain === 'belojardim.ifpe.edu.br';
};

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [aceitaTermos, setAceitaTermos] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cadastradoComSucesso, setCadastradoComSucesso] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendFeedback, setResendFeedback] = useState<string | null>(null);

    // Validações dinâmicas de senha para o indicador visual
    const temTamanhoMinimo = senha.length >= 8;
    const temLetraENumero = /[a-zA-Z]/.test(senha) && /\d/.test(senha);

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        setErrorMessage(null);

        if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
            setErrorMessage('Por favor, preencha todos os campos.');
            return;
        }

        const emailTrim = email.trim();
        if (!EMAIL_REGEX.test(emailTrim)) {
            setErrorMessage('Por favor, insira um e-mail em formato válido.');
            return;
        }

        if (!isAcademicEmail(emailTrim)) {
            setErrorMessage(
                'É necessário utilizar um e-mail institucional de aluno ou professor (ex: nome@discente.ifpe.edu.br ou nome@belojardim.ifpe.edu.br).'
            );
            return;
        }

        if (senha !== confirmarSenha) {
            setErrorMessage('As senhas não coincidem.');
            return;
        }

        if (!temTamanhoMinimo || !temLetraENumero) {
            setErrorMessage(
                'A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra e um número.'
            );
            return;
        }

        if (!aceitaTermos) {
            setErrorMessage('Você precisa aceitar os termos e a política de privacidade.');
            return;
        }

        setIsLoading(true);
        try {
            await authService.register({
                nome: nome.trim(),
                email: emailTrim,
                senha,
            });
            setCadastradoComSucesso(true);
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Erro ao criar conta. Verifique seus dados e tente novamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleReenviar = async () => {
        setIsResending(true);
        setResendFeedback(null);
        try {
            const resp = await authService.resendConfirmation(email.trim());
            setResendFeedback(resp.message || 'Novo e-mail enviado com sucesso!');
        } catch (err: unknown) {
            setResendFeedback(
                err instanceof Error ? err.message : 'Falha ao reenviar e-mail de confirmação.'
            );
        } finally {
            setIsResending(false);
        }
    };

    if (cadastradoComSucesso) {
        return (
            <AuthLayout>
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8efdf] text-[#27633b] ring-8 ring-[#e8efdf]/40">
                        <Mail className="h-8 w-8" />
                    </div>

                    <p className="text-sm font-semibold text-[#658342]">Confirmação necessária</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">
                        Verifique seu e-mail
                    </h2>

                    <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                        Enviamos um link de confirmação para o seu endereço acadêmico:
                    </p>
                    <p className="mt-1 font-bold text-base text-[#27633b] break-all">
                        {email}
                    </p>

                    <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                        Por favor, abra sua caixa de entrada e clique no link enviado para validar sua conta e liberar seu acesso ao sistema.
                    </p>

                    {resendFeedback && (
                        <div
                            role="status"
                            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
                        >
                            {resendFeedback}
                        </div>
                    )}

                    <div className="mt-8 space-y-3">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => navigate('/login')}
                            className="w-full rounded-xl bg-[#27633b] py-3.5 text-base font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#174b32]"
                        >
                            Ir para o login
                        </Button>

                        <button
                            type="button"
                            onClick={handleReenviar}
                            disabled={isResending}
                            className="block w-full py-2 text-xs font-semibold text-[#27633b] hover:text-[#174b32] disabled:opacity-50"
                        >
                            {isResending ? 'Reenviando...' : 'Não recebeu? Clique para reenviar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setCadastradoComSucesso(false)}
                            className="block w-full text-xs text-slate-400 hover:text-slate-600"
                        >
                            Voltar e alterar dados
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }


    return (
        <AuthLayout>
            <div className="mb-8">
                <p className="text-sm font-semibold text-[#658342]">Junte-se a nós!</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">
                    Crie sua conta
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Preencha os dados abaixo para se cadastrar.
                </p>
            </div>

            {errorMessage && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p>{errorMessage}</p>
                </div>
            )}


            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                    id="nome"
                    label="Nome completo"
                    placeholder="digite seu nome e sobrenome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isLoading}
                />


                <Input
                    id="email"
                    type="email"
                    label="E-mail"
                    placeholder="voce@discente.ifpe.edu.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    helperText="Utilize @discente.ifpe.edu.br para alunos ou @belojardim.ifpe.edu.br para professores"
                />

                <div className="space-y-2">
                    <Input
                        id="senha"
                        type={showPassword ? 'text' : 'password'}
                        label="Senha"
                        placeholder="crie uma senha segura"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        disabled={isLoading}
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="px-2 text-slate-400 transition-colors hover:text-[#27633b] focus:outline-none"
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        }
                    />

                    {/* Indicador visual: Checklist dinâmico de requisitos de senha (só aparece ao digitar) */}
                    {senha.length > 0 && (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs transition-all">
                            <p className="mb-2 font-medium text-slate-600">Requisitos da senha:</p>
                            <ul className="space-y-1.5" aria-label="Requisitos de senha">
                                <li
                                    className={`flex items-center gap-2 transition-colors duration-200 ${
                                        temTamanhoMinimo ? 'font-semibold text-[#27633b]' : 'text-slate-500'
                                    }`}
                                >
                                    <CheckCircle2
                                        className={`h-4 w-4 shrink-0 transition-transform ${
                                            temTamanhoMinimo ? 'text-[#27633b] scale-110' : 'text-slate-300'
                                        }`}
                                    />
                                    <span>Mínimo 8 caracteres</span>
                                </li>
                                <li
                                    className={`flex items-center gap-2 transition-colors duration-200 ${
                                        temLetraENumero ? 'font-semibold text-[#27633b]' : 'text-slate-500'
                                    }`}
                                >
                                    <CheckCircle2
                                        className={`h-4 w-4 shrink-0 transition-transform ${
                                            temLetraENumero ? 'text-[#27633b] scale-110' : 'text-slate-300'
                                        }`}
                                    />
                                    <span>Pelo menos uma letra e um número</span>
                                </li>
                            </ul>
                        </div>
                    )}

                </div>



                <Input
                    id="confirmarSenha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Repita a senha"
                    placeholder="repita a senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={isLoading}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="px-2 text-slate-400 transition-colors hover:text-[#27633b] focus:outline-none"
                            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    }
                />

                <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={aceitaTermos}
                        onChange={(e) => setAceitaTermos(e.target.checked)}
                        disabled={isLoading}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#27633b] focus:ring-[#27633b]"
                    />
                    <span>
                        Li e concordo com os{' '}
                        <a href="#" className="font-semibold text-[#27633b] transition-colors hover:text-[#174b32] hover:underline">
                            termos & política de privacidade
                        </a>
                    </span>
                </label>

                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="w-full rounded-xl bg-[#27633b] py-3.5 text-base font-bold text-white shadow-lg shadow-[#27633b]/20 transition-colors hover:bg-[#174b32]"
                >
                    Criar conta
                </Button>

                <div className="flex items-center gap-4 py-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">ou</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                <GoogleButton onClick={() => console.log('Registro com Google')} />

                <p className="pt-2 text-center text-sm text-slate-500">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-semibold text-[#27633b] transition-colors hover:text-[#174b32]">
                        Faça o login
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
