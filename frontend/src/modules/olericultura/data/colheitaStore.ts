export interface RegistroColheitaItem {
  id: string;
  canteiroId: string;
  canteiroCodigo: string;
  cultura: string;
  variedade: string;
  turma: string;
  responsavel: string;
  dataColheita: string;
  kgProduzidos: number;
  kgPrevistos: number;
  destino: string;
  observacao?: string;
  status: 'colhido' | 'pronto_colheita' | 'em_ciclo';
}

const STORAGE_KEY = 'terrarium_uep_registros_colheita_v2';

export const REGISTROS_COLHEITA_INICIAIS: RegistroColheitaItem[] = [
  {
    id: 'col-01',
    canteiroId: 'c-01',
    canteiroCodigo: 'C01',
    cultura: 'Alface Crespa',
    variedade: 'Lactuca sativa L.',
    turma: 'Agronomia 3º Período - Turma A',
    responsavel: 'Ana Beatriz Souza',
    dataColheita: '28/10/2026',
    kgProduzidos: 24.5,
    kgPrevistos: 23.0,
    destino: 'Refeitório Estudantil IFPE',
    observacao: 'Colheita realizada pelo grupo responsável',
    status: 'colhido',
  },
  {
    id: 'col-02',
    canteiroId: 'c-18',
    canteiroCodigo: 'C18',
    cultura: 'Alface Roxa',
    variedade: 'Lactuca sativa L.',
    turma: 'Técnico Agropecuária - 1º Módulo',
    responsavel: 'Daniela Gusmão',
    dataColheita: '29/10/2026',
    kgProduzidos: 21.8,
    kgPrevistos: 20.5,
    destino: 'Refeitório Estudantil IFPE',
    observacao: 'Colheita integral do canteiro',
    status: 'colhido',
  },
  {
    id: 'col-03',
    canteiroId: 'c-06',
    canteiroCodigo: 'C06',
    cultura: 'Couve Manteiga',
    variedade: 'Brassica oleracea var. acephala',
    turma: 'Técnico Agropecuária - 1º Módulo',
    responsavel: 'Guilherme Rocha',
    dataColheita: '25/10/2026',
    kgProduzidos: 38.4,
    kgPrevistos: 36.0,
    destino: 'Restaurante Universitário & Feira Agroecológica',
    observacao: 'Colheita comercial de maços padronizados',
    status: 'colhido',
  },
  {
    id: 'col-04',
    canteiroId: 'c-03',
    canteiroCodigo: 'C03',
    cultura: 'Rúcula Cultivada',
    variedade: 'Eruca vesicaria',
    turma: 'Técnico Agropecuária - 2º Módulo',
    responsavel: 'Mariana Duarte',
    dataColheita: '30/10/2026',
    kgProduzidos: 16.2,
    kgPrevistos: 15.0,
    destino: 'Refeitório Estudantil IFPE',
    observacao: 'Colheita de folhas jovens',
    status: 'colhido',
  },
  {
    id: 'col-05',
    canteiroId: 'c-07',
    canteiroCodigo: 'C07',
    cultura: 'Coentro Verdão',
    variedade: 'Coriandrum sativum L.',
    turma: 'Agronomia 3º Período - Turma B',
    responsavel: 'Letícia Barbosa',
    dataColheita: '31/10/2026',
    kgProduzidos: 19.6,
    kgPrevistos: 18.0,
    destino: 'Cozinha Experimental & Refeitório',
    observacao: 'Colheita de maços inteiros',
    status: 'colhido',
  },
  {
    id: 'col-06',
    canteiroId: 'c-09',
    canteiroCodigo: 'C09',
    cultura: 'Rabanete Redondo',
    variedade: 'Raphanus sativus L.',
    turma: 'Técnico Agropecuária - 2º Módulo',
    responsavel: 'Julio Cesar Martins',
    dataColheita: '27/10/2026',
    kgProduzidos: 22.0,
    kgPrevistos: 21.0,
    destino: 'Feira Agroecológica IFPE',
    observacao: 'Colheita de raízes comerciais',
    status: 'colhido',
  },
  {
    id: 'col-07',
    canteiroId: 'c-24',
    canteiroCodigo: 'C24',
    cultura: 'Brócolis Ramoso',
    variedade: 'Brassica oleracea var. italica',
    turma: 'Agronomia 5º Período - Olericultura',
    responsavel: 'Beatriz Vasques',
    dataColheita: '01/11/2026',
    kgProduzidos: 29.5,
    kgPrevistos: 28.8,
    destino: 'Refeitório Estudantil IFPE',
    observacao: 'Colheita de inflorescências centrais',
    status: 'colhido',
  },
  {
    id: 'col-08',
    canteiroId: 'c-14',
    canteiroCodigo: 'C14',
    cultura: 'Tomate Cereja',
    variedade: 'Solanum lycopersicum var. cerasiforme',
    turma: 'Agronomia 5º Período - Olericultura',
    responsavel: 'Sofia Meireles',
    dataColheita: '26/10/2026',
    kgProduzidos: 44.0,
    kgPrevistos: 42.0,
    destino: 'Agroindústria & Refeitório',
    observacao: 'Colheita de cachos maduros',
    status: 'colhido',
  },
  {
    id: 'col-09',
    canteiroId: 'c-04',
    canteiroCodigo: 'C04',
    cultura: 'Cenoura Brasília',
    variedade: 'Daucus carota subsp. sativus',
    turma: 'Agronomia 5º Período - Olericultura',
    responsavel: 'Felipe Menezes',
    dataColheita: '20/10/2026',
    kgProduzidos: 34.2,
    kgPrevistos: 35.0,
    destino: 'Refeitório Estudantil IFPE',
    observacao: 'Colheita total do canteiro',
    status: 'colhido',
  },
  {
    id: 'col-10',
    canteiroId: 'c-05',
    canteiroCodigo: 'C05',
    cultura: 'Beterraba Vermelha',
    variedade: 'Beta vulgaris L.',
    turma: 'Agronomia 5º Período - Olericultura',
    responsavel: 'Camila Peixoto',
    dataColheita: '22/10/2026',
    kgProduzidos: 31.8,
    kgPrevistos: 30.0,
    destino: 'Refeitório Estudantil IFPE',
    observacao: 'Colheita total do canteiro',
    status: 'colhido',
  },
];

