import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { APP_CONFIG } from '../config/constants';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(
            'A recuperação por e-mail ainda não está disponível. Entre em contato com o administrador do sistema.',
        );
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f1e7] px-4 py-10">
            <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#dce8c8] opacity-70 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-[#ead9b8] opacity-60 blur-3xl" />

            <section className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-[#34452b]/15 sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8efdf] text-[#27633b]">
                    <Sprout className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="font-brand text-sm font-semibold text-[#658342]">{APP_CONFIG.name}</p>
                <h1 className="mt-2 text-3xl font-bold text-[#26352a]">Recuperar senha</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    Informe o e-mail associado à sua conta para receber instruções de recuperação.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <Input
                        id="recovery-email"
                        name="email"
                        type="email"
                        label="E-mail"
                        placeholder="voce@exemplo.com"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setMessage('');
                        }}
                        required
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full rounded-xl bg-[#27633b] py-3 font-bold text-white hover:bg-[#174b32]"
                    >
                        Enviar instruções
                    </Button>
                </form>

                {message && (
                    <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                        {message}
                    </p>
                )}

                <Link
                    to="/login"
                    className="mt-6 block text-center text-sm font-semibold text-[#27633b] hover:text-[#174b32]"
                >
                    Voltar para o login
                </Link>
            </section>
        </main>
    );
};