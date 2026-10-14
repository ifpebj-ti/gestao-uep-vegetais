import { CANTEIROS_DATA, CanteiroData } from './horticulturaData';

export type TipoFaseFenologica =
  | 'semeadura'
  | 'mudas'
  | 'transplante'
  | 'vegetativo'
  | 'desenvolvimento'
  | 'floracao'
  | 'colheita'
  | 'pos_colheita'
  | 'descanso_solo';

export interface FaseSemanaInfo {
  fase: TipoFaseFenologica;
  label: string;
  sublabel?: string; // ex: "(45 kg)", "(80 kg)", "Dir."
  irrigacao: string;
  nutricao: string;
  tratosCulturais: string[];
  tarefasPraticas: { id: string; titulo: string; concluida: boolean }[];
  statusConclusao: 'concluido' | 'em_andamento' | 'pendente' | 'previsto';
  vistoProfessor?: boolean;
  observacaoProfessor?: string;
}

export interface SemanaHeader {
  numero: number;
  labelRelativa: string; // "Semana Anterior", "Semana Atual", "1ª Seg.", etc.
  rotuloFoto1: string;   // "Semana Anterior", "Semana Atual", "Primeira", "Segunda"...
  dataInicio: string;    // "14/10/2026"
  dataFim: string;       // "20/10/2026"
  isAtual: boolean;
}

export interface ModuloCanteiro {
  id: string;
  nome: string; // "Módulo 1", "Módulo 2", "Módulo 3"...
  descricao: string; // "Linha 1 - Semeio inicial", etc.
  fases: Record<number, FaseSemanaInfo>;
}

export interface CanteiroCronograma {
  id: string;
  codigo: string;
  cultura: string;
  lote: string;
  variedade: string;
  icone: 'folha' | 'cenoura' | 'rabanete' | 'couve' | 'abobrinha' | 'ervas' | 'solo';
  setor: string;
  setorBadge: string;
  dimensao: string;
  estudanteLider: string;
  turma: string;
  dataPlantio: string;
  previsaoColheita: string;
  modulos: ModuloCanteiro[];
  fasesGerais: Record<number, FaseSemanaInfo>;
}

// Semanas de referência alinhadas com o sistema (Outubro/Novembro 2026)
export const SEMANAS_CRONOGRAMA: SemanaHeader[] = [
  {
    numero: 41,
    labelRelativa: 'Semana Anterior',
    rotuloFoto1: 'Semana Anterior',
    dataInicio: '07/10/2026',
    dataFim: '13/10/2026',
    isAtual: false,
  },
  {
    numero: 42,
    labelRelativa: 'SEM 42 (ATUAL) HOJE',
    rotuloFoto1: 'Semana Atual',
    dataInicio: '14/10/2026',
    dataFim: '20/10/2026',
    isAtual: true,
  },
  {
    numero: 43,
    labelRelativa: 'SEM 43 (1ª Seg.)',
    rotuloFoto1: 'Primeira',
    dataInicio: '21/10/2026',
    dataFim: '27/10/2026',
    isAtual: false,
  },
  {
    numero: 44,
    labelRelativa: 'SEM 44 (2ª Seg.)',
    rotuloFoto1: 'Segunda',
    dataInicio: '28/10/2026',
    dataFim: '03/11/2026',
    isAtual: false,
  },
  {
    numero: 45,
    labelRelativa: 'SEM 45 (3ª Seg.)',
    rotuloFoto1: 'Terceira',
    dataInicio: '04/11/2026',
    dataFim: '10/11/2026',
    isAtual: false,
  },
  {
    numero: 46,
    labelRelativa: 'SEM 46 (4ª Seg.)',
    rotuloFoto1: 'Quarta',
    dataInicio: '11/11/2026',
    dataFim: '17/11/2026',
    isAtual: false,
  },
  {
    numero: 47,
    labelRelativa: 'SEM 47 (5ª Seg.)',
    rotuloFoto1: 'Quinta',
    dataInicio: '18/11/2026',
    dataFim: '24/11/2026',
    isAtual: false,
  },
  {
    numero: 48,
    labelRelativa: 'SEM 48 (6ª Seg.)',
    rotuloFoto1: 'Sexta',
    dataInicio: '25/11/2026',
    dataFim: '01/12/2026',
    isAtual: false,
  },
  {
    numero: 49,
    labelRelativa: 'SEM 49 (7ª Seg.)',
    rotuloFoto1: 'Sétima',
    dataInicio: '02/12/2026',
    dataFim: '08/12/2026',
    isAtual: false,
  },
];

// Helper para estilizar os badges das fases fenológicas conforme Foto 2
export const ESTILO_FASES: Record<
  TipoFaseFenologica,
  {
    bg: string;
    text: string;
    border: string;
    descricao: string;
    corDot: string;
  }
> = {
  colheita: {
    bg: 'bg-[#15532b]',
    text: 'text-white',
    border: 'border-[#124223]',
    descricao: 'Ponto Ideal de Colheita e Pesagem',
    corDot: '#15532b',
  },
  vegetativo: {
    bg: 'bg-emerald-100/90',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    descricao: 'Crescimento e Desenvolvimento Foliar',
    corDot: '#10b981',
  },
  desenvolvimento: {
    bg: 'bg-teal-100/90',
    text: 'text-teal-900',
    border: 'border-teal-300',
    descricao: 'Desenvolvimento Vegetativo Intermediário',
    corDot: '#14b8a6',
  },
  semeadura: {
    bg: 'bg-sky-100/90',
    text: 'text-sky-900',
    border: 'border-sky-300',
    descricao: 'Semeadura Direta / Bandejas',
    corDot: '#0284c7',
  },
  mudas: {
    bg: 'bg-amber-100/90',
    text: 'text-amber-900',
    border: 'border-amber-300',
    descricao: 'Mudas em Estufa / Aclimação',
    corDot: '#d97706',
  },
  transplante: {
    bg: 'bg-amber-100/90',
    text: 'text-amber-900',
    border: 'border-amber-300',
    descricao: 'Transplante para Canteiro Definitivo',
    corDot: '#f59e0b',
  },
  floracao: {
    bg: 'bg-indigo-100/90',
    text: 'text-indigo-900',
    border: 'border-indigo-300',
    descricao: 'Floração e Pegamento de Frutos',
    corDot: '#6366f1',
  },
  descanso_solo: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    descricao: 'Descanso de Solo / Rotação / Solarização',
    corDot: '#64748b',
  },
  pos_colheita: {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    descricao: 'Limpeza de Canteiro e Incorporação',
    corDot: '#78716c',
  },
};

