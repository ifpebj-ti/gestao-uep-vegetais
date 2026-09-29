import React, { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    error?: string;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    id,
    label,
    leftIcon,
    rightIcon,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            <div className="relative">
                {leftIcon && (
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        {leftIcon}
                    </span>
                )}
                <input
                    id={id}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
                    className={`block w-full rounded-xl border bg-white py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-[#27633b] focus:ring-2 focus:ring-[#27633b]/20'
                    } ${leftIcon ? 'pl-10' : 'px-3.5'} ${rightIcon ? 'pr-10' : 'pr-3.5'} ${className}`}
                    {...props}
                />
                {rightIcon && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightIcon}
                    </span>
                )}
            </div>
            {error ? (
                <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
                    {error}
                </p>
            ) : helperText ? (
                <p id={`${id}-helper`} className="text-xs text-slate-500">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
};

