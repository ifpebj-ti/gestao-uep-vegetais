import {
  Ruler,
  Menu,
  Plus,
  Trash2,
  Settings,
  Copy,
  RotateCw,
  RotateCcw,
  Layers,
  List,
  Eye,
  Search,
  Move,
  CheckCircle2,
  AlertCircle,
  X,
  Sprout,
  Compass,
  Sparkles,
  Info,
  Maximize2,
} from 'lucide-react';

/**
 * Catálogo centralizado e modular de ícones reaproveitáveis do Terrarium.
 * Facilita a manutenção e expansão consistente entre módulos (Olericultura, Fruticultura, etc).
 */
export const TerrariumIcons = {
  // Gestão Física e Terreno
  Terreno: Ruler,
  Menu: Menu,
  Adicionar: Plus,
  Excluir: Trash2,
  Editar: Settings,
  Duplicar: Copy,
  Girar: RotateCw,
  Restaurar: RotateCcw,
  Mover: Move,

  // Navegação e Modos de Visão
  Planta2D: Layers,
  Lista: List,
  VerNoMapa: Eye,
  Buscar: Search,
  Bussola: Compass,
  Expandir: Maximize2,

  // Feedback e Status
  Sucesso: CheckCircle2,
  Alerta: AlertCircle,
  Fechar: X,
  Dica: Info,
  Especial: Sparkles,
  Cultivo: Sprout,
} as const;

