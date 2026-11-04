import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'amber'
  | 'ghost'
  | 'header-glass'
  | 'header-light';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Modelos centralizados de botões do sistema Terrarium.
 * Para alterar a cor ou aparência de um modelo em todo o projeto,
 * basta editar a classe correspondente abaixo (ou as variáveis CSS em index.css).
 */
export const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary shadow-2xs',
  outline: 'btn-outline',
  danger: 'btn-danger',
  amber: 'btn-amber shadow-sm',
  ghost:
    'border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  'header-glass':
    'border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20',
  'header-light':
    'border-transparent bg-white/95 text-[#174b32] shadow-sm hover:bg-white',
};

export const BUTTON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
  icon: 'p-2 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const variantClass = BUTTON_VARIANT_STYLES[variant];
  const sizeClass = BUTTON_SIZE_STYLES[size];
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Carregando...
        </span>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};
