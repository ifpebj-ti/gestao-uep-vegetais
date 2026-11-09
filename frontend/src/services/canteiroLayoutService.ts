import { CanteiroData, CANTEIROS_DATA, TipoSetor, StatusCultura } from '../modules/olericultura/data/horticulturaData';

const STORAGE_KEY = 'terrarium_canteiros_layout_v1';
const STORAGE_TERRENO_KEY = 'terrarium_terreno_dimensoes_v1';

export interface Ponto2D {
  x: number;
  z: number;
}

export type TipoFormatoTerreno = 'real_uep' | 'retangular' | 'personalizado';

export interface DimensoesTerreno {
  largura: number; // Largura real em metros (eixo X)
  comprimento: number; // Comprimento real em metros (eixo Z)
  nomeArea?: string; // Ex: 'Setor de Olericultura - UEP'
  espacamentoGrade?: number; // Grade de snap em metros (padrão: 0.5)
  tipoFormato?: TipoFormatoTerreno; // 'real_uep' | 'retangular' | 'personalizado'
  vertices?: Ponto2D[]; // Vértices poligonais opcionais
}

export const TERRENO_ORIGEM_X = -14.5;
export const TERRENO_ORIGEM_Z = -19.0;

/**
 * Calcula os vértices poligonais do terreno.
 * Suporta o formato arquitetônico real da UEP (trapezoidal do esboço de campo),
 * formato retangular convencional ou polígono personalizado com n-vértices.
 */
export function calcularVerticesTerreno(dimensoes: DimensoesTerreno): Ponto2D[] {
  const { largura, comprimento, tipoFormato = 'retangular', vertices } = dimensoes;

  if (tipoFormato === 'personalizado' && Array.isArray(vertices) && vertices.length >= 3) {
    return vertices;
  }

  const x0 = TERRENO_ORIGEM_X;
  const z0 = TERRENO_ORIGEM_Z;
  const w = largura;
  const h = comprimento;

  return [
    { x: Number(x0.toFixed(2)), z: Number(z0.toFixed(2)) },
    { x: Number((x0 + w).toFixed(2)), z: Number(z0.toFixed(2)) },
    { x: Number((x0 + w).toFixed(2)), z: Number((z0 + h).toFixed(2)) },
    { x: Number(x0.toFixed(2)), z: Number((z0 + h).toFixed(2)) },
  ];
}

export const DIMENSOES_TERRENO_PADRAO: DimensoesTerreno = {
  largura: 32,
  comprimento: 60,
  nomeArea: 'UEP Vegetais - Olericultura & Plantas Medicinais',
  espacamentoGrade: 0.5,
  tipoFormato: 'retangular',
};

export interface NovoCanteiroInput {
  codigo: string;
  nome: string;
  setor?: string;
  tipo?: TipoSetor;
  cultura?: string;
  variedade?: string;
  status?: StatusCultura;
  statusLabel?: string;
  statusColor?: string;
  areaM2?: number;
  turmaResponsavel?: string;
  professorResponsavel?: string;
  estudanteLider?: string;
  observacoes?: string;
  posicao: {
    x: number;
    z: number;
    largura: number;
    comprimento: number;
    rotacao?: number;
  };
}

