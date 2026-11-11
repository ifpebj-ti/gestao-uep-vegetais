/**
 * Layout do Pomar (UEP Fruticultura).
 *
 * As quadras foram extraídas da planta baixa do pomar (coordenadas em pixels da imagem
 * original, 905x745). Cada quadra é uma grade (colunas x linhas) de plantas, com uma
 * leve rotação, igual ao desenho. A conversão para metros do mapa 3D é feita em
 * `PX_PARA_METRO`.
 */

export type TipoQuadra = 'fruteira' | 'videira' | 'equipamento';

export type TipoFruteira =
  | 'goiaba'
  | 'banana'
  | 'manga'
  | 'coco'
  | 'uva'
  | 'citros'
  | 'graviola'
  | 'pitaya'
  | 'equipamento';

export interface QuadraPomar {
  id: string;
  codigo: string;
  nome: string;
  /** Culturas plantadas na quadra (rótulo exibido no mapa) */
  culturas: string[];
  tipoFruteira: TipoFruteira;
  tipo: TipoQuadra;
  /** Origem (canto superior esquerdo da 1ª planta) em pixels da planta baixa */
  origemPx: { x: number; y: number };
  colunas: number;
  linhas: number;
  /** Passo entre plantas (px) */
  passoX: number;
  passoY: number;
  /** Tamanho de cada planta/parcela (px) */
  larguraPx: number;
  alturaPx: number;
  /** Rotação em graus (sentido horário na tela) */
  rotacaoGraus: number;
}

/** Escala da planta baixa: 1px da imagem = 0,16 unidades do mapa 3D (~ 0,16 m). */
export const PX_PARA_METRO = 0.16;
export const IMAGEM_LARGURA_PX = 905;
export const IMAGEM_ALTURA_PX = 745;

export const CORES_FRUTEIRAS: Record<TipoFruteira, { copa: string; tronco: string; label: string }> = {
  goiaba: { copa: '#7cb342', tronco: '#6d4c41', label: '#558b2f' },
  banana: { copa: '#9ccc3c', tronco: '#8bc34a', label: '#689f38' },
  manga: { copa: '#2e7d32', tronco: '#5d4037', label: '#2e7d32' },
  coco: { copa: '#43a047', tronco: '#a1887f', label: '#388e3c' },
  uva: { copa: '#7b1fa2', tronco: '#5d4037', label: '#7b1fa2' },
  citros: { copa: '#f9a825', tronco: '#6d4c41', label: '#ef8f00' },
  graviola: { copa: '#558b2f', tronco: '#5d4037', label: '#33691e' },
  pitaya: { copa: '#d81b60', tronco: '#6a994e', label: '#c2185b' },
  equipamento: { copa: '#90a4ae', tronco: '#607d8b', label: '#546e7a' },
};

