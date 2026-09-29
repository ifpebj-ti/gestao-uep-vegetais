import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Componente Button', () => {
  it('deve renderizar o texto do botão corretamente', () => {
    render(<Button>Confirmar</Button>);
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
  });

  it('deve disparar a função onClick ao ser clicado', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Salvar</Button>);

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('não deve disparar o clique quando estiver desabilitado', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Enviar</Button>);

    const button = screen.getByRole('button', { name: /enviar/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('deve exibir o texto de carregamento quando isLoading for true', () => {
    render(<Button isLoading>Enviar</Button>);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});