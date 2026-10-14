import { apiClient } from './apiClient';

export type UnidadeProducao = 'KG' | 'UNIDADE' | 'MACO';

export interface ModeloCultivoApi {
  id: string;
  cultura: string;
  variedade: string | null;
  espacamentoLinhasM: number;
  espacamentoPlantasM: number;
  produtividadeKgPorPlanta: number | null;
  pesoMedioKgPorUnidade: number | null;
  pesoMedioKgPorPlanta: number;
  unidadeProducao: UnidadeProducao;
  fatorAproveitamento: number;
  ativo: boolean;
}

export interface PrevisaoColheitaApi {
  modeloCultivoId: string | null;
  modeloCultivoNome: string | null;
  areaCanteiroM2: number | null;
  plantasEstimadas: number | null;
  previsaoKg: number | null;
  fatorAproveitamento: number | null;
  unidadeProducao: UnidadeProducao | null;
  espacamentoLinhasM: number | null;
  espacamentoPlantasM: number | null;
  produtividadeKgPorPlanta: number | null;
  pesoMedioKgPorUnidade: number | null;
  pesoMedioKgPorPlanta: number | null;
  calculadaEm: string | null;
  aviso: string | null;
}

export interface FichaCampoApi {
  canteiroId: string;
  grupo: string | null;
  canteiroCodigo: string | null;
  cultura: string | null;
  variedade: string | null;
  dataPlantio: string | null;
  espacamento: string | null;
  plantasPorCanteiro: string | null;
  previsaoColheita: string | null;
  adubacao: string | null;
  controlePragas: string | null;
  limpaCapina: string | null;
  obs: string | null;
  statusEntrega: 'pendente' | 'entregue' | 'aprovado' | string;
  dataEntrega: string | null;
  vistoAssinado: boolean;
  dataVisto: string | null;
  parecer: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  persistida: boolean;
  modeloCultivoId: string | null;
  areaCanteiroM2: number | null;
  plantasPorCanteiroValor: number | null;
  previsaoKg: PrevisaoColheitaApi | null;
}

export interface AlunoResumo {
  id: string;
  nome: string;
  email: string;
}

export const canteiroService = {
  getFicha(canteiroId: string): Promise<FichaCampoApi> {
    return apiClient.get<FichaCampoApi>(`/canteiros/${canteiroId}/ficha`);
  },

  saveFicha(canteiroId: string, ficha: FichaCampoApi): Promise<FichaCampoApi> {
    return apiClient.put<FichaCampoApi>(`/canteiros/${canteiroId}/ficha`, {
      grupo: ficha.grupo,
      canteiroCodigo: ficha.canteiroCodigo,
      cultura: ficha.cultura,
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
  },

  getModelosCultivo(): Promise<ModeloCultivoApi[]> {
    return apiClient.get<ModeloCultivoApi[]>('/modelos-cultivo');
  },

  updateModeloCultivo(
    id: string,
    modelo: Omit<ModeloCultivoApi, 'id' | 'ativo'> & { ativo?: boolean },
  ): Promise<ModeloCultivoApi> {
    return apiClient.put<ModeloCultivoApi>(`/modelos-cultivo/${id}`, modelo);
  },

  getResponsaveis(canteiroId: string): Promise<AlunoResumo[]> {
    return apiClient.get<AlunoResumo[]>(`/canteiros/${canteiroId}/responsaveis`);
  },

  getAlunos(): Promise<AlunoResumo[]> {
    return apiClient.get<AlunoResumo[]>('/usuarios/alunos');
  },

  saveResponsaveis(canteiroId: string, alunoIds: string[]): Promise<AlunoResumo[]> {
    return apiClient.put<AlunoResumo[]>(`/canteiros/${canteiroId}/responsaveis`, { alunoIds });
  },
};
