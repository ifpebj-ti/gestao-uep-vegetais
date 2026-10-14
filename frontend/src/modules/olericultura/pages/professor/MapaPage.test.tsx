import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MapaPage } from './MapaPage';
import { AuthProvider } from '../../../../contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock TerrariumMap to avoid WebGL context requirements in jsdom
vi.mock('../../components/TerrariumMap', () => {
  return {
    TerrariumMap: ({ onSelectCanteiro }: { onSelectCanteiro: (canteiro: any) => void }) => {
      return (
        <div data-testid="mock-terrarium-map">
          <button
            data-testid="simulate-select-canteiro"
            onClick={() =>
              onSelectCanteiro({
                id: 'c-01',
                codigo: 'C01',
                nome: 'Canteiro 01',
                setor: 'Hortaliças Folhosas',
                cultura: 'Alface Crespa',
                status: 'pronto_colheita',
                statusLabel: 'Pronto p/ Colheita',
                statusColor: '#16a34a',
                diasPlantio: 38,
                diasPrevistosColheita: 40,
                umidadeSolo: 82,
                areaM2: 7.2,
                observacoes: 'Desenvolvimento excelente.',
                professorResponsavel: 'Prof. George Guimarães',
                estudanteLider: 'Ana Beatriz Souza',
                turmaResponsavel: 'Agronomia 3º Período',
                tarefasPendentes: [],
              })
            }
          >
            Selecionar Canteiro 01
          </button>
        </div>
      );
    },
  };
});

describe('MapaPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderMapaPage = () => {
    return render(
      <MemoryRouter initialEntries={['/mapa']}>
        <AuthProvider>
          <MapaPage />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('deve renderizar o título da aplicação Terrarium e os botões principais', () => {
    renderMapaPage();

    expect(screen.getByText('Terrarium')).toBeInTheDocument();
    expect(screen.getByText(/UEP Olericultura/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /planta baixa \(2d\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3d isométrica/i })).toBeInTheDocument();
  });

  it('deve permitir abrir e fechar o menu lateral retrátil', () => {
    renderMapaPage();

    const btnMenu = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(btnMenu);

    expect(screen.getByText(/Módulos do Terrarium/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão de Canteiros/i)).toBeInTheDocument();
    expect(screen.getByText(/Cronograma de Manejo/i)).toBeInTheDocument();

    const btnFechar = screen.getByRole('button', { name: /fechar menu/i });
    fireEvent.click(btnFechar);

    expect(screen.queryByText(/Módulos do Terrarium/i)).not.toBeInTheDocument();
  });

  it('deve exibir saudação personalizada com o nome do usuário autenticado e sem botões de troca de perfil', () => {
    renderMapaPage();

    const btnMenu = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(btnMenu);

    expect(screen.getByText(/Bem - vindo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Perfil em Uso/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^professor$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^aluno$/i })).not.toBeInTheDocument();
  });

  it('deve exibir o card de detalhes com botão de redirecionamento quando um canteiro for selecionado', () => {
    renderMapaPage();

    const triggerSelect = screen.getByTestId('simulate-select-canteiro');
    fireEvent.click(triggerSelect);

    expect(screen.getByText('Canteiro 01')).toBeInTheDocument();
    expect(screen.getAllByText(/Alface Crespa/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Grupo \/ Aluno Responsável:/i)).toBeInTheDocument();
    expect(screen.getByText(/Ana Beatriz Souza • Agronomia 3º Período/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ver mais/i })
    ).toBeInTheDocument();
  });

  it('deve navegar diretamente para a rota do canteiro ao clicar quando a opção "Redirecionar direto" estiver marcada', () => {
    renderMapaPage();

    const checkbox = screen.getByRole('checkbox', { name: /redirecionar direto ao clicar/i });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const triggerSelect = screen.getByTestId('simulate-select-canteiro');
    fireEvent.click(triggerSelect);

    expect(mockNavigate).toHaveBeenCalledWith('/canteiro/c-01');
  });
});
