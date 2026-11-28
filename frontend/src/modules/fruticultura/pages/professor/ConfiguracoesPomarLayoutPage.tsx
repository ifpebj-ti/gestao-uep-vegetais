import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Menu,
  Plus,
  Trash2,
  Compass,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Move,
  RotateCcw,
  TreeDeciduous,
  List,
  Edit2,
} from 'lucide-react';
import { Button } from '../../../../components/Button';
import {
  QuadraPomar,
  TipoFruteira,
  CORES_FRUTEIRAS,
  totalPlantas,
  isQuadraEquipamento,
  IMAGEM_LARGURA_PX,
  IMAGEM_ALTURA_PX,
} from '../../data/pomarData';
import {
  pomarLayoutService,
  NovaQuadraInput,
} from '../../../../services/pomarLayoutService';
import { PomarMenu } from '../../components/PomarMenu';

const TIPOS_FRUTEIRAS_OPCOES: Array<{ id: TipoFruteira; label: string }> = [
  { id: 'goiaba', label: 'Goiaba' },
  { id: 'banana', label: 'Banana' },
  { id: 'manga', label: 'Manga' },
  { id: 'coco', label: 'Coco' },
  { id: 'uva', label: 'Uva (Videira/Latada)' },
  { id: 'citros', label: 'Citros (Laranja, Limão, Caju)' },
  { id: 'graviola', label: 'Graviola e Pinha' },
  { id: 'pitaya', label: 'Pitaya' },
  { id: 'equipamento', label: 'Sala de Equipamento / Infraestrutura' },
];

export const ConfiguracoesPomarLayoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quadras, setQuadras] = useState<QuadraPomar[]>(() =>
    pomarLayoutService.listarQuadras()
  );

  const [modoVisualizacao, setModoVisualizacao] = useState<'mapa2d' | 'tabela'>('mapa2d');
  const [quadraSelecionadaId, setQuadraSelecionadaId] = useState<string | null>('banana');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Modais
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalNovaQuadra, setModalNovaQuadra] = useState(false);
  const [quadraParaExcluir, setQuadraParaExcluir] = useState<QuadraPomar | null>(null);
  const [modalRestaurar, setModalRestaurar] = useState(false);

  // Drag & drop no SVG interativo
  const svgRef = useRef<SVGSVGElement>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Formulário de Edição
  const [formCodigo, setFormCodigo] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formCulturas, setFormCulturas] = useState('');
  const [formTipo, setFormTipo] = useState<TipoFruteira>('banana');
  const [formColunas, setFormColunas] = useState('10');
  const [formLinhas, setFormLinhas] = useState('4');
  const [formPassoX, setFormPassoX] = useState('25');
  const [formPassoY, setFormPassoY] = useState('25');
  const [formRotacao, setFormRotacao] = useState('0');
  const [erroForm, setErroForm] = useState<string | null>(null);

  const quadraSelecionada = useMemo(() => {
    return quadras.find((q) => q.id === quadraSelecionadaId) || null;
  }, [quadras, quadraSelecionadaId]);

  const totalGeralPlantas = useMemo(() => {
    return quadras.reduce((acc, q) => acc + totalPlantas(q), 0);
  }, [quadras]);

  const quadrasFiltradas = quadras;

  const selecionarQuadra = (q: QuadraPomar) => {
    setQuadraSelecionadaId(q.id);
  };

  const abrirModalEditar = (q: QuadraPomar) => {
    setQuadraSelecionadaId(q.id);
    setFormCodigo(q.codigo);
    setFormNome(q.nome);
    setFormCulturas(q.culturas.join(', '));
    setFormTipo(q.tipoFruteira);
    setFormColunas(q.colunas.toString());
    setFormLinhas(q.linhas.toString());
    setFormPassoX(q.passoX.toString());
    setFormPassoY(q.passoY.toString());
    setFormRotacao(q.rotacaoGraus.toString());
    setErroForm(null);
    setModalEditarAberto(true);
  };

  useEffect(() => {
    const quadraParam = searchParams.get('quadra');
    if (quadraParam) {
      const alvo = quadras.find((q) => q.id === quadraParam);
      if (alvo) {
        setQuadraSelecionadaId(alvo.id);
        if (searchParams.get('editar') === 'true') {
          abrirModalEditar(alvo);
        }
      }
    }
  }, [searchParams]);

  const salvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quadraSelecionada) return;

    if (!formNome.trim() || !formCodigo.trim()) {
      setErroForm('Código e Nome são obrigatórios.');
      return;
    }

    const culturasArray = formCulturas
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const atualizada = pomarLayoutService.atualizarQuadra(quadraSelecionada.id, {
        codigo: formCodigo.trim().toUpperCase(),
        nome: formNome.trim(),
        culturas: culturasArray.length > 0 ? culturasArray : ['Fruteira'],
        tipoFruteira: formTipo,
        tipo: formTipo === 'equipamento' ? 'equipamento' : formTipo === 'uva' ? 'videira' : 'fruteira',
        colunas: Math.max(1, parseInt(formColunas, 10) || 1),
        linhas: Math.max(1, parseInt(formLinhas, 10) || 1),
        passoX: Math.max(1, parseFloat(formPassoX) || 20),
        passoY: Math.max(1, parseFloat(formPassoY) || 20),
        rotacaoGraus: parseFloat(formRotacao) || 0,
      });

      setQuadras(pomarLayoutService.listarQuadras());
      setModalEditarAberto(false);
      setMensagemSucesso(`Quadra ${atualizada.nome} atualizada com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  };

  const abrirModalNova = () => {
    setFormCodigo(`Q${quadras.length + 1}`);
    setFormNome(`Nova Quadra ${quadras.length + 1}`);
    setFormCulturas('Laranja');
    setFormTipo('citros');
    setFormColunas('6');
    setFormLinhas('4');
    setFormPassoX('25');
    setFormPassoY('25');
    setFormRotacao('0');
    setErroForm(null);
    setModalNovaQuadra(true);
  };

  const salvarNovaQuadra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formCodigo.trim()) {
      setErroForm('Código e Nome são obrigatórios.');
      return;
    }

    const culturasArray = formCulturas
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const input: NovaQuadraInput = {
      codigo: formCodigo.trim().toUpperCase(),
      nome: formNome.trim(),
      culturas: culturasArray.length > 0 ? culturasArray : ['Fruteira'],
      tipoFruteira: formTipo,
      tipo: formTipo === 'equipamento' ? 'equipamento' : formTipo === 'uva' ? 'videira' : 'fruteira',
      colunas: Math.max(1, parseInt(formColunas, 10) || 1),
      linhas: Math.max(1, parseInt(formLinhas, 10) || 1),
      passoX: Math.max(1, parseFloat(formPassoX) || 24),
      passoY: Math.max(1, parseFloat(formPassoY) || 24),
      larguraPx: formTipo === 'uva' ? 180 : 22,
      alturaPx: formTipo === 'uva' ? 14 : 22,
      origemPx: { x: 400, y: 300 },
      rotacaoGraus: parseFloat(formRotacao) || 0,
    };

    try {
      const nova = pomarLayoutService.adicionarQuadra(input);
      setQuadras(pomarLayoutService.listarQuadras());
      setQuadraSelecionadaId(nova.id);
      setModalNovaQuadra(false);
      setMensagemSucesso(`Quadra ${nova.nome} cadastrada com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : 'Erro ao adicionar.');
    }
  };

  const confirmarExclusao = () => {
    if (!quadraParaExcluir) return;
    pomarLayoutService.removerQuadra(quadraParaExcluir.id);
    const lista = pomarLayoutService.listarQuadras();
    setQuadras(lista);
    setQuadraSelecionadaId(lista[0]?.id || null);
    setQuadraParaExcluir(null);
    setMensagemSucesso('Quadra removida com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const confirmarRestaurar = () => {
    const padrao = pomarLayoutService.restaurarPadrao();
    setQuadras(padrao);
    setQuadraSelecionadaId('banana');
    setModalRestaurar(false);
    setMensagemSucesso('Layout restaurado para o padrão arquitetônico original!');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  // Drag & drop handlers para arrastar quadras livremente pelo SVG da planta baixa
  const handleMouseDownQuadra = (e: React.MouseEvent, q: QuadraPomar) => {
    e.stopPropagation();
    setQuadraSelecionadaId(q.id);
    setArrastandoId(q.id);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = IMAGEM_LARGURA_PX / rect.width;
      const scaleY = IMAGEM_ALTURA_PX / rect.height;
      const mouseSvgX = (e.clientX - rect.left) * scaleX;
      const mouseSvgY = (e.clientY - rect.top) * scaleY;

      dragOffsetRef.current = {
        dx: mouseSvgX - q.origemPx.x,
        dy: mouseSvgY - q.origemPx.y,
      };
    }
  };

  const handleMouseMoveSvg = (e: React.MouseEvent) => {
    if (!arrastandoId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = IMAGEM_LARGURA_PX / rect.width;
    const scaleY = IMAGEM_ALTURA_PX / rect.height;
    const mouseSvgX = (e.clientX - rect.left) * scaleX;
    const mouseSvgY = (e.clientY - rect.top) * scaleY;

    const novaOrigemX = Math.round(mouseSvgX - dragOffsetRef.current.dx);
    const novaOrigemY = Math.round(mouseSvgY - dragOffsetRef.current.dy);

    setQuadras((antigas) =>
      antigas.map((q) => {
        if (q.id !== arrastandoId) return q;
        return {
          ...q,
          origemPx: { x: novaOrigemX, y: novaOrigemY },
        };
      })
    );
  };

  const handleMouseUpSvg = () => {
    if (!arrastandoId) return;
    const alvo = quadras.find((q) => q.id === arrastandoId);
    if (alvo) {
      pomarLayoutService.atualizarQuadra(alvo.id, {
        origemPx: alvo.origemPx,
      });
    }
    setArrastandoId(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1e7] font-sans text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-white/95 px-4 py-3 sm:px-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menu de navegação do sistema"
              className="group flex h-10 items-center gap-2 rounded-xl bg-[#27633b] px-3.5 text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Menu do Sistema Terrarium"
            >
              <Menu className="h-4 w-4 transition group-hover:rotate-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Menu</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center rounded-md bg-[#27633b]/10 px-2 text-[11px] font-bold text-[#27633b]">
                  UEP Fruticultura
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Configuração & Gestão</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Editor de Layout e Plantações do Pomar
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/fruticultura/professor/pomar')}
              leftIcon={<Compass className="h-4 w-4 text-[#27633b]" />}
            >
              <span>Ver Pomar 3D</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={abrirModalNova}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              <span>Nova Quadra</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Alerta de Feedback */}
      {mensagemSucesso && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        {/* Lado Esquerdo: Canvas 2D da Planta Baixa e Controles */}
        <div className="flex flex-1 flex-col rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          {/* Barra de Ações Superior do Canvas */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setModoVisualizacao('mapa2d')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  modoVisualizacao === 'mapa2d'
                    ? 'bg-white text-[#27633b] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Planta Baixa (2D)</span>
              </button>
              <button
                onClick={() => setModoVisualizacao('tabela')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  modoVisualizacao === 'tabela'
                    ? 'bg-white text-[#27633b] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Lista Detalhada ({quadras.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalRestaurar(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                title="Restaurar layout original do pomar"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Restaurar Padrão</span>
              </button>
            </div>
          </div>

          {/* Área Central: Visualização 2D Interativa OU Lista */}
          {modoVisualizacao === 'mapa2d' ? (
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-[#f9f8f4] p-3 select-none">
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-md">
                <Move className="h-3.5 w-3.5 text-[#27633b]" />
                <span>Arraste as quadras para reposicionar livremente</span>
              </div>

              <svg
                ref={svgRef}
                viewBox={`0 0 ${IMAGEM_LARGURA_PX} ${IMAGEM_ALTURA_PX}`}
                className="w-full h-auto max-h-[620px] rounded-xl cursor-crosshair"
                onMouseMove={handleMouseMoveSvg}
                onMouseUp={handleMouseUpSvg}
                onMouseLeave={handleMouseUpSvg}
              >
                {/* Linhas de Grade Suave */}
                <defs>
                  <pattern id="gridPomar" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e6dec8" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridPomar)" />

                {/* Renderização das Quadras e Parcelas */}
                {quadras.map((q) => {
                  const isSelecionada = q.id === quadraSelecionadaId;
                  const cor = CORES_FRUTEIRAS[q.tipoFruteira].label;
                  const larguraTotalPx = (q.colunas - 1) * q.passoX + q.larguraPx;
                  const alturaTotalPx = (q.linhas - 1) * q.passoY + q.alturaPx;

                  return (
                    <g
                      key={q.id}
                      transform={`translate(${q.origemPx.x}, ${q.origemPx.y}) rotate(${q.rotacaoGraus})`}
                      onMouseDown={(e) => handleMouseDownQuadra(e, q)}
                      className="cursor-move transition-transform"
                    >
                      {/* Borda / Fundo de seleção */}
                      <rect
                        x={-4}
                        y={-4}
                        width={larguraTotalPx + 8}
                        height={alturaTotalPx + 8}
                        rx={6}
                        fill={isSelecionada ? 'rgba(46, 125, 50, 0.12)' : 'rgba(255, 255, 255, 0.6)'}
                        stroke={isSelecionada ? '#2e7d32' : '#cbd5e1'}
                        strokeWidth={isSelecionada ? 2.5 : 1}
                        strokeDasharray={isSelecionada ? '4 2' : 'none'}
                      />

                      {/* Plantas ou galpão dentro da quadra */}
                      {isQuadraEquipamento(q) ? (
                        <rect
                          x={0}
                          y={0}
                          width={q.larguraPx}
                          height={q.alturaPx}
                          rx={4}
                          fill="#94a3b8"
                          stroke="#64748b"
                          strokeWidth={1.5}
                        />
                      ) : (
                        Array.from({ length: q.linhas }).map((_, r) =>
                          Array.from({ length: q.colunas }).map((_, c) => (
                            <rect
                              key={`${r}-${c}`}
                              x={c * q.passoX}
                              y={r * q.passoY}
                              width={q.larguraPx}
                              height={q.alturaPx}
                              rx={3}
                              fill={cor}
                              fillOpacity={0.85}
                              stroke="#ffffff"
                              strokeWidth={0.8}
                            />
                          ))
                        )
                      )}

                      {/* Rótulo Centralizado com o Nome */}
                      <text
                        x={larguraTotalPx / 2}
                        y={alturaTotalPx / 2 + 4}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="bold"
                        fill="#0f172a"
                        className="pointer-events-none select-none"
                        style={{
                          paintOrder: 'stroke',
                          stroke: '#ffffff',
                          strokeWidth: 3,
                          strokeLinecap: 'butt',
                          strokeLinejoin: 'miter',
                        }}
                      >
                        {q.nome}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* Visualização em Lista / Tabela */
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-[10px] tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Cód</th>
                    <th className="px-4 py-3">Quadra / Cultura</th>
                    <th className="px-4 py-3">Culturas</th>
                    <th className="px-4 py-3 text-center">Grade (Col x Lin)</th>
                    <th className="px-4 py-3 text-center">Plantas</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quadrasFiltradas.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => selecionarQuadra(q)}
                      className={`cursor-pointer transition hover:bg-emerald-50/40 ${
                        q.id === quadraSelecionadaId ? 'bg-emerald-50/80 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#27633b]">{q.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CORES_FRUTEIRAS[q.tipoFruteira].label }}
                          />
                          <span>{q.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{q.culturas.join(', ')}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono">
                        {q.colunas} × {q.linhas}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {totalPlantas(q)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEditar(q);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition"
                            title="Editar quadra"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuadraParaExcluir(q);
                            }}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                            title="Excluir quadra"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé informativo */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Total de <strong>{quadras.length}</strong> quadras cadastradas •{' '}
              <strong>{totalGeralPlantas}</strong> plantas no pomar
            </span>
            <span className="text-[11px] text-slate-400">
              Coordenadas sincronizadas com o mapa 3D
            </span>
          </div>
        </div>

        {/* Lado Direito: Inspector / Painel de Detalhes da Quadra */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Inspetor da Quadra
            </h2>

            {quadraSelecionada ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 min-w-10 px-2 items-center justify-center rounded-xl bg-[#27633b] font-mono text-sm font-bold text-white shadow-sm">
                      {quadraSelecionada.codigo}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {quadraSelecionada.nome}
                      </h3>
                      <p className="text-xs text-emerald-800 font-medium">
                        {quadraSelecionada.culturas.join(', ')}
                      </p>
                    </div>
                  </div>

                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CORES_FRUTEIRAS[quadraSelecionada.tipoFruteira].copa }}
                    title={quadraSelecionada.tipoFruteira}
                  />
                </div>

                {/* Métricas da Quadra */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Total de Plantas
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {totalPlantas(quadraSelecionada)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {quadraSelecionada.colunas} cols × {quadraSelecionada.linhas} lin
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Espaçamento
                    </span>
                    <p className="text-lg font-black text-emerald-800 mt-0.5">
                      {quadraSelecionada.passoX} × {quadraSelecionada.passoY}
                    </p>
                    <p className="text-[11px] text-slate-500">passo (px) / grade</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Posição (X, Y)
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                      {quadraSelecionada.origemPx.x}, {quadraSelecionada.origemPx.y}
                    </p>
                    <p className="text-[10px] text-slate-400">canto superior esquerdo</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Rotação
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                      {quadraSelecionada.rotacaoGraus}°
                    </p>
                    <p className="text-[10px] text-slate-400">ângulo de alinhamento</p>
                  </div>
                </div>

                {/* Ações da Quadra */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => abrirModalEditar(quadraSelecionada)}
                    leftIcon={<Edit2 className="h-4 w-4" />}
                  >
                    Editar Plantações & Geometria
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setQuadraParaExcluir(quadraSelecionada)}
                    leftIcon={<Trash2 className="h-4 w-4 text-red-500" />}
                  >
                    Excluir Quadra
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Selecione uma quadra no mapa ou na lista para editar suas propriedades.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL: EDITAR / CRIAR QUADRA */}
      {(modalEditarAberto || modalNovaQuadra) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#27633b]">
                  <TreeDeciduous className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalEditarAberto ? `Editar ${formNome}` : 'Cadastrar Nova Quadra no Pomar'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setModalEditarAberto(false);
                  setModalNovaQuadra(false);
                }}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={modalEditarAberto ? salvarEdicao : salvarNovaQuadra} className="mt-4 space-y-3.5 text-xs">
              {erroForm && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Código</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ex: BA, GO1, UV"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase focus:border-[#27633b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Espécie Frutífera</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoFruteira)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                  >
                    {TIPOS_FRUTEIRAS_OPCOES.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600">Nome da Quadra / Bloco</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Goiaba Paluma • Bloco Norte"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600">
                  Culturas Plantadas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formCulturas}
                  onChange={(e) => setFormCulturas(e.target.value)}
                  placeholder="Ex: Laranja, Limão, Caju"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-600">Colunas (por linha)</label>
                  <input
                    type="number"
                    min="1"
                    value={formColunas}
                    onChange={(e) => setFormColunas(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Linhas (fileiras)</label>
                  <input
                    type="number"
                    min="1"
                    value={formLinhas}
                    onChange={(e) => setFormLinhas(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-600">Passo X (px)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formPassoX}
                    onChange={(e) => setFormPassoX(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Passo Y (px)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formPassoY}
                    onChange={(e) => setFormPassoY(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Rotação (°)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formRotacao}
                    onChange={(e) => setFormRotacao(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#27633b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModalEditarAberto(false);
                    setModalNovaQuadra(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {modalEditarAberto ? 'Salvar Alterações' : 'Cadastrar Quadra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {quadraParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Excluir {quadraParaExcluir.nome}?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Tem certeza que deseja remover esta quadra do pomar? Essa ação removerá o canteiro e suas árvores do mapa 3D.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuadraParaExcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmarExclusao}
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR RESTAURAÇÃO */}
      {modalRestaurar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Restaurar Layout Padrão?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Todas as posições, rotações e novas quadras serão redefinidas para o desenho arquitetônico original do pomar.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalRestaurar(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmarRestaurar}
              >
                Confirmar Restauração
              </Button>
            </div>
          </div>
        </div>
      )}

      <PomarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};
