import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { CanteiroDetailPage } from './CanteiroDetailPage';

describe('CanteiroDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderCanteiroPage = (canteiroId = 'c-01') => {
    return render(
      <MemoryRouter initialEntries={[`/canteiro/${canteiroId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/canteiro/:id" element={<CanteiroDetailPage />} />
            <Route path="/mapa" element={<div>Tela do Mapa 3D</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('deve exibir os detalhes do canteiro C01', () => {
    renderCanteiroPage('c-01');

    expect(screen.getAllByText('C01').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Alface Crespa/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Hortaliças Folhosas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^voltar$/i })).toBeInTheDocument();
  });

  it('deve exibir o botão de menu, o botão de voltar no topo e o card da equipe responsável no hero', () => {
    renderCanteiroPage('c-01');

    // Botões de topo
    const btnMenu = screen.getByRole('button', { name: /menu/i });
    const btnVoltar = screen.getByRole('button', { name: /^voltar$/i });
    expect(btnMenu).toBeInTheDocument();
    expect(btnVoltar).toBeInTheDocument();

    // Grupo Responsável e Turma no hero
    expect(screen.getByText(/Grupo Responsável:/i)).toBeInTheDocument();
    expect(screen.getAllByText('Ana Beatriz Souza').length).toBeGreaterThan(0);
    expect(screen.getByText(/^Turma:$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Agronomia 3º Período - Turma A/i).length).toBeGreaterThan(0);

    // Abrir o menu lateral
    fireEvent.click(btnMenu);
    expect(screen.getByText(/Módulos do Terrarium/i)).toBeInTheDocument();
  });

  it('deve exibir a Ficha de Campo de Olericultura com cabeçalho do Prof. George Guimarães e todos os campos do papel', () => {
    renderCanteiroPage('c-01');

    // Cabeçalho oficial do papel
    expect(screen.getByText(/OLERICULTURA – George Guimarães/i)).toBeInTheDocument();

    // Campos de identificação
    expect(screen.getByText(/^Grupo:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Canteiro:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Cultura:$/i)).toBeInTheDocument();
    expect(screen.getByText(/Data do Plantio\/semeio\/transplantio:/i)).toBeInTheDocument();
    expect(screen.getByText(/^Espaçamento:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Plantas\/canteiro:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Plantas\/Ha:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Previsão de Colheita:$/i)).toBeInTheDocument();

    // Os 4 quadros principais do papel
    expect(screen.getByText(/^Adubação:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Controle de Pragas:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Limpa\/Capina:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^OBS:$/i)).toBeInTheDocument();

    // Botões de ação
    expect(screen.getByRole('button', { name: /imprimir ficha/i })).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro para canteiro inexistente', () => {
    renderCanteiroPage('inexistente');

    expect(screen.getByText('Canteiro não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^voltar$/i })).toBeInTheDocument();
  });
});