export function carregarRegistrosColheita(): RegistroColheitaItem[] {
  if (typeof window === 'undefined') return REGISTROS_COLHEITA_INICIAIS;
  try {
    const salvo = window.localStorage.getItem(STORAGE_KEY);
    if (!salvo) return REGISTROS_COLHEITA_INICIAIS;
    const parsed = JSON.parse(salvo);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback em caso de erro de leitura no localStorage
  }
  return REGISTROS_COLHEITA_INICIAIS;
}

export function salvarRegistrosColheita(registros: RegistroColheitaItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch {
    // Ignorar falha de quota
  }
}

export function obterColheitasDoCanteiro(canteiroId: string, canteiroCodigo?: string): RegistroColheitaItem[] {
  const todos = carregarRegistrosColheita();
  return todos.filter(
    (item) =>
      item.canteiroId === canteiroId ||
      (canteiroCodigo && item.canteiroCodigo.toLowerCase() === canteiroCodigo.toLowerCase())
  );
}

/**
 * Salva (ou atualiza) a colheita única daquele canteiro no ciclo atual.
 */
export function adicionarRegistroColheita(novo: Omit<RegistroColheitaItem, 'id'>): RegistroColheitaItem[] {
  const atuais = carregarRegistrosColheita();
  const semEsteCanteiro = atuais.filter(
    (item) =>
      item.canteiroId !== novo.canteiroId &&
      item.canteiroCodigo.toLowerCase() !== novo.canteiroCodigo.toLowerCase()
  );
  const itemComId: RegistroColheitaItem = {
    ...novo,
    id: `col-${novo.canteiroId}`,
  };
  const atualizados = [itemComId, ...semEsteCanteiro];
  salvarRegistrosColheita(atualizados);
  return atualizados;
}

export function removerRegistroColheita(id: string): RegistroColheitaItem[] {
  const atuais = carregarRegistrosColheita();
  const atualizados = atuais.filter((item) => item.id !== id);
  salvarRegistrosColheita(atualizados);
  return atualizados;
}
