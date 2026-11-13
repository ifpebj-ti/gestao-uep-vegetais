import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../../contexts/AuthContext';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { canteiroService } from '../../../../services/canteiroService';
import { CanteiroDetailPage, parseDataPlantio } from './CanteiroDetailPage';

describe('CanteiroDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('interpreta datas de plantio ISO e brasileiras, rejeitando datas impossíveis', () => {
    const dataIso = parseDataPlantio('2026-11-10');
    const dataBrasileira = parseDataPlantio('10/11/2026');
    expect(dataIso && [dataIso.getFullYear(), dataIso.getMonth() + 1, dataIso.getDate()]).toEqual([2026, 11, 10]);
    expect(dataBrasileira && [dataBrasileira.getFullYear(), dataBrasileira.getMonth() + 1, dataBrasileira.getDate()]).toEqual([2026, 11, 10]);
    expect(parseDataPlantio('31/02/2026')).toBeNull();
    expect(parseDataPlantio('')).toBeNull();
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
    expect(screen.queryByText(/^Plantas\/Ha:$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Previsão de Colheita:$/i)).toBeInTheDocument();

    // Os 4 quadros principais do papel
    expect(screen.getByText(/^Adubação:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Controle de Pragas:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Limpa\/Capina:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^OBS:$/i)).toBeInTheDocument();

    // Botões de ação
    expect(screen.getByRole('button', { name: /imprimir ficha/i })).toBeInTheDocument();
  });

  it('deve alternar para a aba de Cronograma Semanal e exibir o cronograma de manejo da aluna', () => {
    renderCanteiroPage('c-01');

    // Botão da aba Cronograma Semanal (no lugar de Manejo & Irrigação)
    const btnCronograma = screen.getByRole('button', { name: /cronograma semanal/i });
    expect(btnCronograma).toBeInTheDocument();

    // Clicar na aba
    fireEvent.click(btnCronograma);

    // Deve exibir diretamente a tabela de módulos e a indicação de semana atual
    expect(screen.getByText(/Semana Atual \(HOJE\)/i)).toBeInTheDocument();
    expect(screen.getByText('Módulo 1')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2')).toBeInTheDocument();
  });

  it('deve exibir o cronograma específico de Daniela Gusmão para o canteiro C18 (Alface Roxa)', () => {
    renderCanteiroPage('c-18');

    const btnCronograma = screen.getByRole('button', { name: /cronograma semanal/i });
    fireEvent.click(btnCronograma);

    expect(screen.getAllByText('Alface Roxa').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Daniela Gusmão/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Módulo 1')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro para canteiro inexistente', () => {
    renderCanteiroPage('inexistente');

    expect(screen.getByText('Canteiro não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^voltar$/i })).toBeInTheDocument();
  });

  it('carrega e mostra as alterações compartilhadas da ficha no histórico do professor', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { token: 'token-professor', nome: 'Professora Ana', email: 'ana@ifpe.edu.br', role: 'PROFESSOR' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
    vi.spyOn(canteiroService, 'getFicha').mockResolvedValue({
      canteiroId: 'c-01', grupo: 'Grupo A', turma: 'Turma A', canteiroCodigo: 'C01',
      cultura: 'Alface', variedade: null, dataPlantio: null, espacamento: null,
      plantasPorCanteiro: null, previsaoColheita: null, adubacao: null,
      controlePragas: null, limpaCapina: null, obs: null, statusEntrega: 'pendente',
      dataEntrega: null, vistoAssinado: false, dataVisto: null, parecer: null,
      updatedAt: null, updatedBy: null, persistida: true, modeloCultivoId: null,
      areaCanteiroM2: null, plantasPorCanteiroValor: null, previsaoKg: null,
    });
    vi.spyOn(canteiroService, 'getHistorico').mockResolvedValue([{
      id: 'evento-1',
      dataHora: '2026-11-11T12:00:00Z',
      autorNome: 'Maria Silva',
      autorPapel: 'ALUNO',
      alteracoes: [{ campo: 'cultura', valorAnterior: 'Alface', valorNovo: 'Batata' }],
    }]);
    vi.spyOn(canteiroService, 'getResponsaveis').mockResolvedValue([]);
    vi.spyOn(canteiroService, 'getAlunos').mockResolvedValue([]);

    renderCanteiroPage();
    fireEvent.click(screen.getByRole('button', { name: /histórico & linha do tempo/i }));

    await screen.findByText(/altera[cç][oõ]es da ficha de campo/i);
    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('(Aluno)')).toBeInTheDocument();
    expect(screen.getAllByText('Alface').length).toBeGreaterThan(0);
    expect(screen.getByText('Batata')).toBeInTheDocument();
    expect(canteiroService.getHistorico).toHaveBeenCalledWith('c-01');
  });

  it('recarrega o histórico compartilhado após salvar a ficha', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { token: 'token-professor', nome: 'Professora Ana', email: 'ana@ifpe.edu.br', role: 'PROFESSOR' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
    const ficha = {
      canteiroId: 'c-01', grupo: 'Grupo A', turma: 'Turma A', canteiroCodigo: 'C01',
      cultura: 'Alface', variedade: null, dataPlantio: null, espacamento: null,
      plantasPorCanteiro: null, previsaoColheita: null, adubacao: null,
      controlePragas: null, limpaCapina: null, obs: null, statusEntrega: 'pendente',
      dataEntrega: null, vistoAssinado: false, dataVisto: null, parecer: null,
      updatedAt: null, updatedBy: null, persistida: true, modeloCultivoId: null,
      areaCanteiroM2: null, plantasPorCanteiroValor: null, previsaoKg: null,
    } as const;
    vi.spyOn(canteiroService, 'getFicha').mockResolvedValue(ficha);
    vi.spyOn(canteiroService, 'saveFicha').mockResolvedValue(ficha);
    const getHistorico = vi.spyOn(canteiroService, 'getHistorico').mockResolvedValue([]);
    vi.spyOn(canteiroService, 'getResponsaveis').mockResolvedValue([]);
    vi.spyOn(canteiroService, 'getAlunos').mockResolvedValue([]);

    renderCanteiroPage();
    const cultura = await screen.findByLabelText('Cultura');
    fireEvent.change(cultura, { target: { value: 'Batata' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar ficha/i }));

    await waitFor(() => expect(getHistorico).toHaveBeenCalledTimes(2));
    expect(getHistorico).toHaveBeenNthCalledWith(1, 'c-01');
    expect(getHistorico).toHaveBeenNthCalledWith(2, 'c-01');
  });
});
