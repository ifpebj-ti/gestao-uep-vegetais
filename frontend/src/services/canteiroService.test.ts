import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { canteiroService, FichaCampoApi } from './canteiroService';

const ficha: FichaCampoApi = {
  canteiroId: 'canteiro-1',
  grupo: 'Grupo 1',
  turma: 'Turma A',
  canteiroCodigo: 'C01',
  cultura: 'Alface',
  variedade: 'Crespa',
  dataPlantio: '2026-10-01',
  espacamento: '0,2 m x 0,1 m',
  plantasPorCanteiro: '50',
  previsaoColheita: '10/12/2026',
  adubacao: 'Composto',
  controlePragas: 'Inspeção',
  limpaCapina: 'Manual',
  obs: 'Observações',
  statusEntrega: 'entregue',
  dataEntrega: '2026-10-02',
  vistoAssinado: false,
  dataVisto: null,
  parecer: null,
  updatedAt: null,
  updatedBy: null,
  persistida: true,
  modeloCultivoId: 'modelo-1',
  areaCanteiroM2: 8,
  plantasPorCanteiroValor: 50,
  previsaoKg: null,
};

describe('canteiroService ficha API', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('busca a ficha persistida pelo identificador do canteiro', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(ficha);

    await expect(canteiroService.getFicha('canteiro-1')).resolves.toEqual(ficha);
    expect(apiClient.get).toHaveBeenCalledWith('/canteiros/canteiro-1/ficha');
  });

  it('busca o histórico de alterações compartilhado do canteiro', async () => {
    const historico = [{
      id: 'evento-1',
      dataHora: '2026-11-11T12:00:00Z',
      autorNome: 'Maria Silva',
      autorPapel: 'ALUNO',
      alteracoes: [{ campo: 'cultura', valorAnterior: 'Alface', valorNovo: 'Batata' }],
    }];
    vi.spyOn(apiClient, 'get').mockResolvedValue(historico);

    await expect(canteiroService.getHistorico('canteiro-1')).resolves.toEqual(historico);
    expect(apiClient.get).toHaveBeenCalledWith('/canteiros/canteiro-1/historico');
  });

  it('persiste os campos editáveis via PUT e retorna a ficha do servidor', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValue(ficha);

    await expect(canteiroService.saveFicha('canteiro-1', ficha)).resolves.toEqual(ficha);
    expect(apiClient.put).toHaveBeenCalledWith('/canteiros/canteiro-1/ficha', {
      grupo: ficha.grupo,
      turma: ficha.turma,
      canteiroCodigo: ficha.canteiroCodigo,
      cultura: ficha.cultura,
      variedade: ficha.variedade,
      dataPlantio: ficha.dataPlantio,
      espacamento: ficha.espacamento,
      plantasPorCanteiro: ficha.plantasPorCanteiro,
      previsaoColheita: ficha.previsaoColheita,
      adubacao: ficha.adubacao,
      controlePragas: ficha.controlePragas,
      limpaCapina: ficha.limpaCapina,
      obs: ficha.obs,
      statusEntrega: ficha.statusEntrega,
      dataEntrega: ficha.dataEntrega,
      vistoAssinado: ficha.vistoAssinado,
      dataVisto: ficha.dataVisto,
      parecer: ficha.parecer,
      modeloCultivoId: ficha.modeloCultivoId,
      areaCanteiroM2: ficha.areaCanteiroM2,
      plantasPorCanteiroValor: ficha.plantasPorCanteiroValor,
    });
  });
});
