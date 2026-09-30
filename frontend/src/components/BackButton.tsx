import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
  label?: string;
  variant?: 'outline' | 'solid' | 'ghost';
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Voltar',
  variant = 'outline',
  className = '',
  onClick,
  ...props
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }

    if (!e.defaultPrevented) {
      if (to) {
        navigate(to);
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/mapa');
      }
    }
  };

  const variantStyles: Record<'outline' | 'solid' | 'ghost', string> = {
    outline:
      'border border-emerald-200 bg-white text-[#27633b] shadow-sm hover:bg-emerald-50 hover:scale-105 active:scale-95',
    solid:
      'bg-[#27633b] text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95',
    ghost:
      'text-[#27633b] hover:bg-emerald-50 hover:scale-105 active:scale-95',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={props.title || label}
      className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-bold transition ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
