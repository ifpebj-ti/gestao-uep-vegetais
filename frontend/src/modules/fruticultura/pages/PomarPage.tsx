import React, { useState, useRef } from 'react';
import { Menu, X, Compass, Layers, Eye, RotateCcw, Apple, TreeDeciduous } from 'lucide-react';
import { PomarMap, PomarMapRef } from '../components/PomarMap';
import { PomarMenu } from '../components/PomarMenu';
import { QUADRAS_POMAR, QuadraPomar, CORES_FRUTEIRAS, totalPlantas } from '../data/pomarData';
import { APP_CONFIG } from '../../../config/constants';

export const PomarPage: React.FC = () => {
  const mapRef = useRef<PomarMapRef>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedQuadra, setSelectedQuadra] = useState<QuadraPomar | null>(null);
  const [activePreset, setActivePreset] = useState<'isometric' | 'topdown' | 'ground'>('isometric');

  const handleCameraPreset = (preset: 'isometric' | 'topdown' | 'ground' | 'reset') => {
    if (preset !== 'reset') setActivePreset(preset);
    mapRef.current?.setCameraPreset(preset);
  };

  const presetClass = (preset: string) =>
    `flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
      activePreset === preset ? 'bg-[#27633b] text-white shadow-sm' : 'text-slate-700 hover:bg-emerald-50'
    }`;

  const totalGeral = QUADRAS_POMAR.reduce((acc, q) => acc + totalPlantas(q), 0);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f4f1e7] font-sans">
      {/* 1. CABEÇALHO */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu de navegação do sistema"
            className="group flex h-12 items-center gap-2.5 rounded-2xl bg-[#27633b] px-4 text-white shadow-xl shadow-[#27633b]/25 transition-all duration-200 hover:bg-[#1a4428] hover:scale-105 active:scale-95 cursor-pointer"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-5 w-5 transition group-hover:rotate-6" />
            <span className="hidden text-xs font-bold tracking-wider uppercase sm:inline">Menu</span>
          </button>
        </div>

        <div className="pointer-events-auto flex flex-col items-end">
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-900/10 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#27633b] to-[#4ade80] text-white shadow-sm">
              <Apple className="h-4 w-4" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold tracking-tight text-[#27633b] font-brand sm:text-2xl leading-none">
                {APP_CONFIG.name}
              </h1>
              <p className="text-[10px] font-semibold text-emerald-900/70 tracking-wide uppercase mt-0.5">
                UEP Fruticultura • IFPE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BARRA DE CÂMERA */}
      <div className="pointer-events-none absolute inset-x-0 top-4 sm:top-6 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-900/10 bg-white/90 p-1.5 shadow-xl backdrop-blur-md">
          <button
            onClick={() => handleCameraPreset('topdown')}
            className={presetClass('topdown')}
            title="Visualização 2D em Planta Baixa"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Planta Baixa (2D)</span>
          </button>
          <button
            onClick={() => handleCameraPreset('isometric')}
            className={presetClass('isometric')}
            title="Visualização Isométrica Tridimensional"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>3D Isométrica</span>
          </button>
          <button onClick={() => handleCameraPreset('ground')} className={presetClass('ground')} title="Visão no Nível do Solo">
            <Eye className="h-3.5 w-3.5" />
            <span>Nível do Solo</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={() => handleCameraPreset('reset')}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
            title="Resetar Câmera"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resetar</span>
          </button>
        </div>
      </div>

      {/* 3. CANVAS 3D */}
      <PomarMap
        ref={mapRef}
        selectedQuadraId={selectedQuadra?.id || null}
        onSelectQuadra={setSelectedQuadra}
        quadras={QUADRAS_POMAR}
      />

      {/* 4. RESUMO DO POMAR */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-start px-4 sm:px-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-emerald-900/10 bg-white/90 px-3.5 py-2 shadow-xl backdrop-blur-md text-xs text-slate-600 font-medium">
          <TreeDeciduous className="h-3.5 w-3.5 text-[#27633b]" />
          <span>
            {QUADRAS_POMAR.filter((q) => q.tipo !== 'equipamento').length} quadras • {totalGeral} plantas
          </span>
        </div>
      </div>

      {/* 5. CARD DA QUADRA SELECIONADA */}
      {selectedQuadra && (
        <aside
          role="complementary"
          aria-label={`Detalhes da quadra ${selectedQuadra.nome}`}
          className="pointer-events-auto absolute bottom-4 right-4 z-30 w-full max-w-sm sm:max-w-md rounded-3xl border border-emerald-900/15 bg-white/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 min-w-10 px-2 items-center justify-center rounded-2xl bg-[#27633b] font-mono text-sm font-bold text-white shadow-md">
                {selectedQuadra.codigo}
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">{selectedQuadra.nome}</h3>
                <p className="text-xs font-semibold text-emerald-800">{selectedQuadra.culturas.join(', ')}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedQuadra(null)}
              aria-label="Fechar painel de detalhes da quadra"
              className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5 text-xs">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Cultura Plantada
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: CORES_FRUTEIRAS[selectedQuadra.tipoFruteira].copa }}
                />
                {selectedQuadra.culturas.join(', ')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50/50 p-2.5 border border-emerald-100">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-medium">Plantas</span>
                <p className="font-bold text-slate-800">{totalPlantas(selectedQuadra)}</p>
              </div>
              <div className="text-center border-x border-emerald-100">
                <span className="text-[10px] text-slate-500 font-medium">Fileiras</span>
                <p className="font-bold text-emerald-700">{selectedQuadra.linhas}</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-medium">Por fileira</span>
                <p className="font-bold text-slate-800">{selectedQuadra.colunas}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 6. MENU LATERAL */}
      <PomarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        quadras={QUADRAS_POMAR}
        onFocusQuadra={(id) => mapRef.current?.focusQuadra(id)}
      />
    </div>
  );
};