class CanteiroLayoutService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Obtém todos os canteiros e infraestruturas do layout.
   */
  public listarCanteiros(): CanteiroData[] {
    if (!this.isBrowser()) {
      return this.clonarDadosPadrao();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const dadosIniciais = this.clonarDadosPadrao();
        this.salvar(dadosIniciais);
        return dadosIniciais;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return this.clonarDadosPadrao();
    } catch {
      return this.clonarDadosPadrao();
    }
  }

  /**
   * Busca um canteiro específico pelo ID.
   */
  public buscarCanteiroPorId(id: string): CanteiroData | undefined {
    const todos = this.listarCanteiros();
    return todos.find((c) => c.id === id);
  }

  /**
   * Adiciona um novo canteiro ao layout da UEP.
   */
  public adicionarCanteiro(input: NovoCanteiroInput): CanteiroData {
    const todos = this.listarCanteiros();

    const idLimpo = input.codigo
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');
    
    // Garante ID único
    let finalId = idLimpo || `canteiro-${Date.now()}`;
    let contador = 1;
    while (todos.some((c) => c.id === finalId)) {
      finalId = `${idLimpo}-${contador++}`;
    }

    const largura = Math.max(0.5, Number(input.posicao.largura) || 1.2);
    const comprimento = Math.max(0.5, Number(input.posicao.comprimento) || 6.0);
    const areaCalculada = Number((largura * comprimento).toFixed(2));

    const novoCanteiro: CanteiroData = {
      id: finalId,
      codigo: input.codigo.trim().toUpperCase(),
      nome: input.nome.trim() || `Canteiro ${input.codigo.trim().toUpperCase()}`,
      setor: input.setor || 'Hortaliças Folhosas',
      tipo: input.tipo || 'hortalica',
      cultura: input.cultura?.trim() || 'Cultivo Geral',
      variedade: input.variedade?.trim() || '',
      status: input.status || 'recem_plantado',
      statusLabel: input.statusLabel || 'Recém-plantado',
      statusColor: input.statusColor || '#3b82f6',
      dataPlantio: new Date().toISOString().split('T')[0],
      diasPlantio: 1,
      diasPrevistosColheita: 45,
      umidadeSolo: 75,
      temperaturaSolo: '23.5°C',
      phSolo: 6.5,
      areaM2: input.areaM2 || areaCalculada,
      irrigacao: 'Gotejamento automatizado',
      adubacao: 'Composto orgânico da UEP',
      turmaResponsavel: input.turmaResponsavel || 'Geral UEP',
      professorResponsavel: input.professorResponsavel || 'Prof. George Guimarães',
      estudanteLider: input.estudanteLider || 'A definir',
      observacoes: input.observacoes || 'Canteiro cadastrado via Editor de Layout.',
      tarefasPendentes: ['Monitorar germinação e umidade'],
      posicao: {
        x: Number(input.posicao.x) || 0,
        z: Number(input.posicao.z) || 0,
        largura,
        comprimento,
        rotacao: Number(input.posicao.rotacao) || 0,
      },
    };

    todos.push(novoCanteiro);
    this.salvar(todos);
    return novoCanteiro;
  }

  /**
   * Atualiza as propriedades e dimensões de um canteiro existente.
   */
  public atualizarCanteiro(id: string, updates: Partial<CanteiroData>): CanteiroData {
    const todos = this.listarCanteiros();
    const index = todos.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Canteiro com ID "${id}" não foi encontrado.`);
    }

    const canteiroAtual = todos[index];

    // Se houve alteração de largura ou comprimento, recalcula a área sugerida
    let novaArea = updates.areaM2 ?? canteiroAtual.areaM2;
    if (updates.posicao?.largura || updates.posicao?.comprimento) {
      const novaLargura = updates.posicao.largura ?? canteiroAtual.posicao.largura;
      const novoComprimento = updates.posicao.comprimento ?? canteiroAtual.posicao.comprimento;
      novaArea = Number((novaLargura * novoComprimento).toFixed(2));
    }

    const canteiroAtualizado: CanteiroData = {
      ...canteiroAtual,
      ...updates,
      areaM2: novaArea,
      posicao: {
        ...canteiroAtual.posicao,
        ...(updates.posicao || {}),
      },
    };

    todos[index] = canteiroAtualizado;
    this.salvar(todos);
    return canteiroAtualizado;
  }

  /**
   * Remove um canteiro pelo ID.
   */
  public removerCanteiro(id: string): boolean {
    const todos = this.listarCanteiros();
    const filtrados = todos.filter((c) => c.id !== id);

    if (filtrados.length === todos.length) {
      return false;
    }

    this.salvar(filtrados);
    return true;
  }

  /**
   * Duplica um canteiro existente com deslocamento espacial para facilitar a criação de fileiras.
   */
  public duplicarCanteiro(id: string, deslocamento = { dx: 3.0, dz: 0 }): CanteiroData {
    const canteiroOriginal = this.buscarCanteiroPorId(id);
    if (!canteiroOriginal) {
      throw new Error(`Canteiro original "${id}" não encontrado para duplicação.`);
    }

    const proximoCodigo = this.gerarProximoCodigo(canteiroOriginal.codigo);

    return this.adicionarCanteiro({
      ...canteiroOriginal,
      codigo: proximoCodigo,
      nome: `Canteiro ${proximoCodigo}`,
      posicao: {
        ...canteiroOriginal.posicao,
        x: Number((canteiroOriginal.posicao.x + deslocamento.dx).toFixed(2)),
        z: Number((canteiroOriginal.posicao.z + deslocamento.dz).toFixed(2)),
      },
    });
  }

  /**
   * Obtém as dimensões reais cadastradas do terreno da UEP.
   */
  public obterDimensoesTerreno(): DimensoesTerreno {
    if (!this.isBrowser()) {
      return { ...DIMENSOES_TERRENO_PADRAO };
    }

    try {
      const stored = localStorage.getItem(STORAGE_TERRENO_KEY);
      if (!stored) {
        return { ...DIMENSOES_TERRENO_PADRAO };
      }
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.largura === 'number' && typeof parsed.comprimento === 'number') {
        return {
          largura: Math.max(10, Math.min(200, Number(parsed.largura) || 32)),
          comprimento: Math.max(10, Math.min(300, Number(parsed.comprimento) || 60)),
          nomeArea: parsed.nomeArea || DIMENSOES_TERRENO_PADRAO.nomeArea,
          espacamentoGrade: parsed.espacamentoGrade || 0.5,
          tipoFormato: parsed.tipoFormato || 'real_uep',
          vertices: Array.isArray(parsed.vertices) ? parsed.vertices : undefined,
        };
      }
    } catch {
      return { ...DIMENSOES_TERRENO_PADRAO };
    }
    return { ...DIMENSOES_TERRENO_PADRAO };
  }

  /**
   * Atualiza as dimensões reais do terreno da UEP e notifica os componentes.
   */
  public atualizarDimensoesTerreno(novasDimensoes: Partial<DimensoesTerreno>): DimensoesTerreno {
    const atuais = this.obterDimensoesTerreno();
    const atualizadas: DimensoesTerreno = {
      ...atuais,
      ...novasDimensoes,
      largura: Math.max(10, Math.min(200, Number(novasDimensoes.largura ?? atuais.largura) || 32)),
      comprimento: Math.max(10, Math.min(300, Number(novasDimensoes.comprimento ?? atuais.comprimento) || 60)),
      nomeArea: novasDimensoes.nomeArea !== undefined ? novasDimensoes.nomeArea : atuais.nomeArea,
      espacamentoGrade: novasDimensoes.espacamentoGrade !== undefined ? novasDimensoes.espacamentoGrade : atuais.espacamentoGrade,
      tipoFormato: novasDimensoes.tipoFormato !== undefined ? novasDimensoes.tipoFormato : atuais.tipoFormato,
      vertices: novasDimensoes.vertices !== undefined ? novasDimensoes.vertices : atuais.vertices,
    };

    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_TERRENO_KEY, JSON.stringify(atualizadas));
      window.dispatchEvent(new CustomEvent('terrarium:terreno-alterado', { detail: atualizadas }));
    }
    return atualizadas;
  }

  /**
   * Restaura o layout padrão original da UEP e as dimensões do terreno.
   */
  public redefinirLayoutPadrao(): CanteiroData[] {
    const padrao = this.clonarDadosPadrao();
    this.salvar(padrao);
    if (this.isBrowser()) {
      localStorage.removeItem(STORAGE_TERRENO_KEY);
      window.dispatchEvent(new CustomEvent('terrarium:terreno-alterado', { detail: DIMENSOES_TERRENO_PADRAO }));
    }
    return padrao;
  }

  /**
   * Exporta a configuração atual do layout para JSON formatado.
   */
  public exportarLayoutJson(): string {
    return JSON.stringify(this.listarCanteiros(), null, 2);
  }

  /**
   * Importa uma configuração de layout a partir de JSON válido.
   */
  public importarLayoutJson(jsonStr: string): CanteiroData[] {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Formato de layout inválido. Esperava-se uma lista de canteiros.');
    }
    this.salvar(parsed);
    return parsed;
  }

  private gerarProximoCodigo(codigoAtual: string): string {
    const match = codigoAtual.match(/([A-Za-z]+)-?(\d+)/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10) + 1;
      return `${prefix}${num.toString().padStart(2, '0')}`;
    }
    return `${codigoAtual}-COPIA`;
  }

  private clonarDadosPadrao(): CanteiroData[] {
    return JSON.parse(JSON.stringify(CANTEIROS_DATA));
  }

  private salvar(dados: CanteiroData[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    }
  }
}

export const canteiroLayoutService = new CanteiroLayoutService();

