import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConfiguracoesLayoutPage } from './ConfiguracoesLayoutPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { canteiroLayoutService } from '../../../../services/canteiroLayoutService';

describe('ConfiguracoesLayoutPage - Editor Visual de Layout 3D Interativo', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-prof',
        nome: 'Prof. George Henrique',
        email: 'george@belojardim.ifpe.edu.br',
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
        <ConfiguracoesLayoutPage />
      </MemoryRouter>
    );

  it('deve renderizar o título do editor visual, a planta baixa interativa e o inspector de canteiro', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /editor visual de layout 3d/i })).toBeInTheDocument();
    expect(screen.getByText(/clique em um canteiro e/i)).toBeInTheDocument();
    expect(screen.getAllByText('C01')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar canteiro/i })).toBeInTheDocument();
    expect(screen.getByText(/coordenadas 3d automáticas:/i)).toBeInTheDocument();
  });

  it('deve permitir adicionar um novo canteiro com 1 clique posicionando-o automaticamente no mapa', () => {
    renderComponent();

    const btnAdicionar = screen.getByRole('button', { name: /adicionar canteiro/i });
    fireEvent.click(btnAdicionar);

    expect(screen.getByText(/novo canteiro c25 inserido no mapa/i)).toBeInTheDocument();
    expect(screen.getAllByText('C25')[0]).toBeInTheDocument();
  });

  it('deve permitir girar o canteiro selecionado em 90 graus', () => {
    renderComponent();

    const btnGirar = screen.getByRole('button', { name: /girar 90°/i });
    fireEvent.click(btnGirar);

    expect(screen.getByText(/canteiro c01 girado/i)).toBeInTheDocument();
  });

  it('deve permitir duplicar o canteiro selecionado com deslocamento lateral automático', () => {
    renderComponent();

    const btnDuplicar = screen.getByRole('button', { name: /duplicar/i });
    fireEvent.click(btnDuplicar);

    expect(screen.getByText(/duplicado e posicionado na fileira ao lado/i)).toBeInTheDocument();
  });

  it('deve alternar entre visualização de Planta Baixa 2D e Lista Detalhada', () => {
    renderComponent();

    const btnLista = screen.getByRole('button', { name: /lista detalhada/i });
    fireEvent.click(btnLista);

    expect(screen.getByPlaceholderText(/buscar por código, nome, cultura/i)).toBeInTheDocument();

    const btnPlanta = screen.getByRole('button', { name: /planta baixa/i });
    fireEvent.click(btnPlanta);

    expect(screen.getByText(/terreno: 32m × 60m/i)).toBeInTheDocument();
  });

  it('deve abrir modal de dimensões reais do terreno e permitir editar largura e comprimento', async () => {
    renderComponent();

    const btnTamanho = screen.getByRole('button', { name: /configurar tamanho real do terreno|terreno: 32m/i });
    fireEvent.click(btnTamanho);

    expect(screen.getByRole('heading', { name: /dimensões reais do terreno/i })).toBeInTheDocument();

    const inputLargura = screen.getByDisplayValue('32');
    const inputComprimento = screen.getByDisplayValue('60');

    fireEvent.change(inputLargura, { target: { value: '40' } });
    fireEvent.change(inputComprimento, { target: { value: '70' } });

    const btnSalvar = screen.getByRole('button', { name: /salvar medidas do terreno/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(screen.getByText(/dimensões.*atualiz/i)).toBeInTheDocument();
    });

    expect(canteiroLayoutService.obterDimensoesTerreno().largura).toBe(40);
    expect(canteiroLayoutService.obterDimensoesTerreno().comprimento).toBe(70);
  });

  it('deve permitir abrir modal de exclusão a partir do card na visualização de lista detalhada', () => {
    renderComponent();

    const btnLista = screen.getByRole('button', { name: /lista detalhada/i });
    fireEvent.click(btnLista);

    const btnExcluirCards = screen.getAllByRole('button', { name: /^excluir$/i });
    expect(btnExcluirCards.length).toBeGreaterThan(0);
    fireEvent.click(btnExcluirCards[0]);

    expect(screen.getByRole('heading', { name: /excluir canteiro/i })).toBeInTheDocument();
  });

  it('deve abrir modal e excluir o canteiro selecionado', async () => {
    renderComponent();

    const btnExcluir = screen.getByRole('button', { name: /excluir canteiro/i });
    fireEvent.click(btnExcluir);

    expect(screen.getByRole('heading', { name: /excluir canteiro/i })).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /sim, excluir/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(screen.getByText(/removido do layout da uep com sucesso/i)).toBeInTheDocument();
    });
  });

  it('deve abrir modal e restaurar o layout padrão da UEP', async () => {
    renderComponent();

    const btnRestaurar = screen.getByRole('button', { name: /restaurar padrão/i });
    fireEvent.click(btnRestaurar);

    expect(screen.getByRole('heading', { name: /restaurar layout original da uep\?/i })).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /confirmar restauração/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(screen.getByText(/layout padrão.*restaurado/i)).toBeInTheDocument();
    });
  });
});
