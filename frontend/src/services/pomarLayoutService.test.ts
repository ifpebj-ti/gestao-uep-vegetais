import { describe, it, expect, beforeEach } from 'vitest';
import { pomarLayoutService } from './pomarLayoutService';
import { QUADRAS_POMAR } from '../modules/fruticultura/data/pomarData';

describe('pomarLayoutService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve listar todas as quadras padrão inicialmente', () => {
    const quadras = pomarLayoutService.listarQuadras();
    expect(quadras.length).toBe(QUADRAS_POMAR.length);
    expect(quadras.some((q) => q.id === 'banana')).toBe(true);
    expect(quadras.some((q) => q.id === 'manga')).toBe(true);
    expect(quadras.some((q) => q.id === 'sala-equipamento')).toBe(true);
  });

  it('deve buscar uma quadra pelo id', () => {
    const quadra = pomarLayoutService.buscarPorId('banana');
    expect(quadra).toBeDefined();
    expect(quadra?.nome).toBe('Banana');
    expect(quadra?.culturas).toContain('Banana');
  });

  it('deve atualizar culturas, dimensões e posição de uma quadra', () => {
    const atualizada = pomarLayoutService.atualizarQuadra('banana', {
      nome: 'Banana Orgânica',
      culturas: ['Banana Nanica', 'Banana da Terra'],
      linhas: 6,
      colunas: 15,
      origemPx: { x: 200, y: 300 },
    });

    expect(atualizada.nome).toBe('Banana Orgânica');
    expect(atualizada.culturas).toEqual(['Banana Nanica', 'Banana da Terra']);
    expect(atualizada.linhas).toBe(6);
    expect(atualizada.colunas).toBe(15);
    expect(atualizada.origemPx.x).toBe(200);
    expect(atualizada.origemPx.y).toBe(300);

    const reconsultada = pomarLayoutService.buscarPorId('banana');
    expect(reconsultada?.nome).toBe('Banana Orgânica');
  });

  it('deve adicionar uma nova quadra com sucesso', () => {
    const nova = pomarLayoutService.adicionarQuadra({
      codigo: 'Q-ACEROLA',
      nome: 'Quadra Experimental de Acerola',
      tipoFruteira: 'citros',
      culturas: ['Acerola Sertaneja'],
      linhas: 5,
      colunas: 8,
      passoX: 25,
      passoY: 25,
      larguraPx: 20,
      alturaPx: 20,
      origemPx: { x: 100, y: 100 },
      rotacaoGraus: 0,
    });

    expect(nova.id).toBeDefined();
    expect(nova.codigo).toBe('Q-ACEROLA');
    expect(nova.nome).toBe('Quadra Experimental de Acerola');

    const lista = pomarLayoutService.listarQuadras();
    expect(lista.length).toBe(QUADRAS_POMAR.length + 1);
  });

  it('deve remover uma quadra pelo id', () => {
    const removida = pomarLayoutService.removerQuadra('pitaya-4');
    expect(removida).toBe(true);

    const reconsultada = pomarLayoutService.buscarPorId('pitaya-4');
    expect(reconsultada).toBeUndefined();
  });

  it('deve restaurar o layout para o padrão original', () => {
    pomarLayoutService.atualizarQuadra('banana', { nome: 'Modificada' });
    pomarLayoutService.removerQuadra('manga');

    const restauradas = pomarLayoutService.restaurarPadrao();
    expect(restauradas.length).toBe(QUADRAS_POMAR.length);

    const banana = pomarLayoutService.buscarPorId('banana');
    expect(banana?.nome).toBe('Banana');

    const manga = pomarLayoutService.buscarPorId('manga');
    expect(manga).toBeDefined();
  });
});
