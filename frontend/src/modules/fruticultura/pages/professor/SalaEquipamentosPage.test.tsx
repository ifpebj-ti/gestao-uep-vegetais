import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SalaEquipamentosPage } from './SalaEquipamentosPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { UepProvider } from '../../../../contexts/UepContext';

describe('SalaEquipamentosPage', () => {
  beforeEach(() => {
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
      <MemoryRouter initialEntries={['/fruticultura/professor/equipamentos']}>
        <UepProvider>
          <SalaEquipamentosPage />
        </UepProvider>
      </MemoryRouter>
    );

  it('deve renderizar o título da página e o botão de menu no topo', () => {
    renderComponent();

    expect(screen.getByText(/sala de equipamentos & insumos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir menu de navegação do sistema/i })).toBeInTheDocument();
  });

  it('deve abrir o menu lateral ao clicar no botão MENU', async () => {
    renderComponent();

    const btnMenu = screen.getByRole('button', { name: /abrir menu de navegação do sistema/i });
    fireEvent.click(btnMenu);

    await waitFor(() => {
      expect(screen.getByText(/módulos do pomar/i)).toBeInTheDocument();
      expect(screen.getByText(/mapa do pomar/i)).toBeInTheDocument();
    });
  });

  it('deve listar os materiais e ferramentas cadastrados', () => {
    renderComponent();

    expect(screen.getByText(/tesoura de poda profissional/i)).toBeInTheDocument();
    expect(screen.getByText(/caixas plásticas vazadas para colheita/i)).toBeInTheDocument();
  });

  it('deve filtrar os materiais pela caixa de busca', () => {
    renderComponent();

    const inputBusca = screen.getByPlaceholderText(/buscar material/i);
    fireEvent.change(inputBusca, { target: { value: 'Serrote' } });

    expect(screen.getByText(/serrote de poda dobrável/i)).toBeInTheDocument();
    expect(screen.queryByText(/caixas plásticas vazadas/i)).not.toBeInTheDocument();
  });
});
