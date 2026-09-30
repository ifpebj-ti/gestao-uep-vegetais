import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TerrariumMenu } from './TerrariumMenu';
import { AuthProvider } from '../contexts/AuthContext';

describe('TerrariumMenu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderTerrariumMenu = (
    isOpen = true,
    onClose = vi.fn(),
    onFocusLocation = vi.fn()
  ) => {
    return render(
      <MemoryRouter initialEntries={['/mapa']}>
        <AuthProvider>
          <TerrariumMenu
            isOpen={isOpen}
            onClose={onClose}
            onFocusLocation={onFocusLocation}
          />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('não deve renderizar nada quando isOpen for false', () => {
    renderTerrariumMenu(false);
    expect(screen.queryByText(/Módulos do Terrarium/i)).not.toBeInTheDocument();
  });

  it('deve renderizar os itens do menu e saudação de boas-vindas quando isOpen for true', () => {
    renderTerrariumMenu(true);

    expect(screen.getByText(/Módulos do Terrarium/i)).toBeInTheDocument();
    expect(screen.getByText(/Bem - vindo,/i)).toBeInTheDocument();
    expect(screen.getByText(/^Mapa$/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão de Canteiros/i)).toBeInTheDocument();
    expect(screen.getByText(/Modelos de Culturas/i)).toBeInTheDocument();
    expect(screen.getByText(/Irrigação & Reservatório/i)).toBeInTheDocument();
    expect(screen.getByText(/Compostagem & Minhocário/i)).toBeInTheDocument();
    expect(screen.queryByText(/Turmas & Avaliações/i)).not.toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão de fechar', () => {
    const handleClose = vi.fn();
    renderTerrariumMenu(true, handleClose);

    const btnFechar = screen.getByRole('button', { name: /fechar menu/i });
    fireEvent.click(btnFechar);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onFocusLocation ao clicar em Irrigação & Reservatório', () => {
    const handleClose = vi.fn();
    const handleFocus = vi.fn();
    renderTerrariumMenu(true, handleClose, handleFocus);

    const btnIrrigacao = screen.getByRole('button', {
      name: /irrigação & reservatório/i,
    });
    fireEvent.click(btnIrrigacao);

    expect(handleFocus).toHaveBeenCalledWith('agua');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
