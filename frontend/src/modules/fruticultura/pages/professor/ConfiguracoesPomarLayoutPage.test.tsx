import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConfiguracoesPomarLayoutPage } from './ConfiguracoesPomarLayoutPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { UepProvider } from '../../../../contexts/UepContext';
import { pomarLayoutService } from '../../../../services/pomarLayoutService';

describe('ConfiguracoesPomarLayoutPage - Editor de Layout e Plantações do Pomar', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-prof-fruticultura',
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

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <UepProvider>
          <ConfiguracoesPomarLayoutPage />
        </UepProvider>
      </MemoryRouter>
    );

  it('deve renderizar o cabeçalho do editor, botão de nova quadra e inspetor da quadra', () => {
    renderComponent();

    expect(screen.getByText(/editor de layout e plantações do pomar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nova quadra/i })).toBeInTheDocument();
    expect(screen.getByText(/inspetor da quadra/i)).toBeInTheDocument();
  });

  it('deve alternar entre visualização de Planta Baixa 2D e Lista Detalhada', async () => {
    renderComponent();

    const btnTabela = screen.getByRole('button', { name: /lista detalhada/i });
    fireEvent.click(btnTabela);

    expect(screen.getByText(/cód/i)).toBeInTheDocument();
    expect(screen.getByText(/quadra \/ cultura/i)).toBeInTheDocument();
    expect(screen.getAllByText(/banana/i)[0]).toBeInTheDocument();

    const btn2D = screen.getByRole('button', { name: /planta baixa/i });
    fireEvent.click(btn2D);

    await waitFor(() => {
      expect(screen.getByText(/inspetor da quadra/i)).toBeInTheDocument();
    });
  });

  it('deve abrir o modal de cadastro ao clicar em Nova Quadra', async () => {
    renderComponent();

    const btnNova = screen.getByRole('button', { name: /nova quadra/i });
    fireEvent.click(btnNova);

    await waitFor(() => {
      expect(screen.getByText(/cadastrar nova quadra/i)).toBeInTheDocument();
      expect(screen.getByText(/culturas plantadas/i)).toBeInTheDocument();
    });
  });

  it('deve abrir o modal de edição de plantação a partir da tabela', async () => {
    renderComponent();

    const btnTabela = screen.getByRole('button', { name: /lista detalhada/i });
    fireEvent.click(btnTabela);

    const btnEditarQuadra = screen.getAllByTitle(/editar quadra/i)[0];
    fireEvent.click(btnEditarQuadra);

    await waitFor(() => {
      expect(screen.getByText(/editar sala de equipamento/i)).toBeInTheDocument();
      expect(screen.getAllByDisplayValue(/sala de equipamento/i).length).toBeGreaterThan(0);
    });
  });

  it('deve permitir abrir modal de restauração e resetar para o padrão', async () => {
    renderComponent();

    const btnRestaurar = screen.getByRole('button', { name: /restaurar padrão/i });
    fireEvent.click(btnRestaurar);

    await waitFor(() => {
      expect(screen.getByText(/restaurar layout padrão/i)).toBeInTheDocument();
    });

    const btnConfirmar = screen.getByRole('button', { name: /confirmar restauração/i });
    fireEvent.click(btnConfirmar);

    expect(pomarLayoutService.listarQuadras().length).toBeGreaterThan(0);
  });
});
