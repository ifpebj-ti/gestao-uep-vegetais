import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ConfirmEmailPage } from './ConfirmEmailPage';
import { authService } from '../services/authService';

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRoute = (initialEntry = '/confirm-email') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/login" element={<div>Tela de Login</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('deve renderizar o formulário manual de token quando nenhum token for passado na URL', () => {
    renderWithRoute('/confirm-email');

    expect(screen.getByText('Confirmação de conta')).toBeInTheDocument();
    expect(screen.getByLabelText(/Token \/ Código de confirmação/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^confirmar e-mail$/i })).toBeInTheDocument();
  });

  it('deve validar token da URL e exibir estado de sucesso', async () => {
    vi.spyOn(authService, 'confirmEmail').mockResolvedValue({
      message: 'E-mail confirmado com sucesso!',
    });

    renderWithRoute('/confirm-email?token=token-valido-123');

    expect(screen.getByText('Validando confirmação...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('E-mail confirmado com sucesso')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /ir para o login/i })).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro se a validação do token falhar', async () => {
    vi.spyOn(authService, 'confirmEmail').mockRejectedValue(
      new Error('Token de confirmação inválido ou expirado.')
    );

    renderWithRoute('/confirm-email?token=token-expirado');

    await waitFor(() => {
      expect(screen.getByText('Falha ao confirmar e-mail')).toBeInTheDocument();
      expect(screen.getByText('Token de confirmação inválido ou expirado.')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /digitar código manualmente/i })).toBeInTheDocument();
  });

  it('deve permitir submeter token manualmente através do formulário', async () => {
    vi.spyOn(authService, 'confirmEmail').mockResolvedValue({
      message: 'E-mail confirmado!',
    });

    renderWithRoute('/confirm-email');

    const input = screen.getByLabelText(/Token \/ Código de confirmação/i);
    fireEvent.change(input, { target: { value: 'codigo-manual-xyz' } });

    fireEvent.click(screen.getByRole('button', { name: /^confirmar e-mail$/i }));

    await waitFor(() => {
      expect(authService.confirmEmail).toHaveBeenCalledWith('codigo-manual-xyz');
      expect(screen.getByText('E-mail confirmado com sucesso')).toBeInTheDocument();
    });
  });
});
