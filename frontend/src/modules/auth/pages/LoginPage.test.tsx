import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../../../contexts/AuthContext';
import { UepProvider } from '../../../contexts/UepContext';
import { authService } from '../../../services/authService';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderLoginPage = (initialState?: Record<string, unknown>) => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: initialState }]}>
        <AuthProvider>
          <UepProvider>
            <LoginPage />
          </UepProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('deve renderizar os campos de e-mail e senha e o botão de entrar', () => {
    renderLoginPage();

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro se tentar enviar formulário vazio', async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /^entrar$/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Por favor, preencha todos os campos.')
    ).toBeInTheDocument();
  });

  it('deve chamar o login com sucesso ao preencher credenciais válidas', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'mock-jwt-token',
      nome: 'Isabela Santos',
      email: 'isabela@ifpe.edu.br',
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'isabela@ifpe.edu.br',
        senha: '123456',
      });
    });
  });

  it('deve exibir a UEP padrão como Olericultura e o link para Trocar UEP', () => {
    renderLoginPage();

    expect(screen.getByText('olericultura')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trocar uep/i })).toHaveAttribute('href', '/selecionar-uep');
  });

  it('deve exibir a UEP Fruticultura quando informada via state de navegação', () => {
    renderLoginPage({ selectedUep: 'fruticultura' });

    expect(screen.getByText('fruticultura')).toBeInTheDocument();
  });
});

