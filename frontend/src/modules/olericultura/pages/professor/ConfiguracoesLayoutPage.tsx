import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Copy,
  RotateCw,
  Search,
  Sprout,
  Compass,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Maximize2,
  Move,
  Menu,
  Eye,
  List,
  RotateCcw,
  Sparkles,
  Info,
  Ruler,
} from 'lucide-react';
import { Button } from '../../../../components/Button';
import { TerrariumMenu } from '../../components/TerrariumMenu';
import { TerrariumIcons } from '../../components/layoutIcons';
import { APP_CONFIG } from '../../../../config/constants';
import {
  CanteiroData,
  TipoSetor,
  StatusCultura,
} from '../../data/horticulturaData';
import {
  canteiroLayoutService,
  NovoCanteiroInput,
  DimensoesTerreno,
} from '../../../../services/canteiroLayoutService';

// Origem de referência física do terreno no sistema de coordenadas (metros)
const TERRENO_X_MIN = -14.5;
const TERRENO_Z_MIN = -19.0;

export const ConfiguracoesLayoutPage: React.FC = () => {
  const [canteiros, setCanteiros] = useState<CanteiroData[]>(() =>
    canteiroLayoutService.listarCanteiros()
  );

  // Dimensões reais do lote da UEP
  const [dimensoesTerreno, setDimensoesTerreno] = useState<DimensoesTerreno>(() =>
    canteiroLayoutService.obterDimensoesTerreno()
  );

  const [modoVisualizacao, setModoVisualizacao] = useState<'mapa2d' | 'tabela'>('mapa2d');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [canteiroSelecionadoId, setCanteiroSelecionadoId] = useState<string | null>('c-01');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estados de Modais
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [canteiroParaExcluir, setCanteiroParaExcluir] = useState<CanteiroData | null>(null);
  const [modalRestaurar, setModalRestaurar] = useState(false);
  const [modalTerrenoAberto, setModalTerrenoAberto] = useState(false);

  // Formulário de Dimensões Reais do Terreno
  const [formTerrenoLargura, setFormTerrenoLargura] = useState(dimensoesTerreno.largura.toString());
  const [formTerrenoComprimento, setFormTerrenoComprimento] = useState(dimensoesTerreno.comprimento.toString());
  const [formTerrenoNome, setFormTerrenoNome] = useState(dimensoesTerreno.nomeArea || '');
  const [erroTerreno, setErroTerreno] = useState<string | null>(null);

  // Estados de Drag & Drop no SVG
  const svgRef = useRef<SVGSVGElement>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dz: number }>({ dx: 0, dz: 0 });

  // Formulário de Detalhes
  const [formCodigo, setFormCodigo] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formCultura, setFormCultura] = useState('');
  const [formVariedade, setFormVariedade] = useState('');
  const [formSetor, setFormSetor] = useState('Hortaliças Folhosas');
  const [formLargura, setFormLargura] = useState('1.2');
  const [formComprimento, setFormComprimento] = useState('6.0');
  const [formTurma, setFormTurma] = useState('Agronomia 2026.1');
  const [erroForm, setErroForm] = useState<string | null>(null);

  const canteiroSelecionado = useMemo(() => {
    return canteiros.find((c) => c.id === canteiroSelecionadoId) || null;
  }, [canteiros, canteiroSelecionadoId]);

  // Cálculos dinâmicos da geometria do terreno
  const areaTotalTerreno = useMemo(
    () => Number((dimensoesTerreno.largura * dimensoesTerreno.comprimento).toFixed(1)),
    [dimensoesTerreno]
  );

  const areaTotalCultivada = useMemo(() => {
    const soma = canteiros.reduce((acc, c) => acc + (c.areaM2 || c.posicao.largura * c.posicao.comprimento), 0);
    return Number(soma.toFixed(1));
  }, [canteiros]);

  const percentualOcupado = useMemo(() => {
    if (areaTotalTerreno <= 0) return 0;
    return Math.min(100, Number(((areaTotalCultivada / areaTotalTerreno) * 100).toFixed(1)));
  }, [areaTotalCultivada, areaTotalTerreno]);

  // ViewBox do SVG ajustado dinamicamente para as dimensões do terreno com margem de segurança
  const viewBoxX = useMemo(() => TERRENO_X_MIN - 2.0, []);
  const viewBoxWidth = useMemo(() => dimensoesTerreno.largura + 4.0, [dimensoesTerreno.largura]);
  const viewBoxZ = useMemo(() => TERRENO_Z_MIN - 3.0, []);
  const viewBoxHeight = useMemo(() => dimensoesTerreno.comprimento + 6.0, [dimensoesTerreno.comprimento]);

  const recarregar = () => {
    const atualizados = canteiroLayoutService.listarCanteiros();
    const terrenoAtual = canteiroLayoutService.obterDimensoesTerreno();
    setCanteiros(atualizados);
    setDimensoesTerreno(terrenoAtual);
    return atualizados;
  };

  const exibirFeedback = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleSalvarTerreno = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(formTerrenoLargura.replace(',', '.'));
    const c = parseFloat(formTerrenoComprimento.replace(',', '.'));

    if (isNaN(l) || l < 10 || l > 200) {
      setErroTerreno('A largura real do terreno deve estar entre 10m e 200m.');
      return;
    }
    if (isNaN(c) || c < 10 || c > 300) {
      setErroTerreno('O comprimento real do terreno deve estar entre 10m e 300m.');
      return;
    }

    const novas = canteiroLayoutService.atualizarDimensoesTerreno({
      largura: Number(l.toFixed(1)),
      comprimento: Number(c.toFixed(1)),
      nomeArea: formTerrenoNome.trim() || undefined,
    });

    setDimensoesTerreno(novas);
    setModalTerrenoAberto(false);
    exibirFeedback(
      `Dimensões do terreno atualizadas: ${novas.largura}m × ${novas.comprimento}m (${(novas.largura * novas.comprimento).toLocaleString('pt-BR')} m²)!`
    );
  };

  // Converte coordenadas do ponteiro (mouse/touch) para metros no plano SVG (X, Z)
  const converterParaCoordenadasMetros = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, z: 0 };

    if (typeof svgRef.current.getScreenCTM === 'function' && typeof svgRef.current.createSVGPoint === 'function') {
      const ctm = svgRef.current.getScreenCTM();
      if (ctm) {
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgPoint = pt.matrixTransform(ctm.inverse());
        return {
          x: Number(svgPoint.x.toFixed(2)),
          z: Number(svgPoint.y.toFixed(2)),
        };
      }
    }

    const rect = svgRef.current.getBoundingClientRect();
    const ratioX = (clientX - rect.left) / rect.width;
    const ratioZ = (clientY - rect.top) / rect.height;

    const x = viewBoxX + ratioX * viewBoxWidth;
    const z = viewBoxZ + ratioZ * viewBoxHeight;

    return {
      x: Number(x.toFixed(2)),
      z: Number(z.toFixed(2)),
    };
  }, [viewBoxX, viewBoxWidth, viewBoxZ, viewBoxHeight]);

  // Início do arraste
  const handlePointerDownCanteiro = (e: React.PointerEvent, canteiro: CanteiroData) => {
    // Permite mover qualquer canteiro de cultivo
    if (canteiro.tipo !== 'hortalica' && canteiro.tipo !== 'medicinal') {
      setCanteiroSelecionadoId(canteiro.id);
      return;
    }

    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    const coords = converterParaCoordenadasMetros(e.clientX, e.clientY);
    dragOffsetRef.current = {
      dx: canteiro.posicao.x - coords.x,
      dz: canteiro.posicao.z - coords.z,
    };

    setArrastandoId(canteiro.id);
    setCanteiroSelecionadoId(canteiro.id);
  };

  // Movimento de arraste com snap e restrição dinâmica aos limites reais do terreno
  const handlePointerMoveSvg = (e: React.PointerEvent) => {
    if (!arrastandoId) return;

    const coords = converterParaCoordenadasMetros(e.clientX, e.clientY);
    const novoXRaw = coords.x + dragOffsetRef.current.dx;
    const novoZRaw = coords.z + dragOffsetRef.current.dz;

    // Snap para grade de 0.5m e restrição aos limites do terreno
    const snapX = Math.round(novoXRaw * 2) / 2;
    const snapZ = Math.round(novoZRaw * 2) / 2;

    const xMin = TERRENO_X_MIN + 0.5;
    const xMax = TERRENO_X_MIN + dimensoesTerreno.largura - 0.5;
    const zMin = TERRENO_Z_MIN + 0.5;
    const zMax = TERRENO_Z_MIN + dimensoesTerreno.comprimento - 0.5;

    const xClamped = Math.max(xMin, Math.min(xMax, snapX));
    const zClamped = Math.max(zMin, Math.min(zMax, snapZ));

    setCanteiros((prev) =>
      prev.map((c) =>
        c.id === arrastandoId
          ? {
              ...c,
              posicao: {
                ...c.posicao,
                x: xClamped,
                z: zClamped,
              },
            }
          : c
      )
    );
  };

  // Fim do arraste e gravação automática no serviço
  const handlePointerUpSvg = () => {
    if (arrastandoId) {
      const canteiroMovido = canteiros.find((c) => c.id === arrastandoId);
      if (canteiroMovido) {
        canteiroLayoutService.atualizarCanteiro(arrastandoId, {
          posicao: canteiroMovido.posicao,
        });
        exibirFeedback(
          `Posição do canteiro ${canteiroMovido.codigo} calculada e salva: X=${canteiroMovido.posicao.x}m, Z=${canteiroMovido.posicao.z}m.`
        );
      }
      setArrastandoId(null);
    }
  };

  // Ações de Toolbar
  const handleAdicionarCanteiroFacil = () => {
    // Calcula automaticamente o próximo código e uma posição livre na UEP
    const totalCultivo = canteiros.filter((c) => c.tipo === 'hortalica').length;
    const novoCodigo = `C${(totalCultivo + 1).toString().padStart(2, '0')}`;

    // Posiciona logo abaixo do último canteiro ou numa posição central segura
    const ultimo = canteiros
      .filter((c) => c.tipo === 'hortalica')
      .sort((a, b) => b.posicao.z - a.posicao.z)[0];

    const posX = ultimo ? ultimo.posicao.x : 2.8;
    const posZ = ultimo ? Math.min(22, Number((ultimo.posicao.z + 3.0).toFixed(1))) : 0;

    const novo = canteiroLayoutService.adicionarCanteiro({
      codigo: novoCodigo,
      nome: `Canteiro ${novoCodigo}`,
      cultura: 'Cultivo Planejado',
      setor: 'Hortaliças Folhosas',
      tipo: 'hortalica',
      posicao: {
        x: posX,
        z: posZ,
        largura: 1.2,
        comprimento: 6.0,
        rotacao: 0,
      },
    });

    const atualizados = recarregar();
    setCanteiroSelecionadoId(novo.id);
    exibirFeedback(`Novo canteiro ${novoCodigo} inserido no mapa! Arraste-o para onde desejar.`);
  };

  const handleDuplicarSelecionado = () => {
    if (!canteiroSelecionado) return;
    try {
      const duplicado = canteiroLayoutService.duplicarCanteiro(canteiroSelecionado.id, {
        dx: 2.8,
        dz: 0,
      });
      recarregar();
      setCanteiroSelecionadoId(duplicado.id);
      exibirFeedback(`Canteiro ${duplicado.codigo} duplicado e posicionado na fileira ao lado!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao duplicar.');
    }
  };

  const handleGirar90Graus = () => {
    if (!canteiroSelecionado) return;
    const atualRad = canteiroSelecionado.posicao.rotacao || 0;
    const novoRad = Number((atualRad + Math.PI / 2).toFixed(4));

    canteiroLayoutService.atualizarCanteiro(canteiroSelecionado.id, {
      posicao: {
        ...canteiroSelecionado.posicao,
        rotacao: novoRad,
      },
    });

    recarregar();
    const graus = Math.round((novoRad * 180) / Math.PI) % 360;
    exibirFeedback(`Canteiro ${canteiroSelecionado.codigo} girado para ${graus}°!`);
  };

  const handleAjustarMedida = (dimensao: 'largura' | 'comprimento', delta: number) => {
    if (!canteiroSelecionado) return;
    const atual = canteiroSelecionado.posicao[dimensao];
    const nova = Math.max(0.6, Number((atual + delta).toFixed(1)));

    canteiroLayoutService.atualizarCanteiro(canteiroSelecionado.id, {
      posicao: {
        ...canteiroSelecionado.posicao,
        [dimensao]: nova,
      },
    });

    recarregar();
  };

  const abrirModalEditarDetalhes = (c: CanteiroData) => {
    setFormCodigo(c.codigo);
    setFormNome(c.nome);
    setFormCultura(c.cultura);
    setFormVariedade(c.variedade || '');
    setFormSetor(c.setor);
    setFormLargura(c.posicao.largura.toString());
    setFormComprimento(c.posicao.comprimento.toString());
    setFormTurma(c.turmaResponsavel);
    setErroForm(null);
    setModalEditarAberto(true);
  };

  const handleSalvarDetalhes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteiroSelecionado) return;

    try {
      canteiroLayoutService.atualizarCanteiro(canteiroSelecionado.id, {
        codigo: formCodigo.trim().toUpperCase(),
        nome: formNome.trim() || `Canteiro ${formCodigo.trim().toUpperCase()}`,
        cultura: formCultura.trim(),
        variedade: formVariedade.trim(),
        setor: formSetor,
        turmaResponsavel: formTurma,
        posicao: {
          ...canteiroSelecionado.posicao,
          largura: Math.max(0.5, parseFloat(formLargura.replace(',', '.')) || 1.2),
          comprimento: Math.max(0.5, parseFloat(formComprimento.replace(',', '.')) || 6.0),
        },
      });

      recarregar();
      setModalEditarAberto(false);
      exibirFeedback('Dados do canteiro atualizados com sucesso!');
    } catch (err: unknown) {
      setErroForm(err instanceof Error ? err.message : 'Falha ao salvar dados.');
    }
  };

  const handleExcluirConfirmado = (id: string) => {
    canteiroLayoutService.removerCanteiro(id);
    const atualizados = recarregar();
    setCanteiroParaExcluir(null);
    setCanteiroSelecionadoId(atualizados[0]?.id || null);
    exibirFeedback('Canteiro removido do layout da UEP com sucesso.');
  };

  const handleRestaurarPadrao = () => {
    const padrao = canteiroLayoutService.redefinirLayoutPadrao();
    setCanteiros(padrao);
    setDimensoesTerreno(canteiroLayoutService.obterDimensoesTerreno());
    setCanteiroSelecionadoId(padrao[0]?.id || null);
    setModalRestaurar(false);
    exibirFeedback('Layout padrão e medidas originais da UEP restaurados.');
  };

  const canteirosFiltrados = useMemo(() => {
    if (!busca.trim()) return canteiros;
    const termo = busca.toLowerCase().trim();
    return canteiros.filter(
      (c) =>
        c.codigo.toLowerCase().includes(termo) ||
        c.nome.toLowerCase().includes(termo) ||
        c.cultura.toLowerCase().includes(termo) ||
        c.setor.toLowerCase().includes(termo)
    );
  }, [canteiros, busca]);

  return (
    <div className="min-h-screen bg-[#f4f1e7] text-slate-800 font-sans pb-12 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-emerald-950/10 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu do sistema"
            className="group flex h-10 items-center gap-2 rounded-2xl bg-[#27633b] px-3.5 text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-4 w-4 transition group-hover:rotate-6" />
            <span className="text-xs font-bold tracking-wider uppercase">Menu</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-lg">
                Editor Visual de Layout 3D
              </h1>
              <span className="rounded-full bg-[#27633b]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#27633b]">
                Planta Baixa Interativa
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Clique e arraste os canteiros no terreno &bull; O sistema calcula as coordenadas automaticamente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de Modo: Mapa 2D vs Tabela */}
          <div className="hidden sm:flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setModoVisualizacao('mapa2d')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                modoVisualizacao === 'mapa2d'
                  ? 'bg-white text-[#27633b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Planta Baixa</span>
            </button>
            <button
              onClick={() => setModoVisualizacao('tabela')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                modoVisualizacao === 'tabela'
                  ? 'bg-white text-[#27633b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Lista Detalhada</span>
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setModalRestaurar(true)}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            title="Restaurar layout original da UEP"
          >
            <span className="hidden md:inline">Restaurar Padrão</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAdicionarCanteiroFacil}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Adicionar Canteiro
          </Button>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Notificação Flutuante de Sucesso */}
        {mensagemSucesso && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-950 flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-[#27633b] shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {modoVisualizacao === 'mapa2d' ? (
          /* ======================================================== */
          /* MODO STUDIO 2D: GRID INTERATIVO + PAINEL LATERAL (ESTILO GARDENBOX) */
          /* ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CANVAS INTERATIVO 2D DA UEP */}
            <div className="lg:col-span-8 rounded-3xl border border-stone-300/80 bg-white p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col">
              {/* Barra de Instruções & Bússola */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-[#27633b]">
                    <Move className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">
                    Clique em um canteiro e <strong>arraste</strong> para reposicioná-lo na grade
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTerrenoLargura(dimensoesTerreno.largura.toString());
                      setFormTerrenoComprimento(dimensoesTerreno.comprimento.toString());
                      setFormTerrenoNome(dimensoesTerreno.nomeArea || '');
                      setErroTerreno(null);
                      setModalTerrenoAberto(true);
                    }}
                    aria-label="Configurar tamanho real do terreno"
                    className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-900/15 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs"
                    title="Configurar dimensões reais do terreno"
                  >
                    <Ruler className="h-3.5 w-3.5 text-[#27633b]" />
                    <span>
                      Terreno: {dimensoesTerreno.largura}m &times; {dimensoesTerreno.comprimento}m ({areaTotalTerreno} m&sup2;)
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#27633b] bg-white px-1.5 py-0.5 rounded-md border border-emerald-900/10 ml-0.5">
                      Editar
                    </span>
                  </button>
                </div>
              </div>

              {/* Viewport SVG com Zoom e Drag */}
              <div className="relative mt-4 w-full h-[620px] bg-[#eef3ea] rounded-2xl border border-emerald-900/10 overflow-hidden cursor-crosshair">
                {/* Marcador da Entrada Principal */}
                <div className="pointer-events-none absolute bottom-3.5 inset-x-0 flex justify-center z-10">
                  <span className="rounded-full bg-white/95 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-xs border border-emerald-900/15 flex items-center gap-2 backdrop-blur-xs">
                    <span>&darr;</span>
                    <span>Entrada Principal</span>
                  </span>
                </div>

                <svg
                  ref={svgRef}
                  viewBox={`${viewBoxX} ${viewBoxZ} ${viewBoxWidth} ${viewBoxHeight}`}
                  className="w-full h-full"
                  onPointerMove={handlePointerMoveSvg}
                  onPointerUp={handlePointerUpSvg}
                >
                  <defs>
                    {/* Padrão de Grade Quadriculada em Metros (1m x 1m) */}
                    <pattern id="grid-1m" width="1" height="1" patternUnits="userSpaceOnUse">
                      <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#d5e2cd" strokeWidth="0.04" />
                    </pattern>
                    <pattern id="grid-5m" width="5" height="5" patternUnits="userSpaceOnUse">
                      <rect width="5" height="5" fill="url(#grid-1m)" />
                      <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#b9cfad" strokeWidth="0.1" />
                    </pattern>
                  </defs>

                  {/* Fundo do Terreno */}
                  <rect
                    x={viewBoxX}
                    y={viewBoxZ}
                    width={viewBoxWidth}
                    height={viewBoxHeight}
                    fill="#f7f6f0"
                  />

                  {/* Delimitação Perimetral Tracejada da UEP */}
                  <rect
                    x={TERRENO_X_MIN}
                    y={TERRENO_Z_MIN}
                    width={dimensoesTerreno.largura}
                    height={dimensoesTerreno.comprimento}
                    rx="1.5"
                    fill="url(#grid-5m)"
                    stroke="#27633b"
                    strokeWidth="0.32"
                    strokeDasharray="1.2 0.8"
                  />

                  {/* Rótulo de Dimensão no Topo do Terreno */}
                  <text
                    x={TERRENO_X_MIN + dimensoesTerreno.largura / 2}
                    y={TERRENO_Z_MIN - 0.9}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#27633b"
                    fontSize="0.9"
                    fontWeight="bold"
                  >
                    Largura Real do Terreno: {dimensoesTerreno.largura}m
                  </text>

                  {/* Caminho Central / Corredor Principal */}
                  <rect
                    x="-0.8"
                    y={TERRENO_Z_MIN + 1}
                    width="1.6"
                    height={Math.max(20, dimensoesTerreno.comprimento - 3)}
                    fill="#ded7c5"
                    opacity="0.85"
                    rx="0.3"
                  />

                  {/* Elementos da UEP (Infraestruturas e Canteiros) */}
                  {canteiros.map((canteiro) => {
                    const isSelecionado = canteiro.id === canteiroSelecionadoId;
                    const isArrastando = canteiro.id === arrastandoId;
                    const isInfra = canteiro.tipo !== 'hortalica' && canteiro.tipo !== 'medicinal';

                    const { x, z, largura, comprimento, rotacao } = canteiro.posicao;
                    const rectX = x - largura / 2;
                    const rectZ = z - comprimento / 2;
                    const graus = Math.round(((rotacao || 0) * 180) / Math.PI);

                    return (
                      <g
                        key={canteiro.id}
                        transform={`rotate(${graus}, ${x}, ${z})`}
                        onPointerDown={(e) => handlePointerDownCanteiro(e, canteiro)}
                        className={`transition-opacity ${
                          isInfra ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        {/* Caixa do Canteiro */}
                        <rect
                          x={rectX}
                          y={rectZ}
                          width={largura}
                          height={comprimento}
                          rx={0.25}
                          fill={isInfra ? '#475569' : isSelecionado ? '#27633b' : '#654321'}
                          stroke={isSelecionado ? '#22c55e' : isInfra ? '#334155' : '#452a15'}
                          strokeWidth={isSelecionado ? 0.35 : 0.12}
                          opacity={isArrastando ? 0.85 : 1}
                          filter={isSelecionado ? 'drop-shadow(0px 0px 0.5px rgba(34,197,94,0.8))' : undefined}
                        />

                        {/* Solo Interno do Canteiro */}
                        {!isInfra && (
                          <rect
                            x={rectX + 0.15}
                            y={rectZ + 0.15}
                            width={Math.max(0.1, largura - 0.3)}
                            height={Math.max(0.1, comprimento - 0.3)}
                            rx={0.15}
                            fill={isSelecionado ? '#1b4a2c' : '#2a1d15'}
                          />
                        )}

                        {/* Rótulo de Identificação (Código) */}
                        <text
                          x={x}
                          y={z}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize={isInfra ? '0.9' : '0.8'}
                          fontWeight="bold"
                          fontFamily="monospace"
                          pointerEvents="none"
                        >
                          {canteiro.codigo}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legenda do Mapa */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-[#654321]" />
                    <span>Canteiros de Cultivo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-[#27633b] ring-2 ring-emerald-400" />
                    <span>Canteiro Selecionado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-[#475569]" />
                    <span>Apoio / Infraestrutura</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Total renderizado: <strong>{canteiros.length} elementos</strong>
                </div>
              </div>
            </div>

            {/* PAINEL LATERAL DE PROPRIEDADES (INSPECTOR DE OBJETO) */}
            <div className="lg:col-span-4 rounded-3xl border border-stone-300/80 bg-white p-5 sm:p-6 shadow-sm space-y-5">
              {canteiroSelecionado ? (
                <>
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-xl bg-[#27633b] px-3 py-1 font-mono text-sm font-black text-white shadow-xs">
                        {canteiroSelecionado.codigo}
                      </span>
                      <span
                        style={{
                          backgroundColor: `${canteiroSelecionado.statusColor}18`,
                          color: canteiroSelecionado.statusColor,
                        }}
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      >
                        {canteiroSelecionado.statusLabel}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-extrabold text-slate-900">
                      {canteiroSelecionado.nome}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-800">
                      {canteiroSelecionado.cultura}
                    </p>
                  </div>

                  {/* Coordenadas Calculadas Automaticamente pelo Sistema */}
                  <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#174b32] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#27633b]" />
                        Coordenadas 3D Automáticas:
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="rounded-xl bg-white p-2 border border-emerald-200/60">
                        <span className="text-[10px] font-bold text-slate-400 block">Posição X (Leste-Oeste)</span>
                        <span className="font-mono text-sm font-black text-slate-800">
                          {canteiroSelecionado.posicao.x} m
                        </span>
                      </div>
                      <div className="rounded-xl bg-white p-2 border border-emerald-200/60">
                        <span className="text-[10px] font-bold text-slate-400 block">Posição Z (Norte-Sul)</span>
                        <span className="font-mono text-sm font-black text-slate-800">
                          {canteiroSelecionado.posicao.z} m
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-800/80 text-center leading-tight pt-1">
                      Você não precisa digitar nada: ao arrastar o canteiro no mapa, esses valores são recalculados sozinhos!
                    </p>
                  </div>

                  {/* Ajuste Rápido de Dimensões e Orientação */}
                  <div className="space-y-3 pt-1">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                      Dimensões Físicas no Terreno
                    </span>

                    {/* Largura */}
                    <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-2.5 border border-stone-200">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">Largura</span>
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          {canteiroSelecionado.posicao.largura} metros
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAjustarMedida('largura', -0.2)}
                          className="h-7 w-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAjustarMedida('largura', 0.2)}
                          className="h-7 w-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Comprimento */}
                    <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-2.5 border border-stone-200">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">Comprimento</span>
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          {canteiroSelecionado.posicao.comprimento} metros
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAjustarMedida('comprimento', -0.5)}
                          className="h-7 w-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAjustarMedida('comprimento', 0.5)}
                          className="h-7 w-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Área total */}
                    <div className="flex items-center justify-between px-3 text-xs text-slate-500 font-medium">
                      <span>Área cultivável:</span>
                      <span className="font-mono font-bold text-[#27633b]">
                        {canteiroSelecionado.areaM2} m²
                      </span>
                    </div>
                  </div>

                  {/* Ações com o Canteiro Selecionado */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleGirar90Graus}
                        leftIcon={<RotateCw className="h-3.5 w-3.5" />}
                        title="Girar o canteiro em 90 graus"
                        fullWidth
                      >
                        Girar 90°
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleDuplicarSelecionado}
                        leftIcon={<Copy className="h-3.5 w-3.5" />}
                        title="Duplicar canteiro ao lado"
                        fullWidth
                      >
                        Duplicar
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalEditarDetalhes(canteiroSelecionado)}
                      leftIcon={<Settings className="h-3.5 w-3.5" />}
                      fullWidth
                    >
                      Editar Dados Agronômicos
                    </Button>

                    {canteiroSelecionado.tipo === 'hortalica' && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setCanteiroParaExcluir(canteiroSelecionado)}
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        fullWidth
                      >
                        Excluir Canteiro
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Compass className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold">
                    Clique em um canteiro no mapa para inspecionar e editar
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MODO LISTA / TABELA DETALHADA */
          /* ======================================================== */
          <div className="space-y-4">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por código, nome, cultura..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#27633b] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {canteirosFiltrados.map((c) => (
                <div
                  key={c.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold bg-[#27633b] text-white px-2.5 py-1 rounded-xl">
                        {c.codigo}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{c.setor}</span>
                    </div>

                    <h4 className="mt-3 text-sm font-bold text-slate-900">{c.nome}</h4>
                    <p className="text-xs text-emerald-800 font-semibold">{c.cultura}</p>

                    <div className="mt-3 rounded-2xl bg-stone-50 p-2.5 text-[11px] space-y-1 text-slate-600">
                      <div>
                        Dimensões: <strong>{c.posicao.largura}m &times; {c.posicao.comprimento}m ({c.areaM2}m²)</strong>
                      </div>
                      <div>
                        Coordenadas: <strong>X={c.posicao.x}m, Z={c.posicao.z}m</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {c.tipo === 'hortalica' ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setCanteiroParaExcluir(c)}
                        leftIcon={<TerrariumIcons.Excluir className="h-3.5 w-3.5" />}
                        title={`Excluir canteiro ${c.codigo}`}
                      >
                        Excluir
                      </Button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCanteiroSelecionadoId(c.id);
                          setModoVisualizacao('mapa2d');
                        }}
                        leftIcon={<TerrariumIcons.VerNoMapa className="h-3.5 w-3.5" />}
                      >
                        Ver no Mapa
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalEditarDetalhes(c)}
                        leftIcon={<TerrariumIcons.Editar className="h-3.5 w-3.5" />}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Editar Informações Agronômicas */}
      {modalEditarAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Editar Dados do Canteiro {formCodigo}
              </h3>
              <button
                type="button"
                onClick={() => setModalEditarAberto(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarDetalhes} className="mt-4 space-y-3.5">
              {erroForm && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Código</label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase focus:border-[#27633b] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Nome</label>
                  <input
                    type="text"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Cultura Plantada</label>
                  <input
                    type="text"
                    value={formCultura}
                    onChange={(e) => setFormCultura(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Setor</label>
                  <select
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-hidden bg-white"
                  >
                    <option value="Hortaliças Folhosas">Hortaliças Folhosas</option>
                    <option value="Raízes e Tubérculos">Raízes e Tubérculos</option>
                    <option value="Brássicas">Brássicas</option>
                    <option value="Cucurbitáceas">Cucurbitáceas</option>
                    <option value="Frutos Solanáceas">Frutos Solanáceas</option>
                    <option value="Condimentares e Folhosas">Condimentares</option>
                    <option value="Plantas Medicinais">Plantas Medicinais</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Largura (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={formLargura}
                    onChange={(e) => setFormLargura(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:border-[#27633b] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Comprimento (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={formComprimento}
                    onChange={(e) => setFormComprimento(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:border-[#27633b] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Turma Responsável</label>
                <input
                  type="text"
                  value={formTurma}
                  onChange={(e) => setFormTurma(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setModalEditarAberto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="md" fullWidth>
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Canteiro */}
      {canteiroParaExcluir && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900">
              Excluir Canteiro {canteiroParaExcluir.codigo}?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              O canteiro <strong>{canteiroParaExcluir.nome}</strong> deixará de ser renderizado na UEP e no mapa 3D.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setCanteiroParaExcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                fullWidth
                onClick={() => handleExcluirConfirmado(canteiroParaExcluir.id)}
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Restauração do Layout Padrão */}
      {modalRestaurar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <RotateCcw className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900">
              Restaurar Layout Original da UEP?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Todas as modificações de posições e novos canteiros serão restaurados para a planta arquitetural original.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setModalRestaurar(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={handleRestaurarPadrao}
              >
                Confirmar Restauração
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Dimensões Reais do Terreno */}
      {modalTerrenoAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-[#27633b]">
                  <Ruler className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Dimensões Reais do Terreno
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajuste o tamanho físico do terreno para refletir o espaço real da UEP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTerrenoAberto(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroTerreno && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{erroTerreno}</span>
              </div>
            )}

            <form onSubmit={handleSalvarTerreno} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nome / Identificação da Área
                </label>
                <input
                  type="text"
                  value={formTerrenoNome}
                  onChange={(e) => setFormTerrenoNome(e.target.value)}
                  placeholder="Ex: UEP Vegetais - Olericultura & Plantas Medicinais"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Largura Real (Eixo X em metros)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="200"
                      value={formTerrenoLargura}
                      onChange={(e) => setFormTerrenoLargura(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-8 text-xs font-semibold focus:border-[#27633b] focus:outline-hidden"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">m</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Ex: 32m (leste a oeste)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Comprimento Real (Eixo Z em metros)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="300"
                      value={formTerrenoComprimento}
                      onChange={(e) => setFormTerrenoComprimento(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-8 text-xs font-semibold focus:border-[#27633b] focus:outline-hidden"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">m</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Ex: 60m (norte ao sul)</span>
                </div>
              </div>

              {/* Painel de Cálculo em Tempo Real */}
              <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-900/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span>Área Total Calculada:</span>
                  <span className="text-sm font-extrabold text-[#27633b]">
                    {(
                      (parseFloat(formTerrenoLargura.replace(',', '.')) || 0) *
                      (parseFloat(formTerrenoComprimento.replace(',', '.')) || 0)
                    ).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                    m²
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Canteiros Atuais:</span>{' '}
                    <strong>{canteiros.length} elementos</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Área Ocupada:</span>{' '}
                    <strong>{areaTotalCultivada} m² ({percentualOcupado}%)</strong>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug pt-1">
                  💡 Aumentar as dimensões reais expande os limites do grid 2D e do mapa 3D, permitindo adicionar novos canteiros e planejar expansões físicas.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setModalTerrenoAberto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="md" fullWidth>
                  Salvar Medidas do Terreno
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Lateral do Sistema */}
      <TerrariumMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};
