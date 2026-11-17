import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AlunoCanteiroDetailPage } from './AlunoCanteiroDetailPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { canteiroService, FichaCampoApi } from '../../../../services/canteiroService';

const fichaApi = (overrides: Partial<FichaCampoApi> = {}): FichaCampoApi => ({
  canteiroId: 'c-01',
  grupo: 'Grupo API',
  turma: 'Turma API',
  canteiroCodigo: 'API-01',
  cultura: 'Cultura API',
  variedade: 'Variedade API',
  dataPlantio: '2026-10-10',
  espacamento: '0,2 m x 0,1 m',
  plantasPorCanteiro: '50 plantas',
  previsaoColheita: '10/12/2026',
  adubacao: 'Adubação API',
  controlePragas: 'Controle API',
  limpaCapina: 'Capina API',
  obs: 'Observação API',
  statusEntrega: 'entregue',
  dataEntrega: '2026-10-11',
  vistoAssinado: true,
  dataVisto: '2026-10-12',
  parecer: 'Parecer API',
  updatedAt: '2026-10-12T12:00:00Z',
  updatedBy: 'professor@ifpe.edu.br',
  persistida: true,
  modeloCultivoId: 'modelo-api',
  areaCanteiroM2: 8.5,
  plantasPorCanteiroValor: 50,
  previsaoKg: {
    modeloCultivoId: 'modelo-api',
    modeloCultivoNome: 'Cultura API',
    areaCanteiroM2: 8.5,
    plantasEstimadas: 50,
    previsaoKg: 4.25,
    fatorAproveitamento: 0.8,
    unidadeProducao: 'KG',
    espacamentoLinhasM: 0.2,
    espacamentoPlantasM: 0.1,
    produtividadeKgPorPlanta: 0.1,
    pesoMedioKgPorUnidade: null,
    pesoMedioKgPorPlanta: 0.1,
    calculadaEm: '2026-10-12T12:00:00Z',
    aviso: null,
  },
  ...overrides,
});

describe('AlunoCanteiroDetailPage - Detalhes e Ficha Simplificada do Estudante', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(canteiroService, 'getModelosCultivo').mockResolvedValue([]);
    vi.spyOn(canteiroService, 'getFicha').mockResolvedValue(fichaApi());
    vi.spyOn(canteiroService, 'getHistorico').mockResolvedValue([]);
    vi.spyOn(canteiroService, 'saveFicha').mockImplementation(async (_id, ficha) => fichaApi(ficha));

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

  it('não carrega nem permite editar a ficha em uma rota de canteiro inexistente', () => {
    renderComponent('canteiro-inexistente');

    expect(screen.getByRole('alert')).toHaveTextContent('Canteiro não encontrado');
    expect(screen.queryByLabelText('Cultura')).not.toBeInTheDocument();
    expect(canteiroService.getFicha).not.toHaveBeenCalled();
    expect(canteiroService.getHistorico).not.toHaveBeenCalled();
    expect(canteiroService.getModelosCultivo).not.toHaveBeenCalled();
    expect(canteiroService.saveFicha).not.toHaveBeenCalled();
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

  it('carrega e mostra alterações compartilhadas da ficha na linha do tempo', async () => {
    vi.mocked(canteiroService.getHistorico).mockResolvedValue([{
      id: 'evento-1',
      dataHora: '2026-11-11T12:00:00Z',
      autorNome: 'Maria Silva',
      autorPapel: 'ALUNO',
      alteracoes: [{ campo: 'cultura', valorAnterior: 'Alface', valorNovo: 'Batata' }],
    }]);
    renderComponent();

    await waitFor(() => expect(canteiroService.getHistorico).toHaveBeenCalledWith('c-01'));
    fireEvent.click(screen.getByRole('button', { name: /linha do tempo & histórico/i }));

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('(Aluno)')).toBeInTheDocument();
    expect(screen.getByText('Alface')).toBeInTheDocument();
    expect(screen.getByText('Batata')).toBeInTheDocument();
  });

  it('sinaliza falha do histórico da API sem remover a linha do tempo local de tarefas', async () => {
    vi.mocked(canteiroService.getHistorico).mockRejectedValue(new Error('Servidor indisponível'));
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /linha do tempo & histórico/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar as alterações da ficha/i);
    expect(screen.getByText('Transplantio Concluído')).toBeInTheDocument();
  });

  it('deve exibir a aba de Ficha de Campo de Olericultura e carregar dados do servidor', async () => {
    renderComponent();

    expect(screen.getByRole('button', { name: /ficha de campo \(olericultura\)/i })).toBeInTheDocument();
    expect(await screen.findByText(/ficha de campo oficial do canteiro/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Grupo API')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10/12/2026')).toBeInTheDocument();
    expect(screen.getByLabelText(/status da ficha/i)).toHaveValue('entregue');
    expect(canteiroService.getFicha).toHaveBeenCalledWith('c-01');
  });

  it('não exibe valores de demonstração enquanto carrega a ficha remota', async () => {
    let resolver!: (ficha: FichaCampoApi) => void;
    vi.mocked(canteiroService.getFicha).mockReturnValue(new Promise((resolve) => { resolver = resolve; }));

    renderComponent();

    expect(screen.getByRole('status')).toHaveTextContent(/carregando ficha de campo do servidor/i);
    expect(screen.queryByText(/ficha de campo oficial do canteiro/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(/alface/i)).not.toBeInTheDocument();

    resolver(fichaApi());
    expect(await screen.findByDisplayValue('Cultura API')).toBeInTheDocument();
  });

  it('mostra falha no carregamento sem representar uma ficha local como carregada', async () => {
    vi.mocked(canteiroService.getFicha).mockRejectedValue(new Error('Servidor indisponível'));

    renderComponent();

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor indisponível');
    expect(screen.queryByText(/ficha de campo oficial do canteiro/i)).not.toBeInTheDocument();
  });

  it('salva na API, mantém os edits em caso de erro e só atualiza a ficha após sucesso', async () => {
    renderComponent();
    const cultura = await screen.findByLabelText('Cultura');
    fireEvent.change(cultura, { target: { value: 'Cultura editada' } });

    vi.mocked(canteiroService.saveFicha).mockRejectedValueOnce(new Error('Falha no servidor'));
    fireEvent.click(screen.getByRole('button', { name: /salvar ficha/i }));

    expect(await screen.findByText('Falha no servidor')).toBeInTheDocument();
    expect(screen.getByLabelText('Cultura')).toHaveValue('Cultura editada');
    expect(screen.queryByText(/ficha salva no servidor com sucesso/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Cultura'), { target: { value: 'Cultura editada ' } });
    vi.mocked(canteiroService.saveFicha).mockResolvedValueOnce(fichaApi({ cultura: 'Cultura editada' }));
    fireEvent.click(screen.getByRole('button', { name: /salvar ficha/i }));

    await waitFor(() => expect(screen.getByLabelText('Cultura')).toHaveValue('Cultura editada'));
    await waitFor(() => expect(canteiroService.getHistorico).toHaveBeenCalledTimes(2));
    expect(canteiroService.saveFicha).toHaveBeenCalledWith('c-01', expect.objectContaining({
      cultura: 'Cultura editada ',
      turma: 'Turma API',
      modeloCultivoId: 'modelo-api',
      areaCanteiroM2: 8.5,
      previsaoKg: fichaApi().previsaoKg,
      statusEntrega: 'entregue',
    }));
    expect(localStorage.getItem('terrarium_ficha_c-01')).toBeNull();
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