// Base de dados dos cronogramas semanais dos alunos por canteiro
export const CRONOGRAMA_CANTEIROS: CanteiroCronograma[] = [
  {
    id: 'c-01',
    codigo: 'C01',
    cultura: 'Alface Crespa',
    lote: 'Lote 01',
    variedade: 'Grand Rapids BR',
    icone: 'folha',
    setor: 'Hortaliças Folhosas',
    setorBadge: 'Setor A',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Ana Beatriz Souza',
    turma: 'Agronomia 3º Período - Turma A',
    dataPlantio: '2026-08-22',
    previsaoColheita: '14/10/2026',
    fasesGerais: {
      41: {
        fase: 'vegetativo',
        label: 'Crescimento',
        irrigacao: 'Microaspersão (06:00 e 17:00, 15 min)',
        nutricao: 'Biofertilizante foliar diluído a 5%',
        tratosCulturais: ['Capina manual fina', 'Verificação de umidade'],
        tarefasPraticas: [
          { id: 't1', titulo: 'Conferir vazão dos microaspersores', concluida: true },
          { id: 't2', titulo: 'Monitorar lagartas foliares', concluida: true },
        ],
        statusConclusao: 'concluido',
        vistoProfessor: true,
        observacaoProfessor: 'Ótima expansão foliar e vigor vegetativo.',
      },
      42: {
        fase: 'colheita',
        label: 'Colheita (45 kg)',
        sublabel: '45 kg',
        irrigacao: 'Irrigação leve matinal para manter turgidez das folhas',
        nutricao: 'Sem adubação de cobertura pré-colheita',
        tratosCulturais: ['Corte na base rente ao solo com canivete higienizado', 'Lavagem e toalete das folhas'],
        tarefasPraticas: [
          { id: 't3', titulo: 'Pesagem oficial da colheita em kg', concluida: false },
          { id: 't4', titulo: 'Anotar peso fresco na Ficha de Campo', concluida: false },
          { id: 't5', titulo: 'Destinar 25 kg ao refeitório acadêmico', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Ponto ideal de corte atingido nesta quarta-feira.',
      },
      43: {
        fase: 'transplante',
        label: 'Transplante',
        irrigacao: 'Gotejamento contínuo nas primeiras 48h pós-plantio',
        nutricao: 'Adubação de cova com 100g de húmus de minhoca',
        tratosCulturais: ['Abertura de covas com espaçamento 25x25cm', 'Proteção inicial contra insolação excessiva'],
        tarefasPraticas: [
          { id: 't6', titulo: 'Transportar mudas da casa de vegetação', concluida: false },
          { id: 't7', titulo: 'Transplantar 120 mudas aclimatadas', concluida: false },
        ],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'desenvolvimento',
        label: 'Desenvolvimento',
        irrigacao: 'Pulsos diários às 06:00 e 17:00',
        nutricao: 'Aplicação de extrato de nim preventivo',
        tratosCulturais: ['Controle de plantas espontâneas', 'Revisão do pegamento das mudas'],
        tarefasPraticas: [{ id: 't8', titulo: 'Replante de eventuais falhas', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Microaspersão regulada',
        nutricao: 'Composto orgânico maturada (3kg/m²)',
        tratosCulturais: ['Capina manual e aeração superficial'],
        tarefasPraticas: [{ id: 't9', titulo: 'Inspeção de míldio e pulgões', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Microaspersão matinal',
        nutricao: 'Biofertilizante via fertirrigação',
        tratosCulturais: ['Monitoramento do fechamento das entrelinhas'],
        tarefasPraticas: [{ id: 't10', titulo: 'Medição biométrica de área foliar', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'colheita',
        label: 'Colheita (42 kg)',
        sublabel: '42 kg',
        irrigacao: 'Irrigação matinal pré-colheita',
        nutricao: 'Suspensão de defensivos orgânicos',
        tratosCulturais: ['Colheita antecipada nas primeiras horas do dia'],
        tarefasPraticas: [{ id: 't11', titulo: 'Pesagem oficial UEP', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'descanso_solo',
        label: 'Descanso Solo',
        irrigacao: 'Umedecimento leve para manter microbiota ativa',
        nutricao: 'Incorporação de composto e palhada',
        tratosCulturais: ['Afolhamento e descompactação', 'Mulching com capim seco'],
        tarefasPraticas: [{ id: 't12', titulo: 'Preparo para novo ciclo', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'semeadura',
        label: 'Novo Plantio',
        irrigacao: 'Irrigação diária frequente',
        nutricao: 'Composto orgânico na linha',
        tratosCulturais: ['Abertura de sulcos e semeio'],
        tarefasPraticas: [{ id: 't13', titulo: 'Semeadura da nova cultivar', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    // Divisão por módulos inspirada na Foto 1 (Horta Fácil)
    modulos: [
      {
        id: 'm-1',
        nome: 'Módulo 1',
        descricao: 'Linha Principal A (Lote colheita atual)',
        fases: {
          41: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'colheita', label: 'Colheita (45 kg)', irrigacao: 'Matinal leve', nutricao: 'Nenhuma', tratosCulturais: ['Corte de base'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Umedecimento', nutricao: 'Palhada', tratosCulturais: ['Afolhamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Húmus', tratosCulturais: ['Sulcamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'colheita', label: 'Colheita (42 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-2',
        nome: 'Módulo 2',
        descricao: 'Linha Secundária B (Plantio escalonado +7 dias)',
        fases: {
          41: { fase: 'vegetativo', label: 'Vegetativo', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'colheita', label: 'Colheita (36 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Leve', nutricao: 'Composto', tratosCulturais: ['Afolhamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Covas'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'colheita', label: 'Colheita (40 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Mulching', tratosCulturais: ['Cobertura'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-3',
        nome: 'Módulo 3',
        descricao: 'Linha C (Berçário de reposição / Mudas)',
        fases: {
          41: { fase: 'mudas', label: 'Mudas Estufa', irrigacao: 'Aspersão leve', nutricao: 'Substrato orgânico', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'transplante', label: 'Aclimação Mudas', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante 2%', tratosCulturais: ['Endurecimento'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Plantio definitivo'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'colheita', label: 'Colheita (32 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-4',
        nome: 'Módulo 4',
        descricao: 'Linha D (Faixa de consórcio ou cobertura vegetal)',
        fases: {
          41: { fase: 'descanso_solo', label: 'Cobertura Morta', irrigacao: 'Umedecimento', nutricao: 'Palhada de capim', tratosCulturais: ['Espalhamento'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'descanso_solo', label: 'Solarização', irrigacao: 'Sob lona plástica', nutricao: 'Nenhuma', tratosCulturais: ['Vedação'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Regas leves', nutricao: 'Composto 3kg/m²', tratosCulturais: ['Enxadão'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'descanso_solo', label: 'Liberação Canteiro', irrigacao: 'Ajuste de pH', nutricao: 'Cinzas de madeira', tratosCulturais: ['Canteamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'semeadura', label: 'Novo Plantio', irrigacao: 'Frequente', nutricao: 'Biofertilizante', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'colheita', label: 'Colheita (40 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-02',
    codigo: 'C02',
    cultura: 'Alface Americana',
    lote: 'Lote 02',
    variedade: 'Lucy Brown',
    icone: 'folha',
    setor: 'Hortaliças Folhosas',
    setorBadge: 'Setor A',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Lucas Gabriel Lima',
    turma: 'Agronomia 3º Período - Turma A',
    dataPlantio: '2026-09-05',
    previsaoColheita: '28/10/2026',
    fasesGerais: {
      41: {
        fase: 'transplante',
        label: 'Transplante',
        irrigacao: 'Gotejamento de precisão',
        nutricao: 'Composto orgânico na cova',
        tratosCulturais: ['Espaçamento 30x30cm'],
        tarefasPraticas: [{ id: 't14', titulo: 'Transplante com torrão úmido', concluida: true }],
        statusConclusao: 'concluido',
        vistoProfessor: true,
      },
      42: {
        fase: 'vegetativo',
        label: 'Vegetativo (Sem 3)',
        sublabel: 'Semana 3',
        irrigacao: 'Gotejamento de precisão diário',
        nutricao: 'Biofertilizante foliar quinzenal',
        tratosCulturais: ['Capina manual entre linhas', 'Calda bordalesa preventiva'],
        tarefasPraticas: [
          { id: 't15', titulo: 'Medir umidade do solo na faixa de 75%', concluida: true },
          { id: 't16', titulo: 'Aplicação preventiva de nim', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Formação de cabeça densa e uniforme.',
      },
      43: {
        fase: 'desenvolvimento',
        label: 'Formação Cabeça',
        irrigacao: 'Vazão moderada no colo',
        nutricao: 'Bokashi líquido',
        tratosCulturais: ['Evitar molhar diretamente as cabeças'],
        tarefasPraticas: [{ id: 't17', titulo: 'Monitorar queima de borda foliar', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'colheita',
        label: 'Colheita (32 kg)',
        sublabel: '32 kg',
        irrigacao: 'Interromper 12h antes da colheita',
        nutricao: 'Sem aplicação química',
        tratosCulturais: ['Seleção de cabeças compactas'],
        tarefasPraticas: [{ id: 't18', titulo: 'Colheita e pesagem para aula prática', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'descanso_solo',
        label: 'Descanso Solo',
        irrigacao: 'Leve para manter umidade residual',
        nutricao: 'Composto orgânico maturada (3kg/m²)',
        tratosCulturais: ['Incorporação e cobertura com capim'],
        tarefasPraticas: [{ id: 't19', titulo: 'Aeração do solo com garfo', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'semeadura',
        label: 'Semeadura',
        irrigacao: 'Frequente 3x ao dia',
        nutricao: 'Húmus de minhoca',
        tratosCulturais: ['Semeio em bandejas de 128 células'],
        tarefasPraticas: [{ id: 't20', titulo: 'Identificação de bandejas na estufa', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'mudas',
        label: 'Mudas Estufa',
        irrigacao: 'Nebulização controlada',
        nutricao: 'Extrato de algas',
        tratosCulturais: ['Desbaste de 1 plântula por célula'],
        tarefasPraticas: [{ id: 't21', titulo: 'Controle de damping-off', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'transplante',
        label: 'Transplante',
        irrigacao: 'Gotejamento contínuo',
        nutricao: 'Composto na cova',
        tratosCulturais: ['Plantio no final da tarde'],
        tarefasPraticas: [{ id: 't22', titulo: 'Transplante de 120 mudas', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Gotejamento',
        nutricao: 'Biofertilizante',
        tratosCulturais: ['Capina fina'],
        tarefasPraticas: [{ id: 't23', titulo: 'Inspeção de viroses', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-21',
        nome: 'Módulo 1',
        descricao: 'Linha A - Cultivo principal',
        fases: {
          41: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Composto', tratosCulturais: ['Plantio'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'vegetativo', label: 'Vegetativo (Sem 3)', irrigacao: 'Gotejamento', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'desenvolvimento', label: 'Formação Cabeça', irrigacao: 'Gotejamento', nutricao: 'Bokashi', tratosCulturais: ['Monitoramento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'colheita', label: 'Colheita (32 kg)', irrigacao: 'Leve', nutricao: 'Nenhuma', tratosCulturais: ['Colheita'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Residual', nutricao: 'Composto', tratosCulturais: ['Cobertura'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Húmus', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'mudas', label: 'Mudas Estufa', irrigacao: 'Nebulização', nutricao: 'Algas', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Composto', tratosCulturais: ['Plantio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Gotejamento', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-22',
        nome: 'Módulo 2',
        descricao: 'Linha B - Sucessão de cabeças',
        fases: {
          41: { fase: 'mudas', label: 'Mudas Estufa', irrigacao: 'Nebulização', nutricao: 'Substrato', tratosCulturais: ['Estufa'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Covas'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'vegetativo', label: 'Vegetativo', irrigacao: 'Gotejamento', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'desenvolvimento', label: 'Formação Cabeça', irrigacao: 'Gotejamento', nutricao: 'Bokashi', tratosCulturais: ['Revisão'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'colheita', label: 'Colheita (35 kg)', irrigacao: 'Leve', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Residual', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Composto', tratosCulturais: ['Plantio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Gotejamento', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'desenvolvimento', label: 'Formação Cabeça', irrigacao: 'Gotejamento', nutricao: 'Bokashi', tratosCulturais: ['Monitoramento'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-03',
    codigo: 'C03',
    cultura: 'Rabanete Redondo',
    lote: 'Lote 05',
    variedade: 'Crimson Giant',
    icone: 'rabanete',
    setor: 'Raízes e Tubérculos',
    setorBadge: 'Setor B',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Mariana Duarte',
    turma: 'Técnico Agropecuária - 2º Módulo',
    dataPlantio: '2026-09-18',
    previsaoColheita: '14/10/2026',
    fasesGerais: {
      41: {
        fase: 'desenvolvimento',
        label: 'Engrossamento',
        irrigacao: 'Microaspersão fina 2x ao dia',
        nutricao: 'Cinzas ricas em potássio',
        tratosCulturais: ['Raleio para espaçamento de 10cm'],
        tarefasPraticas: [{ id: 't24', titulo: 'Raleio e desbaste entre plantas', concluida: true }],
        statusConclusao: 'concluido',
        vistoProfessor: true,
      },
      42: {
        fase: 'colheita',
        label: 'Colheita (25 kg)',
        sublabel: '25 kg',
        irrigacao: 'Umedecimento matinal para facilitar arranque manual',
        nutricao: 'Sem fertilizantes',
        tratosCulturais: ['Arranque cuidadoso preservando folhas e raízes', 'Higienização e pesagem em kg'],
        tarefasPraticas: [
          { id: 't25', titulo: 'Colheita dos bulbos com mais de 3cm', concluida: false },
          { id: 't26', titulo: 'Lavagem em tanque de higienização', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Bulbos com excelente turgidez e sem rachaduras.',
      },
      43: {
        fase: 'semeadura',
        label: 'Semeadura Dir.',
        irrigacao: 'Aspersão leve 3x/dia',
        nutricao: 'Composto leve 2kg/m²',
        tratosCulturais: ['Semeadura direta em sulcos de 1cm'],
        tarefasPraticas: [{ id: 't27', titulo: 'Semeadura da 2ª sucessão', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'desenvolvimento',
        label: 'Desbaste',
        irrigacao: 'Microaspersão',
        nutricao: 'Bokashi líquido diluído',
        tratosCulturais: ['Desbaste de plântulas excedentes'],
        tarefasPraticas: [{ id: 't28', titulo: 'Ajustar espaçamento para 10cm', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'colheita',
        label: 'Colheita (25 kg)',
        sublabel: '25 kg',
        irrigacao: 'Arranque com solo úmido',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Colheita e pesagem'],
        tarefasPraticas: [{ id: 't29', titulo: 'Pesagem oficial UEP', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'descanso_solo',
        label: 'Descanso Solo',
        irrigacao: 'Leve',
        nutricao: 'Palhada de milho',
        tratosCulturais: ['Afolhamento'],
        tarefasPraticas: [{ id: 't30', titulo: 'Rotação de cultura', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'semeadura',
        label: 'Semeadura Dir.',
        irrigacao: 'Aspersão',
        nutricao: 'Húmus',
        tratosCulturais: ['Sulcamento'],
        tarefasPraticas: [{ id: 't31', titulo: 'Semeio de rúcula em rotação', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Microaspersão',
        nutricao: 'Biofertilizante',
        tratosCulturais: ['Capina'],
        tarefasPraticas: [{ id: 't32', titulo: 'Monitoramento', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'colheita',
        label: 'Colheita (22 kg)',
        sublabel: '22 kg',
        irrigacao: 'Matinal',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Colheita'],
        tarefasPraticas: [{ id: 't33', titulo: 'Colheita da rotação', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-31',
        nome: 'Módulo 1',
        descricao: 'Faixa Norte (Colheita atual)',
        fases: {
          41: { fase: 'desenvolvimento', label: 'Engrossamento', irrigacao: 'Microaspersão', nutricao: 'Cinzas', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'colheita', label: 'Colheita (25 kg)', irrigacao: 'Arranque', nutricao: 'Nenhuma', tratosCulturais: ['Amarrio'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'semeadura', label: 'Semeadura Dir.', irrigacao: 'Aspersão', nutricao: 'Composto', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'desenvolvimento', label: 'Desbaste', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'colheita', label: 'Colheita (25 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Arranque'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'semeadura', label: 'Semeadura Dir.', irrigacao: 'Frequente', nutricao: 'Húmus', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'colheita', label: 'Colheita (22 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-06',
    codigo: 'C06',
    cultura: 'Couve Manteiga',
    lote: 'Lote Perene',
    variedade: 'Da Geórgia',
    icone: 'couve',
    setor: 'Hortaliças Folhosas',
    setorBadge: 'Setor C',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Guilherme Rocha',
    turma: 'Técnico Agropecuária - 1º Módulo',
    dataPlantio: '2026-07-28',
    previsaoColheita: 'Contínua',
    fasesGerais: {
      41: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão direcionada ao colo',
        nutricao: 'Composto quinzenal (1kg/planta)',
        tratosCulturais: ['Desbaste de folhas basais senescentes'],
        tarefasPraticas: [{ id: 't34', titulo: 'Colheita de 30 kg de folhas basais', concluida: true }],
        statusConclusao: 'concluido',
        vistoProfessor: true,
      },
      42: {
        fase: 'colheita',
        label: 'Colheita (45 kg)',
        sublabel: '45 kg',
        irrigacao: 'Pulsos às 06:00 e 17:00',
        nutricao: 'Aplicação foliar de biofertilizante após o corte',
        tratosCulturais: ['Colheita de 3 a 5 folhas por planta mantendo o broto apical', 'Inspeção de lagartas e pulgões'],
        tarefasPraticas: [
          { id: 't35', titulo: 'Corte das folhas com mais de 25cm', concluida: false },
          { id: 't36', titulo: 'Acondicionamento em caixas de 5 kg', concluida: false },
          { id: 't37', titulo: 'Aplicação de extrato de nim nas pontas', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Excelente pegamento do lote perene e folhas sem ataque de pragas.',
      },
      43: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão',
        nutricao: 'Bokashi líquido',
        tratosCulturais: ['Brotação foliar ativa'],
        tarefasPraticas: [{ id: 't38', titulo: 'Corte semanal rotativo', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão',
        nutricao: 'Composto na base',
        tratosCulturais: ['Amontoa de terra no colo'],
        tarefasPraticas: [{ id: 't39', titulo: 'Corte semanal programado', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão',
        nutricao: 'Biofertilizante',
        tratosCulturais: ['Tutoriamento se necessário'],
        tarefasPraticas: [{ id: 't40', titulo: 'Corte semanal UEP', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão',
        nutricao: 'Adubação verde entrelinhas',
        tratosCulturais: ['Capina'],
        tarefasPraticas: [{ id: 't41', titulo: 'Corte semanal', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'colheita',
        label: 'Colheita (48 kg)',
        sublabel: '48 kg',
        irrigacao: 'Normal',
        nutricao: 'Nenhuma pré-corte',
        tratosCulturais: ['Corte intensificado para o campus'],
        tarefasPraticas: [{ id: 't42', titulo: 'Colheita em massa', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão',
        nutricao: 'Composto orgânico',
        tratosCulturais: ['Poda de limpeza'],
        tarefasPraticas: [{ id: 't43', titulo: 'Corte semanal', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'vegetativo',
        label: 'Corte Semanal',
        irrigacao: 'Microaspersão',
        nutricao: 'Biofertilizante',
        tratosCulturais: ['Monitoramento biológico'],
        tarefasPraticas: [{ id: 't44', titulo: 'Corte semanal', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-61',
        nome: 'Módulo 1',
        descricao: 'Linha Principal (Corte semanal perene)',
        fases: {
          41: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'colheita', label: 'Colheita (45 kg)', irrigacao: 'Microaspersão', nutricao: 'Nim', tratosCulturais: ['Toalete'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Brotação'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Amontoa'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'colheita', label: 'Colheita (48 kg)', irrigacao: 'Microaspersão', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Poda'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'vegetativo', label: 'Corte Semanal', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Revisão'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-04',
    codigo: 'C04',
    cultura: 'Solarização / Calagem',
    lote: 'Repouso de Solo',
    variedade: 'Preparo p/ Cenoura Brasília',
    icone: 'solo',
    setor: 'Manejo de Solos',
    setorBadge: 'Setor B',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Felipe Menezes',
    turma: 'Agronomia 5º Período - Olericultura',
    dataPlantio: '2026-08-15',
    previsaoColheita: 'Novo Plantio em Nov/2026',
    fasesGerais: {
      41: {
        fase: 'descanso_solo',
        label: 'Solarização',
        irrigacao: 'Irrigação pesada pré-enlonamento térmico',
        nutricao: 'Incorporação de palhada e esterco curtido',
        tratosCulturais: ['Lona transparente de polietileno de 100 micras com bordas enterradas'],
        tarefasPraticas: [{ id: 't45', titulo: 'Conferir vedação da lona contra vento', concluida: true }],
        statusConclusao: 'concluido',
        vistoProfessor: true,
      },
      42: {
        fase: 'descanso_solo',
        label: 'Incorporação',
        sublabel: 'Adubação',
        irrigacao: 'Retirada da lona e aeração por 48 horas',
        nutricao: 'Aplicação de calcário dolomítico (PRNT 85%) a 200g/m² + esterco de caprinos',
        tratosCulturais: ['Afolhamento profundo com enxada rotativa manual', 'Nivelamento do topo do canteiro'],
        tarefasPraticas: [
          { id: 't46', titulo: 'Retirar lona plástica e estocar para reuso', concluida: false },
          { id: 't47', titulo: 'Incorporar 2kg/m² de composto orgânico', concluida: false },
          { id: 't48', titulo: 'Medir pH do solo pós-calagem (alvo: 6.2 - 6.8)', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Solo com excelente agregação após o período de solarização.',
      },
      43: {
        fase: 'descanso_solo',
        label: 'Liberação C-04',
        irrigacao: 'Umedecimento superficial',
        nutricao: 'Cinzas de madeira peneiradas',
        tratosCulturais: ['Descanso de 5 dias após incorporação'],
        tarefasPraticas: [{ id: 't49', titulo: 'Alinhamento com fita métrica', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'semeadura',
        label: 'Novo Plantio',
        irrigacao: 'Gotejamento superficial',
        nutricao: 'Húmus de minhoca no sulco',
        tratosCulturais: ['Semeadura direta de cenoura Brasília'],
        tarefasPraticas: [{ id: 't50', titulo: 'Semeadura em 4 linhas paralelas', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'vegetativo',
        label: 'Crescimento',
        irrigacao: 'Irrigação diária controlada',
        nutricao: 'Biofertilizante líquido',
        tratosCulturais: ['Desbaste inicial'],
        tarefasPraticas: [{ id: 't51', titulo: 'Raleio para 5cm entre plantas', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'desenvolvimento',
        label: 'Desenvolvimento',
        irrigacao: 'Gotejamento',
        nutricao: 'Composto orgânico na entrelinha',
        tratosCulturais: ['Amontoa para proteger ombros da raiz'],
        tarefasPraticas: [{ id: 't52', titulo: 'Capina manual fina', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'desenvolvimento',
        label: 'Desenvolvimento',
        irrigacao: 'Gotejamento',
        nutricao: 'Extrato de nim preventivo',
        tratosCulturais: ['Monitoramento de queima-das-folhas'],
        tarefasPraticas: [{ id: 't53', titulo: 'Inspeção fitossanitária', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'desenvolvimento',
        label: 'Engrossamento',
        irrigacao: 'Gotejamento calibrado',
        nutricao: 'Cinzas ricas em potássio',
        tratosCulturais: ['Amontoa secundária'],
        tarefasPraticas: [{ id: 't54', titulo: 'Verificação biométrica de raízes', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'colheita',
        label: 'Colheita (90 kg)',
        sublabel: '90 kg',
        irrigacao: 'Irrigação pré-arranque',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Arranque manual com garfo'],
        tarefasPraticas: [{ id: 't55', titulo: 'Pesagem e toalete de raízes', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-41',
        nome: 'Módulo 1',
        descricao: 'Canteiro Integral (Preparo profundo e Calagem)',
        fases: {
          41: { fase: 'descanso_solo', label: 'Solarização', irrigacao: 'Pesada', nutricao: 'Palhada', tratosCulturais: ['Lona'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Aeração', nutricao: 'Calcário', tratosCulturais: ['Enxadão'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'descanso_solo', label: 'Liberação C-04', irrigacao: 'Leve', nutricao: 'Cinzas', tratosCulturais: ['Alinhamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'semeadura', label: 'Novo Plantio', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Gotejamento', nutricao: 'Biofertilizante', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'desenvolvimento', label: 'Desenvolvimento', irrigacao: 'Gotejamento', nutricao: 'Composto', tratosCulturais: ['Amontoa'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'desenvolvimento', label: 'Desenvolvimento', irrigacao: 'Gotejamento', nutricao: 'Nim', tratosCulturais: ['Inspeção'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'desenvolvimento', label: 'Engrossamento', irrigacao: 'Gotejamento', nutricao: 'Cinzas', tratosCulturais: ['Amontoa'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'colheita', label: 'Colheita (90 kg)', irrigacao: 'Arranque', nutricao: 'Nenhuma', tratosCulturais: ['Pesagem'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-05',
    codigo: 'C05',
    cultura: 'Beterraba Vermelha',
    lote: 'Lote 03',
    variedade: 'Early Wonder',
    icone: 'rabanete',
    setor: 'Raízes e Tubérculos',
    setorBadge: 'Setor B',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Camila Peixoto',
    turma: 'Agronomia 5º Período - Olericultura',
    dataPlantio: '2026-08-20',
    previsaoColheita: '04/11/2026',
    fasesGerais: {
      41: {
        fase: 'desenvolvimento',
        label: 'Desenvolvimento',
        irrigacao: 'Gotejamento superficial',
        nutricao: 'Esterco caprino curtido + cinzas',
        tratosCulturais: ['Capina manual entre fileiras'],
        tarefasPraticas: [{ id: 't56', titulo: 'Raleio e manutenção de umidade', concluida: true }],
        statusConclusao: 'concluido',
        vistoProfessor: true,
      },
      42: {
        fase: 'desenvolvimento',
        label: 'Engrossamento',
        sublabel: 'Bulbos 4cm',
        irrigacao: 'Gotejamento regular vespertino',
        nutricao: 'Biofertilizante rico em potássio e boro',
        tratosCulturais: ['Desbaste de plantas geminadas', 'Cobertura leve no colo do bulbo'],
        tarefasPraticas: [
          { id: 't57', titulo: 'Medir diâmetro médio dos bulbos (alvo 4cm)', concluida: false },
          { id: 't58', titulo: 'Aplicação preventiva de bioestimulante', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Folhagem arroxeada e sadia.',
      },
      43: {
        fase: 'desenvolvimento',
        label: 'Engrossamento Final',
        irrigacao: 'Gotejamento calibrado',
        nutricao: 'Cinzas de madeira',
        tratosCulturais: ['Amontoa suave'],
        tarefasPraticas: [{ id: 't59', titulo: 'Acompanhar expansão do bulbo', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'colheita',
        label: 'Colheita (70 kg)',
        sublabel: '70 kg',
        irrigacao: 'Arranque com solo fresco',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Arranque manual com toalete'],
        tarefasPraticas: [{ id: 't60', titulo: 'Colheita para aula prática', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'descanso_solo',
        label: 'Descanso Solo',
        irrigacao: 'Residual',
        nutricao: 'Composto orgânico maturada (3kg/m²)',
        tratosCulturais: ['Mulching protetor'],
        tarefasPraticas: [{ id: 't61', titulo: 'Preparo para novo ciclo', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'semeadura',
        label: 'Semeadura Dir.',
        irrigacao: 'Aspersão diária',
        nutricao: 'Húmus no sulco',
        tratosCulturais: ['Semeadura direta'],
        tarefasPraticas: [{ id: 't62', titulo: 'Semeio de novo lote', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'vegetativo',
        label: 'Crescimento',
        irrigacao: 'Microaspersão',
        nutricao: 'Biofertilizante',
        tratosCulturais: ['Raleio'],
        tarefasPraticas: [{ id: 't63', titulo: 'Desbaste inicial', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Gotejamento',
        nutricao: 'Composto',
        tratosCulturais: ['Capina'],
        tarefasPraticas: [{ id: 't64', titulo: 'Monitoramento foliar', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'desenvolvimento',
        label: 'Engrossamento',
        irrigacao: 'Gotejamento',
        nutricao: 'Cinzas',
        tratosCulturais: ['Amontoa'],
        tarefasPraticas: [{ id: 't65', titulo: 'Acompanhamento biométrico', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-51',
        nome: 'Módulo 1',
        descricao: 'Linha A (Early Wonder)',
        fases: {
          41: { fase: 'desenvolvimento', label: 'Desenvolvimento', irrigacao: 'Gotejamento', nutricao: 'Esterco', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'desenvolvimento', label: 'Engrossamento', irrigacao: 'Gotejamento', nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'desenvolvimento', label: 'Engrossamento Final', irrigacao: 'Gotejamento', nutricao: 'Cinzas', tratosCulturais: ['Amontoa'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'colheita', label: 'Colheita (70 kg)', irrigacao: 'Leve', nutricao: 'Nenhuma', tratosCulturais: ['Arranque'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Residual', nutricao: 'Composto', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'semeadura', label: 'Semeadura Dir.', irrigacao: 'Aspersão', nutricao: 'Húmus', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Gotejamento', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'desenvolvimento', label: 'Engrossamento', irrigacao: 'Gotejamento', nutricao: 'Cinzas', tratosCulturais: ['Amontoa'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-07',
    codigo: 'C07',
    cultura: 'Coentro Verdão',
    lote: 'Lote 04',
    variedade: 'Verdão Sel. IFPE',
    icone: 'ervas',
    setor: 'Condimentares e Folhosas',
    setorBadge: 'Setor C',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Letícia Barbosa',
    turma: 'Agronomia 3º Período - Turma B',
    dataPlantio: '2026-09-01',
    previsaoColheita: '14/10/2026',
    fasesGerais: {
      41: {
        fase: 'vegetativo',
        label: 'Crescimento',
        irrigacao: 'Microaspersão suave 2x ao dia',
        nutricao: 'Composto leve + bokashi líquido',
        tratosCulturais: ['Capina manual e aeração'],
        tarefasPraticas: [{ id: 't66', titulo: 'Verificação de porte e aroma', concluida: true }],
        statusConclusao: 'concluido',
        vistoProfessor: true,
      },
      42: {
        fase: 'colheita',
        label: 'Colheita (36 kg)',
        sublabel: '36 kg',
        irrigacao: 'Irrigação matinal pré-colheita',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Arranque das plantas com raiz e toalete em água corrente'],
        tarefasPraticas: [
          { id: 't67', titulo: 'Colheita e pesagem em kg para distribuição', concluida: false },
          { id: 't68', titulo: 'Higienização e embalagem', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Coloração verde escura impecável, sem queima apical.',
      },
      43: {
        fase: 'descanso_solo',
        label: 'Preparo Solo',
        irrigacao: 'Umedecimento',
        nutricao: 'Composto orgânico 2kg/m²',
        tratosCulturais: ['Descompactação superficial'],
        tarefasPraticas: [{ id: 't69', titulo: 'Preparo de novos sulcos', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'semeadura',
        label: 'Semeadura Dir.',
        irrigacao: 'Aspersão fina',
        nutricao: 'Húmus',
        tratosCulturais: ['Semeio em sulcos espaçados de 15cm'],
        tarefasPraticas: [{ id: 't70', titulo: 'Semeadura escalonada', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'vegetativo',
        label: 'Crescimento',
        irrigacao: 'Microaspersão',
        nutricao: 'Biofertilizante foliar',
        tratosCulturais: ['Capina fina'],
        tarefasPraticas: [{ id: 't71', titulo: 'Acompanhamento de brotação', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Microaspersão',
        nutricao: 'Composto leve',
        tratosCulturais: ['Desbaste'],
        tarefasPraticas: [{ id: 't72', titulo: 'Aeração entrelinhas', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'colheita',
        label: 'Colheita (38 kg)',
        sublabel: '38 kg',
        irrigacao: 'Matinal',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Colheita e pesagem'],
        tarefasPraticas: [{ id: 't73', titulo: 'Colheita do 2º lote', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'descanso_solo',
        label: 'Descanso Solo',
        irrigacao: 'Leve',
        nutricao: 'Palhada',
        tratosCulturais: ['Mulching'],
        tarefasPraticas: [{ id: 't74', titulo: 'Cobertura com capim', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'semeadura',
        label: 'Semeadura Dir.',
        irrigacao: 'Aspersão',
        nutricao: 'Composto',
        tratosCulturais: ['Semeio'],
        tarefasPraticas: [{ id: 't75', titulo: 'Semeadura da 3ª rotação', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-71',
        nome: 'Módulo 1',
        descricao: 'Linha A (Verdão Sel. IFPE)',
        fases: {
          41: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'colheita', label: 'Colheita (36 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Arranque'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'descanso_solo', label: 'Preparo Solo', irrigacao: 'Umedecimento', nutricao: 'Composto', tratosCulturais: ['Descompactação'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'semeadura', label: 'Semeadura Dir.', irrigacao: 'Aspersão', nutricao: 'Húmus', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'colheita', label: 'Colheita (38 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Pesagem'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'semeadura', label: 'Semeadura Dir.', irrigacao: 'Aspersão', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
  {
    id: 'c-18',
    codigo: 'C18',
    cultura: 'Alface Roxa',
    lote: 'Lote 02',
    variedade: 'Quatro Estações Rubi',
    icone: 'folha',
    setor: 'Hortaliças Folhosas',
    setorBadge: 'Setor A',
    dimensao: '1,20m x 6,00m (7.2 m²)',
    estudanteLider: 'Daniela Gusmão',
    turma: 'Técnico Agropecuária - 1º Módulo',
    dataPlantio: '2026-08-24',
    previsaoColheita: '14/10/2026',
    fasesGerais: {
      41: {
        fase: 'vegetativo',
        label: 'Crescimento',
        irrigacao: 'Microaspersão matinal (06:00 e 17:00)',
        nutricao: 'Húmus de minhoca (2.5kg/m²)',
        tratosCulturais: ['Capina manual e aeração superficial'],
        tarefasPraticas: [
          { id: 't18-1', titulo: 'Conferir vazão dos microaspersores', concluida: true },
          { id: 't18-2', titulo: 'Monitoramento de antocianina e vigor foliar', concluida: true },
        ],
        statusConclusao: 'concluido',
        vistoProfessor: true,
        observacaoProfessor: 'Excelente pigmentação antociânica rica e formação de folhas tenras.',
      },
      42: {
        fase: 'colheita',
        label: 'Colheita (42 kg)',
        sublabel: '42 kg',
        irrigacao: 'Irrigação matinal leve antes do corte',
        nutricao: 'Sem fertilizantes pré-colheita',
        tratosCulturais: ['Corte na base preservando integridade das folhas', 'Lavagem e toalete no galpão'],
        tarefasPraticas: [
          { id: 't18-3', titulo: 'Colheita e pesagem inicial em kg', concluida: false },
          { id: 't18-4', titulo: 'Higienização e embalagem no galpão da UEP', concluida: false },
          { id: 't18-5', titulo: 'Registro oficial do peso na Ficha de Campo', concluida: false },
        ],
        statusConclusao: 'em_andamento',
        vistoProfessor: false,
        observacaoProfessor: 'Ponto ideal de colheita alcançado com 36 dias de ciclo.',
      },
      43: {
        fase: 'transplante',
        label: 'Transplante',
        irrigacao: 'Gotejamento contínuo nas primeiras 48h',
        nutricao: 'Adubação de cova com húmus de minhoca',
        tratosCulturais: ['Abertura de covas com espaçamento 25x25cm'],
        tarefasPraticas: [{ id: 't18-6', titulo: 'Transplante de 120 mudas da estufa', concluida: false }],
        statusConclusao: 'previsto',
      },
      44: {
        fase: 'desenvolvimento',
        label: 'Desenvolvimento',
        irrigacao: 'Pulsos diários às 06:00 e 17:00',
        nutricao: 'Extrato de nim preventivo',
        tratosCulturais: ['Controle de plantas espontâneas'],
        tarefasPraticas: [{ id: 't18-7', titulo: 'Replante de falhas eventuais', concluida: false }],
        statusConclusao: 'previsto',
      },
      45: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Microaspersão regulada',
        nutricao: 'Composto orgânico na entrelinha',
        tratosCulturais: ['Aeração manual'],
        tarefasPraticas: [{ id: 't18-8', titulo: 'Inspeção fitossanitária de rotina', concluida: false }],
        statusConclusao: 'previsto',
      },
      46: {
        fase: 'vegetativo',
        label: 'Desenvolvimento',
        irrigacao: 'Microaspersão',
        nutricao: 'Biofertilizante foliar diluído a 5%',
        tratosCulturais: ['Capina fina'],
        tarefasPraticas: [{ id: 't18-9', titulo: 'Medição biométrica de porte foliar', concluida: false }],
        statusConclusao: 'previsto',
      },
      47: {
        fase: 'colheita',
        label: 'Colheita (40 kg)',
        sublabel: '40 kg',
        irrigacao: 'Matinal pré-colheita',
        nutricao: 'Nenhuma',
        tratosCulturais: ['Corte e embalagem'],
        tarefasPraticas: [{ id: 't18-10', titulo: 'Colheita da 2ª sucessão', concluida: false }],
        statusConclusao: 'previsto',
      },
      48: {
        fase: 'descanso_solo',
        label: 'Descanso Solo',
        irrigacao: 'Leve',
        nutricao: 'Palhada de capim',
        tratosCulturais: ['Mulching protetor e descompactação'],
        tarefasPraticas: [{ id: 't18-11', titulo: 'Preparo para novo ciclo', concluida: false }],
        statusConclusao: 'previsto',
      },
      49: {
        fase: 'semeadura',
        label: 'Semeadura',
        irrigacao: 'Frequente',
        nutricao: 'Composto orgânico',
        tratosCulturais: ['Abertura de sulcos'],
        tarefasPraticas: [{ id: 't18-12', titulo: 'Novo plantio em rotação', concluida: false }],
        statusConclusao: 'previsto',
      },
    },
    modulos: [
      {
        id: 'm-181',
        nome: 'Módulo 1',
        descricao: 'Linha Principal A (Lote colheita atual)',
        fases: {
          41: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Húmus', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'colheita', label: 'Colheita (42 kg)', irrigacao: 'Matinal leve', nutricao: 'Nenhuma', tratosCulturais: ['Corte na base'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Umedecimento', nutricao: 'Palhada', tratosCulturais: ['Afolhamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Húmus', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'colheita', label: 'Colheita (40 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-182',
        nome: 'Módulo 2',
        descricao: 'Linha Secundária B (Plantio escalonado +7 dias)',
        fases: {
          41: { fase: 'vegetativo', label: 'Vegetativo', irrigacao: 'Microaspersão', nutricao: 'Húmus', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'colheita', label: 'Colheita (36 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Leve', nutricao: 'Composto', tratosCulturais: ['Afolhamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Covas'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'colheita', label: 'Colheita (38 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Mulching', tratosCulturais: ['Cobertura'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-183',
        nome: 'Módulo 3',
        descricao: 'Linha C (Berçário de reposição / Mudas)',
        fases: {
          41: { fase: 'mudas', label: 'Mudas Estufa', irrigacao: 'Nebulização', nutricao: 'Substrato orgânico', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'transplante', label: 'Aclimação Mudas', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante 2%', tratosCulturais: ['Aclimação'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Plantio definitivo'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'colheita', label: 'Colheita (32 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
      {
        id: 'm-184',
        nome: 'Módulo 4',
        descricao: 'Linha D (Faixa de consórcio ou cobertura vegetal)',
        fases: {
          41: { fase: 'descanso_solo', label: 'Cobertura Morta', irrigacao: 'Umedecimento', nutricao: 'Palhada de capim', tratosCulturais: ['Espalhamento'], tarefasPraticas: [], statusConclusao: 'concluido' },
          42: { fase: 'descanso_solo', label: 'Solarização', irrigacao: 'Sob lona plástica', nutricao: 'Nenhuma', tratosCulturais: ['Vedação'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
          43: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Regas leves', nutricao: 'Composto 3kg/m²', tratosCulturais: ['Enxadão'], tarefasPraticas: [], statusConclusao: 'previsto' },
          44: { fase: 'descanso_solo', label: 'Liberação Canteiro', irrigacao: 'Ajuste de pH', nutricao: 'Cinzas de madeira', tratosCulturais: ['Canteamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
          45: { fase: 'semeadura', label: 'Novo Plantio', irrigacao: 'Frequente', nutricao: 'Biofertilizante', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
          46: { fase: 'vegetativo', label: 'Crescimento', irrigacao: 'Microaspersão', nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
          47: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Bokashi', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
          48: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: 'Microaspersão', nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
          49: { fase: 'colheita', label: 'Colheita (36 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
        },
      },
    ],
  },
];

// Gerador dinâmico de cronograma para qualquer canteiro de CANTEIROS_DATA
export const gerarCronogramaParaCanteiro = (canteiro: CanteiroData): CanteiroCronograma => {
  const isProntoColheita = canteiro.status === 'pronto_colheita';
  const isEmCrescimento = canteiro.status === 'em_crescimento';
  const isRecemPlantado = canteiro.status === 'recem_plantado';

  let icone: CanteiroCronograma['icone'] = 'folha';
  const cultLower = canteiro.cultura.toLowerCase();
  if (cultLower.includes('cenoura')) icone = 'cenoura';
  else if (cultLower.includes('rabanete') || cultLower.includes('beterraba')) icone = 'rabanete';
  else if (cultLower.includes('couve')) icone = 'couve';
  else if (cultLower.includes('coentro') || cultLower.includes('cebolinha') || cultLower.includes('salsa')) icone = 'ervas';
  else if (cultLower.includes('abobrinha') || cultLower.includes('piment')) icone = 'abobrinha';

  const fasesGerais: Record<number, FaseSemanaInfo> = {
    41: isProntoColheita
      ? { fase: 'vegetativo', label: 'Crescimento', irrigacao: canteiro.irrigacao, nutricao: canteiro.adubacao, tratosCulturais: ['Capina manual e controle de umidade'], tarefasPraticas: [{ id: 'tg-1', titulo: 'Conferir sistema de irrigação', concluida: true }], statusConclusao: 'concluido', vistoProfessor: true }
      : isEmCrescimento
      ? { fase: 'vegetativo', label: 'Crescimento', irrigacao: canteiro.irrigacao, nutricao: canteiro.adubacao, tratosCulturais: ['Capina manual'], tarefasPraticas: [{ id: 'tg-1', titulo: 'Capina manual entre linhas', concluida: true }], statusConclusao: 'concluido', vistoProfessor: true }
      : { fase: 'semeadura', label: 'Semeadura', irrigacao: canteiro.irrigacao, nutricao: 'Adubação de base', tratosCulturais: ['Preparo dos sulcos'], tarefasPraticas: [{ id: 'tg-1', titulo: 'Semeadura no canteiro', concluida: true }], statusConclusao: 'concluido', vistoProfessor: true },
    42: isProntoColheita
      ? { fase: 'colheita', label: 'Colheita (40 kg)', sublabel: '40 kg', irrigacao: 'Irrigação matinal pré-colheita', nutricao: 'Sem fertilizantes pré-corte', tratosCulturais: ['Corte rente ao solo', 'Higienização e pesagem'], tarefasPraticas: [{ id: 'tg-2', titulo: 'Colheita e pesagem inicial', concluida: false }, { id: 'tg-3', titulo: 'Registro oficial na Ficha de Campo', concluida: false }], statusConclusao: 'em_andamento', vistoProfessor: false, observacaoProfessor: `Excelente desenvolvimento de ${canteiro.cultura} sob responsabilidade de ${canteiro.estudanteLider}.` }
      : isEmCrescimento
      ? { fase: 'vegetativo', label: 'Desenvolvimento', sublabel: 'Vegetativo', irrigacao: canteiro.irrigacao, nutricao: canteiro.adubacao, tratosCulturais: ['Aeração e desbaste'], tarefasPraticas: [{ id: 'tg-2', titulo: 'Manutenção de umidade e capina', concluida: false }], statusConclusao: 'em_andamento', vistoProfessor: false, observacaoProfessor: 'Desenvolvimento dentro da média esperada.' }
      : { fase: 'mudas', label: 'Germinação', irrigacao: canteiro.irrigacao, nutricao: 'Umedecimento leve', tratosCulturais: ['Proteção de mudas'], tarefasPraticas: [{ id: 'tg-2', titulo: 'Verificar emergência das plântulas', concluida: false }], statusConclusao: 'em_andamento', vistoProfessor: false },
    43: isProntoColheita
      ? { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento contínuo', nutricao: 'Húmus no sulco', tratosCulturais: ['Abertura de covas'], tarefasPraticas: [], statusConclusao: 'previsto' }
      : { fase: 'desenvolvimento', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: canteiro.adubacao, tratosCulturais: ['Inspeção fitossanitária'], tarefasPraticas: [], statusConclusao: 'previsto' },
    44: { fase: 'desenvolvimento', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Biofertilizante foliar', tratosCulturais: ['Capina fina'], tarefasPraticas: [], statusConclusao: 'previsto' },
    45: isEmCrescimento
      ? { fase: 'colheita', label: 'Colheita Prevista', sublabel: 'Colheita', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Colheita'], tarefasPraticas: [], statusConclusao: 'previsto' }
      : { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Composto', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
    46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
    47: { fase: 'colheita', label: 'Colheita', sublabel: 'Colheita', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
    48: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Residual', nutricao: 'Mulching', tratosCulturais: ['Cobertura morta'], tarefasPraticas: [], statusConclusao: 'previsto' },
    49: { fase: 'semeadura', label: 'Novo Plantio', irrigacao: 'Frequente', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
  };

  const modulos: ModuloCanteiro[] = [
    {
      id: `${canteiro.id}-m1`,
      nome: 'Módulo 1',
      descricao: `Linha Principal A (Cultivo de ${canteiro.cultura})`,
      fases: {
        41: fasesGerais[41],
        42: fasesGerais[42],
        43: fasesGerais[43],
        44: fasesGerais[44],
        45: fasesGerais[45],
        46: fasesGerais[46],
        47: fasesGerais[47],
        48: fasesGerais[48],
        49: fasesGerais[49],
      },
    },
    {
      id: `${canteiro.id}-m2`,
      nome: 'Módulo 2',
      descricao: 'Linha Secundária B (Plantio escalonado +7 dias)',
      fases: {
        41: { fase: 'vegetativo', label: 'Vegetativo', irrigacao: canteiro.irrigacao, nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'concluido' },
        42: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Bokashi', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
        43: isProntoColheita ? { fase: 'colheita', label: 'Colheita (36 kg)', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' } : { fase: 'desenvolvimento', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
        44: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Leve', nutricao: 'Composto', tratosCulturais: ['Afolhamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
        45: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Covas'], tarefasPraticas: [], statusConclusao: 'previsto' },
        46: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Biofertilizante', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
        47: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Composto', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
        48: { fase: 'colheita', label: 'Colheita', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
        49: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Residual', nutricao: 'Mulching', tratosCulturais: ['Cobertura'], tarefasPraticas: [], statusConclusao: 'previsto' },
      },
    },
    {
      id: `${canteiro.id}-m3`,
      nome: 'Módulo 3',
      descricao: 'Linha C (Berçário de reposição / Mudas)',
      fases: {
        41: { fase: 'mudas', label: 'Mudas Estufa', irrigacao: 'Nebulização', nutricao: 'Substrato orgânico', tratosCulturais: ['Raleio'], tarefasPraticas: [], statusConclusao: 'concluido' },
        42: { fase: 'transplante', label: 'Aclimação Mudas', irrigacao: canteiro.irrigacao, nutricao: 'Biofertilizante 2%', tratosCulturais: ['Aclimação'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
        43: { fase: 'transplante', label: 'Transplante', irrigacao: 'Gotejamento', nutricao: 'Húmus', tratosCulturais: ['Plantio definitivo'], tarefasPraticas: [], statusConclusao: 'previsto' },
        44: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
        45: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Bokashi', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
        46: { fase: 'colheita', label: 'Colheita', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
        47: { fase: 'descanso_solo', label: 'Descanso Solo', irrigacao: 'Leve', nutricao: 'Palhada', tratosCulturais: ['Mulching'], tarefasPraticas: [], statusConclusao: 'previsto' },
        48: { fase: 'semeadura', label: 'Semeadura', irrigacao: 'Frequente', nutricao: 'Composto', tratosCulturais: ['Semeio'], tarefasPraticas: [], statusConclusao: 'previsto' },
        49: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
      },
    },
    {
      id: `${canteiro.id}-m4`,
      nome: 'Módulo 4',
      descricao: 'Linha D (Faixa de consórcio ou cobertura vegetal)',
      fases: {
        41: { fase: 'descanso_solo', label: 'Cobertura Morta', irrigacao: 'Umedecimento', nutricao: 'Palhada de capim', tratosCulturais: ['Espalhamento'], tarefasPraticas: [], statusConclusao: 'concluido' },
        42: { fase: 'descanso_solo', label: 'Solarização', irrigacao: 'Sob lona plástica', nutricao: 'Nenhuma', tratosCulturais: ['Vedação'], tarefasPraticas: [], statusConclusao: 'em_andamento' },
        43: { fase: 'descanso_solo', label: 'Incorporação', irrigacao: 'Regas leves', nutricao: 'Composto 3kg/m²', tratosCulturais: ['Enxadão'], tarefasPraticas: [], statusConclusao: 'previsto' },
        44: { fase: 'descanso_solo', label: 'Liberação Canteiro', irrigacao: 'Ajuste de pH', nutricao: 'Cinzas de madeira', tratosCulturais: ['Canteamento'], tarefasPraticas: [], statusConclusao: 'previsto' },
        45: { fase: 'semeadura', label: 'Novo Plantio', irrigacao: 'Frequente', nutricao: 'Biofertilizante', tratosCulturais: ['Sulcos'], tarefasPraticas: [], statusConclusao: 'previsto' },
        46: { fase: 'vegetativo', label: 'Crescimento', irrigacao: canteiro.irrigacao, nutricao: 'Composto', tratosCulturais: ['Capina'], tarefasPraticas: [], statusConclusao: 'previsto' },
        47: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Bokashi', tratosCulturais: ['Aeração'], tarefasPraticas: [], statusConclusao: 'previsto' },
        48: { fase: 'vegetativo', label: 'Desenvolvimento', irrigacao: canteiro.irrigacao, nutricao: 'Biofertilizante', tratosCulturais: ['Desbaste'], tarefasPraticas: [], statusConclusao: 'previsto' },
        49: { fase: 'colheita', label: 'Colheita', irrigacao: 'Matinal', nutricao: 'Nenhuma', tratosCulturais: ['Corte'], tarefasPraticas: [], statusConclusao: 'previsto' },
      },
    },
  ];

  return {
    id: canteiro.id,
    codigo: canteiro.codigo,
    cultura: canteiro.cultura,
    lote: `Lote 01`,
    variedade: canteiro.variedade || '',
    icone,
    setor: canteiro.setor,
    setorBadge: canteiro.setor.includes('Folhosas') ? 'Setor A' : canteiro.setor.includes('Raízes') ? 'Setor B' : 'Setor C',
    dimensao: `${canteiro.posicao.comprimento.toFixed(2)}m x ${canteiro.posicao.largura.toFixed(2)}m (${canteiro.areaM2} m²)`,
    estudanteLider: canteiro.estudanteLider,
    turma: canteiro.turmaResponsavel,
    dataPlantio: canteiro.dataPlantio,
    previsaoColheita: `${canteiro.diasPrevistosColheita} dias`,
    fasesGerais,
    modulos,
  };
};

// Retorna o cronograma exato para o canteiro especificado
export const getCronogramaCanteiro = (idOrCodigo: string): CanteiroCronograma => {
  const normalized = idOrCodigo.toLowerCase().trim();
  // Busca em CRONOGRAMA_CANTEIROS
  const estatico = CRONOGRAMA_CANTEIROS.find(
    (c) => c.id.toLowerCase() === normalized || c.codigo.toLowerCase() === normalized
  );
  if (estatico) return estatico;

  // Busca em CANTEIROS_DATA
  const canteiro = CANTEIROS_DATA.find(
    (c) => c.id.toLowerCase() === normalized || c.codigo.toLowerCase() === normalized
  );
  if (canteiro) {
    return gerarCronogramaParaCanteiro(canteiro);
  }

  return CRONOGRAMA_CANTEIROS[0];
};

// Retorna todos os canteiros hortícolas de CANTEIROS_DATA com cronograma
export const getTodosCanteirosCronograma = (): CanteiroCronograma[] => {
  const canteirosHort = CANTEIROS_DATA.filter((c) => c.tipo === 'hortalica');
  return canteirosHort.map((c) => getCronogramaCanteiro(c.id));
};

