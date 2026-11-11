import { describe, it, expect, beforeEach } from 'vitest';
import { canteiroLayoutService, calcularVerticesTerreno } from './canteiroLayoutService';

describe('canteiroLayoutService - Gestão Dinâmica de Layout 3D', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve listar canteiros iniciais a partir do layout padrão da UEP', () => {
    const canteiros = canteiroLayoutService.listarCanteiros();
    expect(canteiros.length).toBeGreaterThan(0);
    expect(canteiros.some((c) => c.codigo === 'C01')).toBe(true);
    expect(canteiros.some((c) => c.id === 'composteira')).toBe(true);
  });

  it('deve adicionar um novo canteiro com coordenadas e dimensões personalizadas', () => {
    const novo = canteiroLayoutService.adicionarCanteiro({
      codigo: 'C25',
      nome: 'Canteiro 25 Experimental',
      cultura: 'Tomate Cereja',
      posicao: {
        x: 12.5,
        z: -5.0,
        largura: 1.4,
        comprimento: 7.0,
        rotacao: 0,
      },
    });

    expect(novo.id).toBe('c25');
    expect(novo.codigo).toBe('C25');
    expect(novo.posicao.x).toBe(12.5);
    expect(novo.areaM2).toBe(9.8); // 1.4 * 7.0

    const listagem = canteiroLayoutService.listarCanteiros();
    expect(listagem.some((c) => c.codigo === 'C25')).toBe(true);
  });

  it('deve atualizar posição e dimensões de um canteiro existente', () => {
    const atualizado = canteiroLayoutService.atualizarCanteiro('c-01', {
      posicao: {
        x: 10.0,
        z: 20.0,
        largura: 2.0,
        comprimento: 8.0,
        rotacao: 1.57,
      },
    });

    expect(atualizado.posicao.x).toBe(10.0);
    expect(atualizado.posicao.largura).toBe(2.0);
    expect(atualizado.areaM2).toBe(16.0); // 2.0 * 8.0

    const buscado = canteiroLayoutService.buscarCanteiroPorId('c-01');
    expect(buscado?.posicao.x).toBe(10.0);
  });

  it('deve remover um canteiro pelo id', () => {
    const totalInicial = canteiroLayoutService.listarCanteiros().length;
    const sucesso = canteiroLayoutService.removerCanteiro('c-02');

    expect(sucesso).toBe(true);
    expect(canteiroLayoutService.listarCanteiros().length).toBe(totalInicial - 1);
    expect(canteiroLayoutService.buscarCanteiroPorId('c-02')).toBeUndefined();
  });

  it('deve duplicar um canteiro com deslocamento espacial pré-configurado', () => {
    const duplicado = canteiroLayoutService.duplicarCanteiro('c-01', { dx: 4.0, dz: 0 });

    expect(duplicado.id).not.toBe('c-01');
    expect(duplicado.posicao.x).toBeCloseTo(canteiroLayoutService.buscarCanteiroPorId('c-01')!.posicao.x + 4.0);
    expect(duplicado.cultura).toBe('Alface Crespa');
  });

  it('deve restaurar o layout padrão original', () => {
    canteiroLayoutService.removerCanteiro('c-01');
    expect(canteiroLayoutService.buscarCanteiroPorId('c-01')).toBeUndefined();

    canteiroLayoutService.redefinirLayoutPadrao();
    expect(canteiroLayoutService.buscarCanteiroPorId('c-01')).toBeDefined();
  });

  it('deve exportar e importar configuração de layout em JSON', () => {
    const json = canteiroLayoutService.exportarLayoutJson();
    expect(typeof json).toBe('string');
    expect(json).toContain('C01');

    localStorage.clear();
    const importado = canteiroLayoutService.importarLayoutJson(json);
    expect(importado.length).toBeGreaterThan(0);
    expect(canteiroLayoutService.buscarCanteiroPorId('c-01')).toBeDefined();
  });

  it('deve obter as dimensões padrão do terreno e permitir atualizar largura e comprimento', () => {
    const dimensoesIniciais = canteiroLayoutService.obterDimensoesTerreno();
    expect(dimensoesIniciais.largura).toBe(32);
    expect(dimensoesIniciais.comprimento).toBe(60);

    const atualizadas = canteiroLayoutService.atualizarDimensoesTerreno({
      largura: 40,
      comprimento: 75,
      nomeArea: 'Expansão Agroecológica 2026',
    });

    expect(atualizadas.largura).toBe(40);
    expect(atualizadas.comprimento).toBe(75);
    expect(atualizadas.nomeArea).toBe('Expansão Agroecológica 2026');

    const persistidas = canteiroLayoutService.obterDimensoesTerreno();
    expect(persistidas.largura).toBe(40);
    expect(persistidas.comprimento).toBe(75);

    // Redefinir padrão deve resetar as dimensões do terreno
    canteiroLayoutService.redefinirLayoutPadrao();
    const resetadas = canteiroLayoutService.obterDimensoesTerreno();
    expect(resetadas.largura).toBe(32);
    expect(resetadas.comprimento).toBe(60);
  });

  it('deve calcular vértices perimetrais retangulares do terreno', () => {
    const vertices = calcularVerticesTerreno({
      largura: 32,
      comprimento: 60,
    });

    expect(vertices.length).toBe(4);
    expect(vertices[0].x).toBe(-14.5);
    expect(vertices[0].z).toBe(-19.0);
    expect(vertices[1].x).toBeCloseTo(-14.5 + 32);
    expect(vertices[1].z).toBe(-19.0);
    expect(vertices[2].x).toBeCloseTo(-14.5 + 32);
    expect(vertices[2].z).toBeCloseTo(-19.0 + 60);
    expect(vertices[3].x).toBe(-14.5);
    expect(vertices[3].z).toBeCloseTo(-19.0 + 60);
  });
});

