export type UepType = 'olericultura' | 'fruticultura';

export interface UepConfig {
  id: UepType;
  nome: string;
  descricao: string;
  icone?: string;
}
