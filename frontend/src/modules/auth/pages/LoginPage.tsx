import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Sprout, Apple } from 'lucide-react';
import { Button } from '../../../components/Button';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { Input } from '../../../components/Input';
import { useAuth } from '../../../contexts/AuthContext';
import { useUep } from '../../../contexts/UepContext';
import { AuthLayout } from '../components/AuthLayout';
import { UepType } from '../../../types/uep';
import { identifyRoleByEmail } from '../utils/roleIdentifier';

interface LoginPageProps {
    onLoginSuccess?: (userName: string) => void;
}

interface LocationState {
    selectedUep?: UepType;
    from?: { pathname: string };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const { login, loginWithGoogle } = useAuth();
    const { selectedUep, setSelectedUep } = useUep();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Determina a UEP ativa priorizando: 1. state do router, 2. query param, 3. contexto/sessionStorage, 4. default 'olericultura'
    const stateUep = (location.state as LocationState | null)?.selectedUep;
    const queryUep = searchParams.get('uep') as UepType | null;
    const currentUep: UepType =
        (stateUep === 'olericultura' || stateUep === 'fruticultura')
            ? stateUep
            : (queryUep === 'olericultura' || queryUep === 'fruticultura')
            ? queryUep
            : selectedUep || 'olericultura';

    // Mantém o contexto de UEP atualizado se veio via state ou query
    React.useEffect(() => {
        if (currentUep && currentUep !== selectedUep) {
            setSelectedUep(currentUep);
        }
    }, [currentUep, selectedUep, setSelectedUep]);

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const redirectAfterLogin = (userEmail: string, backendRole?: string) => {
        const fromPath = (location.state as LocationState | null)?.from?.pathname;
        if (fromPath) {
            navigate(fromPath, { replace: true });
            return;
        }

        const role = identifyRoleByEmail(userEmail, backendRole);
        if (currentUep === 'fruticultura') {
            navigate(role === 'ALUNO' ? '/fruticultura/aluno/pomar' : '/fruticultura/professor/pomar', { replace: true });
            return;
        }

        // Olericultura
        navigate(role === 'ALUNO' ? '/olericultura/aluno/mapa' : '/olericultura/professor/mapa', { replace: true });
    };

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email.trim() || !senha) {
            setErrorMessage('Por favor, preencha todos os campos.');
            return;
        }

        setIsLoading(true);
        try {
            const user = await login({ email: email.trim(), senha });
            onLoginSuccess?.(user.nome);
            setSuccessMessage(`Bem-vindo(a), ${user.nome}! Login realizado com sucesso.`);
            setTimeout(() => {
                redirectAfterLogin(user.email, user.role);
            }, 400);
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Erro ao realizar login. Verifique seus dados.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (credential: string) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsLoading(true);
        try {
            const user = await loginWithGoogle(credential);
            onLoginSuccess?.(user.nome);
            setSuccessMessage(`Bem-vindo(a), ${user.nome}! Login realizado com sucesso.`);
            setTimeout(() => {
                redirectAfterLogin(user.email, user.role);
            }, 400);
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Erro ao realizar login com Google.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-6">
                {/* Badge informativa da UEP selecionada com opção de troca */}
                <div className="mb-4 flex items-center justify-between rounded-xl border border-stone-200/90 bg-stone-50 px-3.5 py-2">
                    <div className="flex items-center gap-2">
                        {currentUep === 'fruticultura' ? (
                            <Apple className="h-4 w-4 text-amber-600" />
                        ) : (
                            <Sprout className="h-4 w-4 text-emerald-600" />
                        )}
                        <span className="text-xs font-semibold text-slate-600">
                            UEP: <span className="capitalize text-slate-900">{currentUep}</span>
                        </span>
                    </div>
                    <Link
                        to="/selecionar-uep"
                        className="text-xs font-bold text-[#27633b] hover:text-[#174b32] hover:underline"
                    >
                        Trocar UEP
                    </Link>
                </div>

                <p className="text-sm font-semibold text-[#658342]">Bem-vindo!</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#26352a]">
                    Acesse sua conta
                </h2>
                <p className="mt-2 text-sm text-slate-500">Entre com seus dados institucionais para continuar.</p>
            </div>

            {errorMessage && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p>{errorMessage}</p>
                </div>
            )}
            {successMessage && (
                <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p>{successMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label="E-mail"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading}
                />
                <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    label="Senha"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    disabled={isLoading}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="px-2 text-slate-400 hover:text-[#27633b]"
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    }
                />

                <div className="flex justify-end text-sm">
                    <Link to="/forgot-password" className="font-semibold text-[#27633b] hover:text-[#174b32]">
                        Esqueceu a senha?
                    </Link>
                </div>


                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="w-full rounded-xl bg-[#27633b] py-3.5 text-base font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#174b32]"
                >
                    Entrar
                </Button>

                <div className="flex items-center gap-4 py-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">ou</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
                
                <GoogleLoginButton
                    onSuccess={handleGoogleLogin}
                    onError={() => setErrorMessage('Não foi possível iniciar o login com Google.')}
                />
                
                <p className="pt-2 text-center text-sm text-slate-500">
                    Ainda não tem uma conta? <Link to="/register" className="font-semibold text-[#27633b]">Crie aqui</Link>
                </p>
            </form>
        </AuthLayout>
    );
};
