import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UnauthorizedAccess } from './UnauthorizedAccess';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UnauthorizedAccess', () => {
  it('deve renderizar a mensagem de acesso restrito e o perfil do usuário', () => {
    render(
      <MemoryRouter>
        <UnauthorizedAccess userRole="ALUNO" />
      </MemoryRouter>
    );

    expect(screen.getByText('Permissão Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('ALUNO')).toBeInTheDocument();
  });

  it('deve chamar onGoBack ao clicar no botão de voltar quando callback fornecido', () => {
    const handleBack = vi.fn();
    render(
      <MemoryRouter>
        <UnauthorizedAccess userRole="ALUNO" onGoBack={handleBack} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /voltar para a página anterior/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('deve navegar para home ao clicar no botão de seleção de UEP', () => {
    render(
      <MemoryRouter>
        <UnauthorizedAccess userRole="ALUNO" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /ir para a seleção de uep/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
