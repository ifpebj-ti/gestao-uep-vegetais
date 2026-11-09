import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/Button';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { Input } from '../../../components/Input';
import { useAuth } from '../../../contexts/AuthContext';
import { useUep } from '../../../contexts/UepContext';
import { AuthLayout } from '../components/AuthLayout';
import { identifyRoleByEmail } from '../utils/roleIdentifier';
import { UserSession } from '../../../services/authService';
import { adminService } from '../../../services/adminService';

interface LoginPageProps {
    onLoginSuccess?: (userName: string) => void;
}

interface LocationState {
    from?: { pathname: string };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const { login, loginWithGoogle } = useAuth();
    const { setSelectedUep } = useUep();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const redirectAfterLogin = (user: UserSession) => {
        const role = identifyRoleByEmail(user.email, user.role);

        // O Admin só tem acesso ao painel de administração (/admin) e não ao mapa
        if (role === 'ADMIN') {
            navigate('/admin', { replace: true });
            return;
        }

        const userUep = adminService.obterUepDoProfessor(user.email, user.uep);
        setSelectedUep(userUep);

        // Define a rota padrão com base no perfil e na UEP
        const rotaPadrao = userUep === 'fruticultura'
            ? (role === 'ALUNO' ? '/fruticultura/aluno/pomar' : '/fruticultura/professor/pomar')
            : (role === 'ALUNO' ? '/olericultura/aluno/mapa' : '/olericultura/professor/mapa');

        const fromPath = (location.state as LocationState | null)?.from?.pathname;

        // Se houver uma rota anterior salva, só redireciona para ela se for permitida para o perfil do usuário
        if (fromPath) {
            const rotaValida = role === 'PROFESSOR'
                ? !fromPath.includes('/aluno/') && !fromPath.includes('/admin')
                : role === 'ALUNO'
                    ? !fromPath.includes('/professor/') && !fromPath.includes('/admin')
                    : false;

            if (rotaValida) {
                navigate(fromPath, { replace: true });
                return;
            }
        }

        navigate(rotaPadrao, { replace: true });
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
                redirectAfterLogin(user);
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
                redirectAfterLogin(user);
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
            <div className="mb-8">
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
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
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
