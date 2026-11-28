import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PomarMenu } from './PomarMenu';
import * as AuthContextModule from '../../../contexts/AuthContext';
import { UepProvider } from '../../../contexts/UepContext';

describe('PomarMenu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-prof-fruta',
        nome: 'Profª. Isabela França',
        email: 'isabela.franca.lima@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
  });

  const renderPomarMenu = (isOpen = true, onClose = vi.fn()) => {
    return render(
      <MemoryRouter initialEntries={['/fruticultura/professor/pomar']}>
        <UepProvider>
          <PomarMenu isOpen={isOpen} onClose={onClose} />
        </UepProvider>
      </MemoryRouter>
    );
  };

  it('não deve renderizar nada quando isOpen for false', () => {
    renderPomarMenu(false);
    expect(screen.queryByText(/Módulos do Pomar/i)).not.toBeInTheDocument();
  });

  it('deve renderizar Módulos do Pomar, Mapa, Equipamentos e Configurações de Layout quando isOpen for true', () => {
    renderPomarMenu(true);

    expect(screen.getByText(/Módulos do Pomar/i)).toBeInTheDocument();
    expect(screen.getByText(/Mapa do Pomar/i)).toBeInTheDocument();
    expect(screen.getByText(/Materiais & Equipamentos/i)).toBeInTheDocument();
    expect(screen.getByText(/Configurações & Layout 3D/i)).toBeInTheDocument();
    expect(screen.getByText(/Sair da Conta/i)).toBeInTheDocument();
  });

  it('NÃO deve listar as culturas/plantas individuais no menu lateral', () => {
    renderPomarMenu(true);

    expect(screen.queryByText(/90 plantas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/68 plantas/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Goiaba \(borda\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Quadras$/i)).not.toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão de fechar', () => {
    const handleClose = vi.fn();
    renderPomarMenu(true, handleClose);

    const btnFechar = screen.getByRole('button', { name: /fechar menu/i });
    fireEvent.click(btnFechar);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
