import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AlunoCanteiroDetailPage } from './AlunoCanteiroDetailPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { canteiroService } from '../../../../services/canteiroService';

describe('AlunoCanteiroDetailPage - Detalhes e Ficha Simplificada do Estudante', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(canteiroService, 'getModelosCultivo').mockResolvedValue([]);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno',
        nome: 'Estudante IFPE',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
  });

  const renderComponent = (canteiroId = 'c-01') =>
    render(
      <MemoryRouter initialEntries={[`/olericultura/aluno/canteiro/${canteiroId}`]}>
        <Routes>
          <Route path="/olericultura/aluno/canteiro/:id" element={<AlunoCanteiroDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('deve renderizar as métricas do canteiro, abas e tarefas pendentes', () => {
    renderComponent();

    expect(screen.getAllByText(/canteiro c01/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/dias de plantio/i)).toBeInTheDocument();
    expect(screen.getByText(/setor \/ área/i)).toBeInTheDocument();
    expect(screen.queryByText(/umidade do solo/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar tarefa/i })).toBeInTheDocument();
  });

  it('deve permitir abrir o modal de nova tarefa e cadastrar uma atividade prática', async () => {
    renderComponent();

    const tabTarefas = screen.getByRole('button', { name: /minhas tarefas práticas/i });
    fireEvent.click(tabTarefas);

    const btnAdd = screen.getByRole('button', { name: /adicionar tarefa/i });
    fireEvent.click(btnAdd);

    expect(screen.getByRole('heading', { name: /planejar nova tarefa/i })).toBeInTheDocument();

    const inputTitulo = screen.getByPlaceholderText(/ex: realizar rega e desbaste manual/i);
    fireEvent.change(inputTitulo, { target: { value: 'Aplicação de calda bordalesa' } });

    const btnSalvar = screen.getByRole('button', { name: /salvar tarefa/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(screen.getByText('Aplicação de calda bordalesa')).toBeInTheDocument();
    });
  });

  it('deve alternar para a aba Linha do Tempo & Histórico e exibir registros de manejo', () => {
    renderComponent();

    const tabHistorico = screen.getByRole('button', { name: /linha do tempo & histórico/i });
    fireEvent.click(tabHistorico);

    expect(screen.getByText(/diário de campo e linha do tempo/i)).toBeInTheDocument();
  });

  it('deve exibir a aba de Ficha de Campo de Olericultura e permitir ao aluno preencher a ficha', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: /ficha de campo \(olericultura\)/i })).toBeInTheDocument();
    expect(screen.getByText(/ficha de campo oficial do canteiro/i)).toBeInTheDocument();
  });

  it('deve carregar e exibir os modelos agronômicos para o aluno', async () => {
    vi.mocked(canteiroService.getModelosCultivo).mockResolvedValue([
      {
        id: 'modelo-cenoura',
        cultura: 'Cenoura Baby',
        variedade: 'Daucus carota subsp. sativus',
        espacamentoLinhasM: 0.2,
        espacamentoPlantasM: 0.1,
        produtividadeKgPorPlanta: 0.1,
        pesoMedioKgPorUnidade: null,
        pesoMedioKgPorPlanta: 0.1,
        unidadeProducao: 'KG',
        fatorAproveitamento: 0.7,
        ativo: true,
      },
    ]);

    renderComponent('c-19');

    expect(await screen.findByRole('option', { name: /cenoura baby - Daucus carota/i }))
      .toBeInTheDocument();
    expect(canteiroService.getModelosCultivo).toHaveBeenCalledOnce();
  });
});
