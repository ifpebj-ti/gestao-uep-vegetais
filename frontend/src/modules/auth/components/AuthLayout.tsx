import React from 'react';
import { Sprout } from 'lucide-react';
import { APP_CONFIG } from '../../../config/constants';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f1e7] px-4 py-10 sm:px-6">
            <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#dce8c8] opacity-70 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-[#ead9b8] opacity-60 blur-3xl" />

            <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-[#34452b]/15 md:min-h-[610px] md:grid-cols-2">
                
                {/* Lado Esquerdo - Branding Verde */}
                <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#174b32] via-[#22633b] to-[#658342] p-8 text-white sm:p-12">
                    <div aria-hidden="true" className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/10" />
                    <div aria-hidden="true" className="absolute -right-10 top-34 h-44 w-44 rounded-full border border-white/10" />
                    <div aria-hidden="true" className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#a7b86b]/20" />

                    <div className="relative">
                        <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                            <Sprout className="h-8 w-8" aria-hidden="true" />
                        </div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d7e6b7]">
                            Conhecimento que floresce
                        </p>
                        <h1 className="font-brand max-w-sm text-3xl font-extrabold leading-tight sm:text-4xl">
                            {APP_CONFIG.name}
                        </h1>
                        <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
                            {APP_CONFIG.subtitle}
                        </p>
                    </div>
                    
                    <div className="relative mt-12 border-t border-white/20 pt-5">
                        <p className="text-sm font-medium text-white/90">{APP_CONFIG.institution}</p>
                        <p className="mt-1 text-xs text-white/60">Cultivando novas possibilidades.</p>
                    </div>
                </section>

                {/* Lado Direito - Onde o Formulário entra */}
                <section className="flex items-center justify-center px-6 py-10 sm:px-12">
                    <div className="w-full max-w-sm">
                        
                        {children}

                        <p className="mt-8 text-center text-xs text-slate-400">
                            {APP_CONFIG.name} v{APP_CONFIG.version}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};