export const QUADRAS_POMAR: QuadraPomar[] = [
  {
    id: 'sala-equipamento',
    codigo: 'EQ',
    nome: 'Sala de equipamento',
    culturas: ['Infraestrutura'],
    tipoFruteira: 'equipamento',
    tipo: 'equipamento',
    origemPx: { x: 318, y: 4 },
    colunas: 1,
    linhas: 1,
    passoX: 0,
    passoY: 0,
    larguraPx: 76,
    alturaPx: 64,
    rotacaoGraus: -5,
  },
  {
    id: 'goiaba-1',
    codigo: 'GO1',
    nome: 'Goiaba',
    culturas: ['Goiaba'],
    tipoFruteira: 'goiaba',
    tipo: 'fruteira',
    origemPx: { x: 24, y: 124 },
    colunas: 15,
    linhas: 6,
    passoX: 26,
    passoY: 27.4,
    larguraPx: 22,
    alturaPx: 22,
    rotacaoGraus: -3.3,
  },
  {
    id: 'goiaba-2',
    codigo: 'GO2',
    nome: 'Goiaba (borda)',
    culturas: ['Goiaba'],
    tipoFruteira: 'goiaba',
    tipo: 'fruteira',
    origemPx: { x: 73, y: 89 },
    colunas: 10,
    linhas: 1,
    passoX: 22,
    passoY: 0,
    larguraPx: 18,
    alturaPx: 18,
    rotacaoGraus: -2,
  },
  {
    id: 'goiaba-3',
    codigo: 'GO3',
    nome: 'Goiaba (topo)',
    culturas: ['Goiaba'],
    tipoFruteira: 'goiaba',
    tipo: 'fruteira',
    origemPx: { x: 157, y: 55 },
    colunas: 5,
    linhas: 1,
    passoX: 20,
    passoY: 0,
    larguraPx: 18,
    alturaPx: 20,
    rotacaoGraus: 0,
  },
  {
    id: 'banana',
    codigo: 'BA',
    nome: 'Banana',
    culturas: ['Banana'],
    tipoFruteira: 'banana',
    tipo: 'fruteira',
    origemPx: { x: 461, y: 58 },
    colunas: 17,
    linhas: 4,
    passoX: 24.7,
    passoY: 22.8,
    larguraPx: 24,
    alturaPx: 21,
    rotacaoGraus: -3,
  },
  {
    id: 'manga',
    codigo: 'MA',
    nome: 'Manga',
    culturas: ['Manga'],
    tipoFruteira: 'manga',
    tipo: 'fruteira',
    origemPx: { x: 505, y: 187 },
    colunas: 16,
    linhas: 3,
    passoX: 25.8,
    passoY: 27,
    larguraPx: 23,
    alturaPx: 23,
    rotacaoGraus: -3,
  },
  {
    id: 'coco',
    codigo: 'CO',
    nome: 'Coco',
    culturas: ['Coco'],
    tipoFruteira: 'coco',
    tipo: 'fruteira',
    origemPx: { x: 513, y: 280 },
    colunas: 16,
    linhas: 3,
    passoX: 25.8,
    passoY: 27,
    larguraPx: 23,
    alturaPx: 23,
    rotacaoGraus: -3,
  },
  {
    id: 'uva',
    codigo: 'UV',
    nome: 'Uva',
    culturas: ['Uva'],
    tipoFruteira: 'uva',
    tipo: 'videira',
    origemPx: { x: 11, y: 317 },
    colunas: 1,
    linhas: 6,
    passoX: 0,
    passoY: 21,
    larguraPx: 211,
    alturaPx: 14,
    rotacaoGraus: 5.3,
  },
  {
    id: 'citros-caju',
    codigo: 'LC',
    nome: 'Laranja, limão e caju',
    culturas: ['Laranja', 'Limão', 'Caju'],
    tipoFruteira: 'citros',
    tipo: 'fruteira',
    origemPx: { x: 240, y: 342 },
    colunas: 16,
    linhas: 3,
    passoX: 15.2,
    passoY: 38.5,
    larguraPx: 13,
    alturaPx: 32,
    rotacaoGraus: 6.8,
  },
  {
    id: 'graviola-pinha',
    codigo: 'GP',
    nome: 'Graviola e pinha',
    culturas: ['Graviola', 'Pinha'],
    tipoFruteira: 'graviola',
    tipo: 'fruteira',
    origemPx: { x: 254, y: 488 },
    colunas: 5,
    linhas: 4,
    passoX: 41.5,
    passoY: 15.7,
    larguraPx: 34,
    alturaPx: 13,
    rotacaoGraus: 3,
  },
  {
    id: 'pitaya-1',
    codigo: 'PI1',
    nome: 'Pitaya 1',
    culturas: ['Pitaya'],
    tipoFruteira: 'pitaya',
    tipo: 'fruteira',
    origemPx: { x: 520, y: 390 },
    colunas: 5,
    linhas: 4,
    passoX: 26.7,
    passoY: 28,
    larguraPx: 23,
    alturaPx: 23,
    rotacaoGraus: -1.5,
  },
  {
    id: 'pitaya-2',
    codigo: 'PI2',
    nome: 'Pitaya 2',
    culturas: ['Pitaya'],
    tipoFruteira: 'pitaya',
    tipo: 'fruteira',
    origemPx: { x: 709, y: 356 },
    colunas: 5,
    linhas: 4,
    passoX: 26.7,
    passoY: 26.5,
    larguraPx: 25,
    alturaPx: 25,
    rotacaoGraus: -1,
  },
  {
    id: 'pitaya-3',
    codigo: 'PI3',
    nome: 'Pitaya 3',
    culturas: ['Pitaya'],
    tipoFruteira: 'pitaya',
    tipo: 'fruteira',
    origemPx: { x: 533, y: 534 },
    colunas: 5,
    linhas: 4,
    passoX: 27.5,
    passoY: 30,
    larguraPx: 23,
    alturaPx: 24,
    rotacaoGraus: -1,
  },
  {
    id: 'pitaya-4',
    codigo: 'PI4',
    nome: 'Pitaya 4',
    culturas: ['Pitaya'],
    tipoFruteira: 'pitaya',
    tipo: 'fruteira',
    origemPx: { x: 546, y: 667 },
    colunas: 5,
    linhas: 4,
    passoX: 17.5,
    passoY: 19,
    larguraPx: 15,
    alturaPx: 15,
    rotacaoGraus: -1,
  },
];

