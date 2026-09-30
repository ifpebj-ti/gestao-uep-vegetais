import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from './BackButton';
import { beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Componente BackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar com o texto padrão "Voltar"', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /^voltar$/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Voltar');
  });

  it('deve aceitar um label personalizado', () => {
    render(
      <MemoryRouter>
        <BackButton label="Retornar à Listagem" />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /retornar à listagem/i })).toBeInTheDocument();
  });

  it('deve navegar para a rota especificada na prop "to" ao clicar', () => {
    render(
      <MemoryRouter>
        <BackButton to="/mapa" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^voltar$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/mapa');
  });

  it('deve disparar onClick customizado quando fornecido', () => {
    const handleClick = vi.fn();
    render(
      <MemoryRouter>
        <BackButton onClick={handleClick} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^voltar$/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
