import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { ColheitaPage } from './ColheitaPage';

describe('ColheitaPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  const renderColheitaPage = () => {
    return render(
      <MemoryRouter initialEntries={['/colheita']}>
        <AuthProvider>
          <Routes>
            <Route path="/colheita" element={<ColheitaPage />} />
            <Route path="/canteiro/:id" element={<div>Detalhe do Canteiro</div>} />
            <Route path="/mapa" element={<div>Tela do Mapa 3D</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('deve renderizar o cabeçalho da página de Colheita, os cards de KPIs e a produção por vegetal em kg', () => {
    renderColheitaPage();

    expect(screen.getByText(/Colheita e Produção por Vegetal \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Produzido \(Colhido\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Vegetais Contabilizados/i)).toBeInTheDocument();
    expect(screen.getByText(/Rendimento Real vs Previsto/i)).toBeInTheDocument();

    // Vegetais nos cards e tabela
    expect(screen.getAllByText(/Alface Crespa/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Couve Manteiga/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tomate Cereja/i).length).toBeGreaterThan(0);
  });

  it('deve filtrar os vegetais produzidos ao buscar pelo nome da hortaliça', () => {
    renderColheitaPage();

    const inputBusca = screen.getByPlaceholderText(
      /Buscar por vegetal \(ex: Alface, Couve, Tomate\), código do canteiro ou aluno/i
    );
    fireEvent.change(inputBusca, { target: { value: 'Tomate Cereja' } });

    expect(screen.getAllByText(/Tomate Cereja/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Alface Roxa/i)).not.toBeInTheDocument();
  });

  it('deve abrir o modal de Registrar Pesagem de Colheita e permitir lançar uma pesagem', () => {
    renderColheitaPage();

    const btnAbrirModal = screen.getByRole('button', { name: /registrar pesagem de colheita/i });
    fireEvent.click(btnAbrirModal);

    expect(screen.getByText(/Quantidade Produzida \(kg\)/i)).toBeInTheDocument();

    const inputKg = screen.getByPlaceholderText(/Ex: 18\.5/i);
    fireEvent.change(inputKg, { target: { value: '30.5' } });

    const btnSalvar = screen.getByRole('button', { name: /salvar pesagem/i });
    fireEvent.click(btnSalvar);

    // O modal fecha e o novo peso (30,5 kg) passa a constar na tela
    expect(screen.queryByText(/Quantidade Produzida \(kg\)/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/30,5 kg/i).length).toBeGreaterThan(0);
  });

  it('deve navegar para os detalhes do canteiro ao clicar em Ver Canteiro na tabela', () => {
    renderColheitaPage();

    const botoesVerCanteiro = screen.getAllByRole('button', { name: /ver canteiro/i });
    expect(botoesVerCanteiro.length).toBeGreaterThan(0);

    fireEvent.click(botoesVerCanteiro[0]);
    expect(screen.getByText('Detalhe do Canteiro')).toBeInTheDocument();
  });
});