/** Quantidade de plantas (parcelas) da quadra. Infraestrutura não possui plantas. */
export function totalPlantas(q: QuadraPomar): number {
  return q.tipo === 'equipamento' ? 0 : q.colunas * q.linhas;
}

export function isQuadraEquipamento(q: Pick<QuadraPomar, 'tipo'>): boolean {
  return q.tipo === 'equipamento';
}

export interface Ponto2D {
  x: number;
  z: number;
}

/** Converte um ponto em px da planta baixa para o mundo 3D (centralizado na imagem). */
export function pxParaMundo(px: number, py: number): Ponto2D {
  return {
    x: (px - IMAGEM_LARGURA_PX / 2) * PX_PARA_METRO,
    z: (py - IMAGEM_ALTURA_PX / 2) * PX_PARA_METRO,
  };
}

export interface GeometriaQuadra {
  /** Centro da quadra no mundo 3D */
  centro: Ponto2D;
  /** Dimensões da quadra no mundo 3D (largura em X local, profundidade em Z local) */
  largura: number;
  profundidade: number;
  /** Rotação em Y (three.js), em radianos */
  rotacaoY: number;
  /** Posição de cada planta no referencial local da quadra (centro da quadra = 0,0) */
  plantas: Array<{ x: number; z: number; w: number; d: number }>;
}

/** Calcula a geometria 3D de uma quadra a partir dos parâmetros em pixels. */
export function calcularGeometriaQuadra(q: QuadraPomar): GeometriaQuadra {
  const larguraPx = (q.colunas - 1) * q.passoX + q.larguraPx;
  const alturaPx = (q.linhas - 1) * q.passoY + q.alturaPx;
  const theta = (q.rotacaoGraus * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // O canto superior esquerdo é a âncora; o centro da quadra gira em torno dele.
  const cxLocal = larguraPx / 2;
  const cyLocal = alturaPx / 2;
  const centroPx = {
    x: q.origemPx.x + cxLocal * cos - cyLocal * sin,
    y: q.origemPx.y + cxLocal * sin + cyLocal * cos,
  };

  const plantas: GeometriaQuadra['plantas'] = [];
  for (let r = 0; r < q.linhas; r++) {
    for (let c = 0; c < q.colunas; c++) {
      plantas.push({
        x: (c * q.passoX + q.larguraPx / 2 - cxLocal) * PX_PARA_METRO,
        z: (r * q.passoY + q.alturaPx / 2 - cyLocal) * PX_PARA_METRO,
        w: q.larguraPx * PX_PARA_METRO,
        d: q.alturaPx * PX_PARA_METRO,
      });
    }
  }

  return {
    centro: pxParaMundo(centroPx.x, centroPx.y),
    largura: larguraPx * PX_PARA_METRO,
    profundidade: alturaPx * PX_PARA_METRO,
    // Rotação horária na tela (y para baixo) equivale a -theta em three.js
    rotacaoY: -theta,
    plantas,
  };
}

