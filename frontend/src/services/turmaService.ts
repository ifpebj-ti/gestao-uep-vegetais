import { UepType } from '../types/uep';

export interface Turma {
  id: string;
  codigo: string; // Ex: AGRO-459
  nome: string; // Ex: Agronomia 2026.1 - Olericultura Geral
  professorEmail: string;
  professorNome: string;
  uep: UepType;
  criadaEm: string;
  canteirosIds: string[]; // Canteiros designados para esta turma (ex: ['c-01', 'c-02', 'c-18'])
}

export interface AlunoTurmaResumo {
  email: string;
  nome: string;
  vinculadoEm: string;
  tarefasTotal: number;
  tarefasConcluidas: number;
}

export interface TarefaAluno {
  id: string;
  canteiroId: string;
  turmaId: string;
  alunoEmail: string;
  alunoNome: string;
  titulo: string;
  descricao?: string;
  tipo: 'preparo' | 'semeadura' | 'irrigacao' | 'tratos' | 'adubacao' | 'colheita' | 'outro';
  dataLimite?: string;
  concluida: boolean;
  concluidaEm?: string;
  vistoProfessor: boolean;
  vistoPor?: string;
  criadaEm: string;
}

export interface RegistroHistoricoAluno {
  id: string;
  canteiroId: string;
  alunoEmail: string;
  alunoNome: string;
  acao: string;
  detalhes: string;
  dataHora: string;
}

const STORAGE_KEY_TURMAS = 'terrarium_turmas';
const STORAGE_KEY_ALUNO_TURMA = 'terrarium_aluno_turma_vinculo';
const STORAGE_KEY_TAREFAS = 'terrarium_tarefas_alunos';
const STORAGE_KEY_HISTORICO = 'terrarium_historico_alunos';

const SEED_VINCULOS: Record<string, string> = {
  'aluno@discente.ifpe.edu.br': 'turma-agro-2026-1',
  'daniela.gusmao@discente.ifpe.edu.br': 'turma-agro-2026-1',
};

// Turmas iniciais de demonstração (SEEDS)
const SEED_TURMAS: Turma[] = [
  {
    id: 'turma-agro-2026-1',
    codigo: 'AGRO-459',
    nome: 'Agronomia 2026.1 - Olericultura e Manejo',
    professorEmail: 'george@belojardim.ifpe.edu.br',
    professorNome: 'Prof. George Henrique',
    uep: 'olericultura',
    criadaEm: '2026-02-15T09:00:00.000Z',
    canteirosIds: ['c-01', 'c-02', 'c-03', 'c-18', 'c-19'],
  },
  {
    id: 'turma-frut-2026-1',
    codigo: 'FRUT-102',
    nome: 'Agropecuária 2026.1 - Pomar & Fruticultura',
    professorEmail: 'carla.mendes@belojardim.ifpe.edu.br',
    professorNome: 'Profa. Carla Mendes',
    uep: 'fruticultura',
    criadaEm: '2026-02-20T14:00:00.000Z',
    canteirosIds: ['pomar-t1', 'pomar-t2'],
  },
];

// Tarefas iniciais de demonstração
const SEED_TAREFAS: TarefaAluno[] = [
  {
    id: 'tar-1',
    canteiroId: 'c-01',
    turmaId: 'turma-agro-2026-1',
    alunoEmail: 'aluno@discente.ifpe.edu.br',
    alunoNome: 'Estudante IFPE',
    titulo: 'Desbaste e adubação orgânica de cobertura',
    descricao: 'Realizar desbaste manual deixando 1 planta por cova e aplicar composto orgânico.',
    tipo: 'tratos',
    dataLimite: '2026-11-06',
    concluida: false,
    vistoProfessor: false,
    criadaEm: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'tar-2',
    canteiroId: 'c-01',
    turmaId: 'turma-agro-2026-1',
    alunoEmail: 'aluno@discente.ifpe.edu.br',
    alunoNome: 'Estudante IFPE',
    titulo: 'Verificação da fita de gotejamento',
    descricao: 'Testar pressão e conferir gotejadores entupidos no canteiro C01.',
    tipo: 'irrigacao',
    concluida: true,
    concluidaEm: '2026-11-02T15:30:00.000Z',
    vistoProfessor: true,
    vistoPor: 'Prof. George Henrique',
    criadaEm: '2026-11-02T08:00:00.000Z',
  },
];

function lerJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function salvarJSON<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage access fallback
  }
}

function obterVinculos(): Record<string, string> {
  const raw = localStorage.getItem(STORAGE_KEY_ALUNO_TURMA);
  if (!raw) {
    salvarJSON(STORAGE_KEY_ALUNO_TURMA, SEED_VINCULOS);
    return { ...SEED_VINCULOS };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { ...SEED_VINCULOS };
  }
}

export const turmaService = {
  gerarCodigoTurma(prefixo: string = 'AGRO'): string {
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefixo.toUpperCase()}-${num}`;
  },

  listarTurmas(): Turma[] {
    const turmas = lerJSON<Turma[]>(STORAGE_KEY_TURMAS, []);
    if (!turmas || turmas.length === 0) {
      salvarJSON(STORAGE_KEY_TURMAS, SEED_TURMAS);
      return SEED_TURMAS;
    }
    return turmas;
  },

  listarTurmasPorProfessor(professorEmail: string): Turma[] {
    const normalizado = (professorEmail || '').trim().toLowerCase();
    return this.listarTurmas().filter((t) => t.professorEmail.toLowerCase() === normalizado);
  },

  criarTurma(dados: {
    nome: string;
    professorEmail: string;
    professorNome: string;
    uep: UepType;
    canteirosIds?: string[];
  }): Turma {
    const prefixo = dados.uep === 'fruticultura' ? 'FRUT' : 'AGRO';
    const nova: Turma = {
      id: `turma-${Date.now()}`,
      codigo: this.gerarCodigoTurma(prefixo),
      nome: dados.nome.trim(),
      professorEmail: dados.professorEmail.trim().toLowerCase(),
      professorNome: dados.professorNome.trim(),
      uep: dados.uep,
      criadaEm: new Date().toISOString(),
      canteirosIds: dados.canteirosIds || ['c-01', 'c-02', 'c-18'],
    };

    const todas = this.listarTurmas();
    salvarJSON(STORAGE_KEY_TURMAS, [nova, ...todas]);
    return nova;
  },

  buscarTurmaPorCodigo(codigo: string): Turma | null {
    if (!codigo) return null;
    const normalizado = codigo.trim().toUpperCase();
    const turmas = this.listarTurmas();
    return turmas.find((t) => t.codigo.toUpperCase() === normalizado) || null;
  },

  buscarTurmaPorId(id: string): Turma | null {
    if (!id) return null;
    const turmas = this.listarTurmas();
    return turmas.find((t) => t.id === id) || null;
  },

  excluirTurma(turmaId: string): void {
    const turmas = this.listarTurmas().filter((t) => t.id !== turmaId);
    salvarJSON(STORAGE_KEY_TURMAS, turmas);

    // Limpa vínculos de discentes associados à turma excluída
    const vinculos = obterVinculos();
    let alterado = false;
    for (const [email, tId] of Object.entries(vinculos)) {
      if (tId === turmaId) {
        delete vinculos[email];
        alterado = true;
      }
    }
    if (alterado) {
      salvarJSON(STORAGE_KEY_ALUNO_TURMA, vinculos);
    }
  },

  listarAlunosDaTurma(turmaId: string): AlunoTurmaResumo[] {
    const vinculos = obterVinculos();

    const alunosEmails = Object.entries(vinculos)
      .filter(([_, tId]) => tId === turmaId)
      .map(([email]) => email);

    const todasTarefas = this.listarTarefas();

    return alunosEmails.map((email) => {
      const tarefasDoAluno = todasTarefas.filter(
        (t) => t.turmaId === turmaId && t.alunoEmail.toLowerCase() === email.toLowerCase()
      );
      const concluidas = tarefasDoAluno.filter((t) => t.concluida).length;

      let nome = email.split('@')[0].replace('.', ' ');
      nome = nome.charAt(0).toUpperCase() + nome.slice(1);
      if (email === 'aluno@discente.ifpe.edu.br') nome = 'Estudante IFPE';
      if (email === 'daniela.gusmao@discente.ifpe.edu.br') nome = 'Daniela Gusmão';

      return {
        email,
        nome,
        vinculadoEm: '2026-03-01T08:00:00.000Z',
        tarefasTotal: tarefasDoAluno.length,
        tarefasConcluidas: concluidas,
      };
    });
  },

  desvincularAlunoDaTurma(alunoEmail: string): void {
    const vinculos = obterVinculos();
    const normalizado = alunoEmail.trim().toLowerCase();
    if (vinculos[normalizado]) {
      delete vinculos[normalizado];
      salvarJSON(STORAGE_KEY_ALUNO_TURMA, vinculos);
    }
  },

  obterTurmaDoAluno(alunoEmail: string): Turma | null {
    if (!alunoEmail) return null;
    const vinculos = obterVinculos();
    const turmaId = vinculos[alunoEmail.trim().toLowerCase()];
    if (!turmaId) return null;
    return this.listarTurmas().find((t) => t.id === turmaId) || null;
  },

  vincularAlunoPorCodigo(alunoEmail: string, codigoTurma: string): Turma {
    const turma = this.buscarTurmaPorCodigo(codigoTurma);
    if (!turma) {
      throw new Error('Código de turma inválido. Peça o código correto ao seu professor.');
    }

    const vinculos = obterVinculos();
    vinculos[alunoEmail.trim().toLowerCase()] = turma.id;
    salvarJSON(STORAGE_KEY_ALUNO_TURMA, vinculos);

    this.registrarAcaoHistorico({
      canteiroId: turma.canteirosIds[0] || 'geral',
      alunoEmail,
      alunoNome: alunoEmail.split('@')[0],
      acao: 'Entrada na Turma',
      detalhes: `Ingressou na turma ${turma.nome} via código ${turma.codigo}.`,
    });

    return turma;
  },

  // --------------------------------------------------------------------------
  // TAREFAS DO ALUNO
  // --------------------------------------------------------------------------
  listarTarefas(canteiroId?: string, alunoEmail?: string): TarefaAluno[] {
    let tarefas = lerJSON<TarefaAluno[]>(STORAGE_KEY_TAREFAS, []);
    if (!tarefas || tarefas.length === 0) {
      salvarJSON(STORAGE_KEY_TAREFAS, SEED_TAREFAS);
      tarefas = SEED_TAREFAS;
    }

    return tarefas.filter((t) => {
      const matchCanteiro = !canteiroId || t.canteiroId === canteiroId;
      const matchAluno = !alunoEmail || t.alunoEmail.toLowerCase() === alunoEmail.toLowerCase();
      return matchCanteiro && matchAluno;
    });
  },

  criarTarefa(dados: {
    canteiroId: string;
    turmaId: string;
    alunoEmail: string;
    alunoNome: string;
    titulo: string;
    descricao?: string;
    tipo: TarefaAluno['tipo'];
    dataLimite?: string;
  }): TarefaAluno {
    const nova: TarefaAluno = {
      id: `tar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      canteiroId: dados.canteiroId,
      turmaId: dados.turmaId,
      alunoEmail: dados.alunoEmail,
      alunoNome: dados.alunoNome,
      titulo: dados.titulo.trim(),
      descricao: dados.descricao?.trim(),
      tipo: dados.tipo,
      dataLimite: dados.dataLimite,
      concluida: false,
      vistoProfessor: false,
      criadaEm: new Date().toISOString(),
    };

    const todas = lerJSON<TarefaAluno[]>(STORAGE_KEY_TAREFAS, SEED_TAREFAS);
    salvarJSON(STORAGE_KEY_TAREFAS, [nova, ...todas]);

    this.registrarAcaoHistorico({
      canteiroId: dados.canteiroId,
      alunoEmail: dados.alunoEmail,
      alunoNome: dados.alunoNome,
      acao: 'Nova Tarefa Planejada',
      detalhes: `Criou a tarefa "${nova.titulo}" para o canteiro.`,
    });

    return nova;
  },

  alternarStatusTarefa(id: string, concluida: boolean, alunoNome: string): TarefaAluno {
    const todas = lerJSON<TarefaAluno[]>(STORAGE_KEY_TAREFAS, SEED_TAREFAS);
    const index = todas.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tarefa não encontrada');

    const atual = todas[index];
    const atualizada: TarefaAluno = {
      ...atual,
      concluida,
      concluidaEm: concluida ? new Date().toISOString() : undefined,
    };
    todas[index] = atualizada;
    salvarJSON(STORAGE_KEY_TAREFAS, todas);

    this.registrarAcaoHistorico({
      canteiroId: atual.canteiroId,
      alunoEmail: atual.alunoEmail,
      alunoNome,
      acao: concluida ? 'Tarefa Concluída' : 'Tarefa Reaberta',
      detalhes: `${concluida ? 'Concluiu' : 'Reabriu'} a tarefa "${atual.titulo}".`,
    });

    return atualizada;
  },

  removerTarefa(id: string): void {
    const todas = lerJSON<TarefaAluno[]>(STORAGE_KEY_TAREFAS, SEED_TAREFAS);
    salvarJSON(STORAGE_KEY_TAREFAS, todas.filter((t) => t.id !== id));
  },

  darVistoProfessor(id: string, professorNome: string): TarefaAluno {
    const todas = lerJSON<TarefaAluno[]>(STORAGE_KEY_TAREFAS, SEED_TAREFAS);
    const index = todas.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tarefa não encontrada');

    const atualizada: TarefaAluno = {
      ...todas[index],
      vistoProfessor: true,
      vistoPor: professorNome,
    };
    todas[index] = atualizada;
    salvarJSON(STORAGE_KEY_TAREFAS, todas);
    return atualizada;
  },

  // --------------------------------------------------------------------------
  // HISTÓRICO & LINHA DO TEMPO DO CANTEIRO
  // --------------------------------------------------------------------------
  listarHistorico(canteiroId: string): RegistroHistoricoAluno[] {
    const historico = lerJSON<RegistroHistoricoAluno[]>(STORAGE_KEY_HISTORICO, [
      {
        id: 'hist-seed-1',
        canteiroId: 'c-01',
        alunoEmail: 'aluno@discente.ifpe.edu.br',
        alunoNome: 'Estudante IFPE',
        acao: 'Verificação da fita de gotejamento',
        detalhes: 'Gotejadores conferidos e pressão de água normalizada.',
        dataHora: '2026-11-02T15:30:00.000Z',
      },
      {
        id: 'hist-seed-2',
        canteiroId: 'c-01',
        alunoEmail: 'aluno@discente.ifpe.edu.br',
        alunoNome: 'Estudante IFPE',
        acao: 'Transplantio Concluído',
        detalhes: 'Transplantadas 120 mudas de Alface Crespa no espaçamento 25x25cm.',
        dataHora: '2026-10-25T08:15:00.000Z',
      },
    ]);

    return historico.filter((h) => !canteiroId || h.canteiroId === canteiroId);
  },

  registrarAcaoHistorico(dados: {
    canteiroId: string;
    alunoEmail: string;
    alunoNome: string;
    acao: string;
    detalhes: string;
  }): void {
    const novo: RegistroHistoricoAluno = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      canteiroId: dados.canteiroId,
      alunoEmail: dados.alunoEmail,
      alunoNome: dados.alunoNome,
      acao: dados.acao,
      detalhes: dados.detalhes,
      dataHora: new Date().toISOString(),
    };

    const todos = lerJSON<RegistroHistoricoAluno[]>(STORAGE_KEY_HISTORICO, []);
    salvarJSON(STORAGE_KEY_HISTORICO, [novo, ...todos]);
  },
};

