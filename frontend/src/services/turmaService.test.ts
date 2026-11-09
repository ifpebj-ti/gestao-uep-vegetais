import { describe, it, expect, beforeEach } from 'vitest';
import { turmaService } from './turmaService';

describe('turmaService - Gestão de Turmas e Tarefas de Alunos', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve listar turmas iniciais (seed)', () => {
    const turmas = turmaService.listarTurmas();
    expect(turmas.length).toBeGreaterThan(0);
    expect(turmas.some((t) => t.codigo === 'AGRO-459')).toBe(true);
  });

  it('deve gerar código de turma no formato correto (ex: AGRO-123 ou FRUT-456)', () => {
    const codAgro = turmaService.gerarCodigoTurma('AGRO');
    expect(codAgro).toMatch(/^AGRO-\d{3}$/);

    const codFrut = turmaService.gerarCodigoTurma('FRUT');
    expect(codFrut).toMatch(/^FRUT-\d{3}$/);
  });

  it('deve permitir ao professor criar uma nova turma', () => {
    const nova = turmaService.criarTurma({
      nome: 'Turma de Teste 2026',
      professorEmail: 'george@belojardim.ifpe.edu.br',
      professorNome: 'Prof. George',
      uep: 'olericultura',
      canteirosIds: ['c-01', 'c-02'],
    });

    expect(nova.codigo).toMatch(/^AGRO-\d{3}$/);
    expect(nova.nome).toBe('Turma de Teste 2026');

    const lista = turmaService.listarTurmasPorProfessor('george@belojardim.ifpe.edu.br');
    expect(lista.some((t) => t.id === nova.id)).toBe(true);
  });

  it('deve vincular o aluno a uma turma via código e registrar no histórico', () => {
    const alunoEmail = 'maria.estudante@discente.ifpe.edu.br';
    const turma = turmaService.vincularAlunoPorCodigo(alunoEmail, 'AGRO-459');

    expect(turma.codigo).toBe('AGRO-459');

    const vinculada = turmaService.obterTurmaDoAluno(alunoEmail);
    expect(vinculada?.codigo).toBe('AGRO-459');

    const historico = turmaService.listarHistorico('c-01');
    expect(historico.some((h) => h.acao === 'Entrada na Turma')).toBe(true);
  });

  it('deve lançar erro ao tentar vincular aluno com código inválido', () => {
    expect(() => {
      turmaService.vincularAlunoPorCodigo('aluno@discente.ifpe.edu.br', 'CODIGO-INEXISTENTE');
    }).toThrow(/código de turma inválido/i);
  });

  it('deve permitir ao aluno criar uma tarefa, alternar conclusão e o professor dar visto', () => {
    const tarefa = turmaService.criarTarefa({
      canteiroId: 'c-01',
      turmaId: 'turma-agro-2026-1',
      alunoEmail: 'aluno@discente.ifpe.edu.br',
      alunoNome: 'Aluno Teste',
      titulo: 'Capina seletiva entre linhas',
      tipo: 'tratos',
    });

    expect(tarefa.concluida).toBe(false);
    expect(tarefa.vistoProfessor).toBe(false);

    // Aluno marca como concluída
    const concluida = turmaService.alternarStatusTarefa(tarefa.id, true, 'Aluno Teste');
    expect(concluida.concluida).toBe(true);
    expect(concluida.concluidaEm).toBeDefined();

    // Professor dá visto
    const comVisto = turmaService.darVistoProfessor(tarefa.id, 'Prof. George');
    expect(comVisto.vistoProfessor).toBe(true);
    expect(comVisto.vistoPor).toBe('Prof. George');
  });

  it('deve buscar turma por ID e listar os alunos matriculados', () => {
    const turma = turmaService.buscarTurmaPorId('turma-agro-2026-1');
    expect(turma).not.toBeNull();
    expect(turma?.codigo).toBe('AGRO-459');

    const alunos = turmaService.listarAlunosDaTurma('turma-agro-2026-1');
    expect(alunos.length).toBeGreaterThan(0);
    expect(alunos.some((a) => a.email === 'aluno@discente.ifpe.edu.br')).toBe(true);
  });

  it('deve desvincular um aluno da turma', () => {
    turmaService.desvincularAlunoDaTurma('aluno@discente.ifpe.edu.br');
    const vinculada = turmaService.obterTurmaDoAluno('aluno@discente.ifpe.edu.br');
    expect(vinculada).toBeNull();
  });

  it('deve permitir excluir uma turma e limpar seus vínculos', () => {
    const nova = turmaService.criarTurma({
      nome: 'Turma Temporária',
      professorEmail: 'george@belojardim.ifpe.edu.br',
      professorNome: 'Prof. George',
      uep: 'olericultura',
    });

    turmaService.vincularAlunoPorCodigo('teste.excluir@discente.ifpe.edu.br', nova.codigo);
    expect(turmaService.obterTurmaDoAluno('teste.excluir@discente.ifpe.edu.br')?.id).toBe(nova.id);

    turmaService.excluirTurma(nova.id);
    expect(turmaService.buscarTurmaPorId(nova.id)).toBeNull();
    expect(turmaService.obterTurmaDoAluno('teste.excluir@discente.ifpe.edu.br')).toBeNull();
  });
});

