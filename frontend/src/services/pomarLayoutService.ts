import {
  QuadraPomar,
  QUADRAS_POMAR,
  TipoFruteira,
  TipoQuadra,
} from '../modules/fruticultura/data/pomarData';

const STORAGE_KEY = 'terrarium_fruticultura_layout_v1';

export interface NovaQuadraInput {
  codigo: string;
  nome: string;
  culturas: string[];
  tipoFruteira: TipoFruteira;
  tipo?: TipoQuadra;
  colunas: number;
  linhas: number;
  passoX: number;
  passoY: number;
  larguraPx: number;
  alturaPx: number;
  origemPx: { x: number; y: number };
  rotacaoGraus?: number;
}

class PomarLayoutService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private clonarPadrao(): QuadraPomar[] {
    return JSON.parse(JSON.stringify(QUADRAS_POMAR));
  }

  public listarQuadras(): QuadraPomar[] {
    if (!this.isBrowser()) {
      return this.clonarPadrao();
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const dados = this.clonarPadrao();
        this.salvar(dados);
        return dados;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return this.clonarPadrao();
    } catch {
      return this.clonarPadrao();
    }
  }

  public buscarPorId(id: string): QuadraPomar | undefined {
    return this.listarQuadras().find((q) => q.id === id);
  }

  public salvar(lista: QuadraPomar[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      window.dispatchEvent(new CustomEvent('terrarium:pomar-layout-alterado'));
    } catch (e) {
      console.warn('Erro ao salvar layout do pomar no storage', e);
    }
  }

  public atualizarQuadra(id: string, updates: Partial<QuadraPomar>): QuadraPomar {
    const todas = this.listarQuadras();
    const index = todas.findIndex((q) => q.id === id);
    if (index === -1) {
      throw new Error(`Quadra "${id}" não encontrada.`);
    }

    const atual = todas[index];
    const atualizada: QuadraPomar = {
      ...atual,
      ...updates,
      origemPx: updates.origemPx ? { ...updates.origemPx } : { ...atual.origemPx },
      culturas: updates.culturas ? [...updates.culturas] : [...atual.culturas],
    };

    todas[index] = atualizada;
    this.salvar(todas);
    return atualizada;
  }

  public adicionarQuadra(input: NovaQuadraInput): QuadraPomar {
    const todas = this.listarQuadras();
    const idLimpo = input.codigo.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    let finalId = idLimpo || `quadra-${Date.now()}`;
    let contador = 1;
    while (todas.some((q) => q.id === finalId)) {
      finalId = `${idLimpo}-${contador++}`;
    }

    const nova: QuadraPomar = {
      id: finalId,
      codigo: input.codigo.trim().toUpperCase(),
      nome: input.nome.trim() || `Quadra ${input.codigo.trim().toUpperCase()}`,
      culturas: input.culturas && input.culturas.length > 0 ? input.culturas : ['Fruteira'],
      tipoFruteira: input.tipoFruteira,
      tipo: input.tipo || 'fruteira',
      colunas: Math.max(1, input.colunas),
      linhas: Math.max(1, input.linhas),
      passoX: Number(input.passoX) || 24,
      passoY: Number(input.passoY) || 24,
      larguraPx: Number(input.larguraPx) || 22,
      alturaPx: Number(input.alturaPx) || 22,
      origemPx: {
        x: Number(input.origemPx?.x) || 300,
        y: Number(input.origemPx?.y) || 300,
      },
      rotacaoGraus: Number(input.rotacaoGraus) || 0,
    };

    todas.push(nova);
    this.salvar(todas);
    return nova;
  }

  public removerQuadra(id: string): boolean {
    const todas = this.listarQuadras();
    const filtradas = todas.filter((q) => q.id !== id);
    if (filtradas.length === todas.length) return false;
    this.salvar(filtradas);
    return true;
  }

  public restaurarPadrao(): QuadraPomar[] {
    const padrao = this.clonarPadrao();
    this.salvar(padrao);
    return padrao;
  }
}

export const pomarLayoutService = new PomarLayoutService();
