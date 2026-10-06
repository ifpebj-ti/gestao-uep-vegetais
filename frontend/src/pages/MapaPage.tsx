import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerrariumMap, TerrariumMapRef } from '../components/TerrariumMap';
import { TerrariumMenu } from '../components/TerrariumMenu';
import {
  CanteiroData,
  PerfilUsuario,
} from '../data/horticulturaData';
import {
  Menu,
  X,
  Compass,
  Layers,
  Eye,
  RotateCcw,
  ExternalLink,
  Sprout,
} from 'lucide-react';
import { APP_CONFIG } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

export const MapaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<TerrariumMapRef>(null);

  // User Profile (Professor or Aluno) and Name: derived directly from authentication/login
  const perfil: PerfilUsuario = (() => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'aluno') {
      return 'aluno';
    }
    return 'professor';
  })();

  // Sidebar Menu State ("futuro menu que acompanhará todo o sistema")
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Selected canteiro state
  const [selectedCanteiro, setSelectedCanteiro] = useState<CanteiroData | null>(null);

  // Camera preset state
  const [activePreset, setActivePreset] = useState<'isometric' | 'topdown' | 'ground'>('isometric');

  // Direct redirection mode: whether clicking immediately redirects or shows the preview card first
  const [redirectDirectly, setRedirectDirectly] = useState(false);

  // Handle canteiro selection from 3D map
  const handleSelectCanteiro = (canteiro: CanteiroData | null) => {
    setSelectedCanteiro(canteiro);
    if (canteiro && redirectDirectly) {
      navigate(`/canteiro/${canteiro.id}`);
    }
  };

  // Switch camera view
  const handleCameraPreset = (preset: 'isometric' | 'topdown' | 'ground' | 'reset') => {
    if (preset !== 'reset') {
      setActivePreset(preset);
    }
    mapRef.current?.setCameraPreset(preset);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#eef3e9] font-sans">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & FIGMA BLUEPRINT NAVIGATION CHROME */}
      {/* ======================================================== */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
        {/* LEFT CORNER: Sleek Hamburger Menu Pill (Matching Figma's green tab) */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu de navegação do sistema"
            className="group flex h-12 items-center gap-2.5 rounded-2xl bg-[#27633b] px-4 text-white shadow-xl shadow-[#27633b]/25 transition-all duration-200 hover:bg-[#1a4428] hover:scale-105 active:scale-95"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-5 w-5 transition group-hover:rotate-6" />
            <span className="hidden text-xs font-bold tracking-wider uppercase sm:inline">
              Menu
            </span>
          </button>
        </div>

        {/* RIGHT CORNER: Brand Name ("Terrarium") in Elegant Serif Typography (Matching Figma) */}
        <div className="pointer-events-auto flex flex-col items-end">
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-900/10 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#27633b] to-[#4ade80] text-white shadow-sm">
              <Sprout className="h-4 w-4" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold tracking-tight text-[#27633b] font-brand sm:text-2xl leading-none">
                {APP_CONFIG.name}
              </h1>
              <p className="text-[10px] font-semibold text-emerald-900/70 tracking-wide uppercase mt-0.5">
                UEP Olericultura • IFPE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. CAMERA CONTROL BAR (Floating Top-Center) */}
      {/* ======================================================== */}
      <div className="pointer-events-none absolute inset-x-0 top-4 sm:top-6 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-900/10 bg-white/90 p-1.5 shadow-xl backdrop-blur-md">
          {/* Planta Baixa 2D View Button (Mirrors the Figma architectural drawing) */}
          <button
            onClick={() => handleCameraPreset('topdown')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activePreset === 'topdown'
                ? 'bg-[#27633b] text-white shadow-sm'
                : 'text-slate-700 hover:bg-emerald-50'
              }`}
            title="Visualização 2D em Planta Baixa (Figma)"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Planta Baixa (2D)</span>
          </button>

          {/* Isométrica 3D View Button */}
          <button
            onClick={() => handleCameraPreset('isometric')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activePreset === 'isometric'
                ? 'bg-[#27633b] text-white shadow-sm'
                : 'text-slate-700 hover:bg-emerald-50'
              }`}
            title="Visualização Isométrica Tridimensional"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>3D Isométrica</span>
          </button>

          {/* Nível do Solo Walking View Button */}
          <button
            onClick={() => handleCameraPreset('ground')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activePreset === 'ground'
                ? 'bg-[#27633b] text-white shadow-sm'
                : 'text-slate-700 hover:bg-emerald-50'
              }`}
            title="Visão no Nível do Solo"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Nível do Solo</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Reset Camera */}
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

      {/* ======================================================== */}
      {/* 3. THREE.JS 3D CANVAS */}
      {/* ======================================================== */}
      <TerrariumMap
        ref={mapRef}
        selectedCanteiroId={selectedCanteiro?.id || null}
        onSelectCanteiro={handleSelectCanteiro}
        isTeacherView={perfil === 'professor'}
      />

      {/* ======================================================== */}
      {/* 4. BOTTOM STATUS BAR & DIRECT NAVIGATION MODE */}
      {/* ======================================================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-end px-4 sm:px-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-emerald-900/10 bg-white/90 px-3.5 py-2 shadow-xl backdrop-blur-md text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={redirectDirectly}
              onChange={(e) => setRedirectDirectly(e.target.checked)}
              className="h-3.5 w-3.5 rounded text-[#27633b] focus:ring-[#27633b]"
            />
            <span>Redirecionar direto ao clicar</span>
          </label>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. CANTEIRO INSPECTOR CARD (Bottom Sheet / Slide-in Card) */}
      {/* ======================================================== */}
      {selectedCanteiro && (
        <aside
          role="complementary"
          aria-label={`Detalhes do ${selectedCanteiro.nome}`}
          className="pointer-events-auto absolute bottom-4 right-4 z-30 w-full max-w-sm sm:max-w-md rounded-3xl border border-emerald-900/15 bg-white/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#27633b] font-mono text-sm font-bold text-white shadow-md">
                {selectedCanteiro.codigo}
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {selectedCanteiro.nome}
                </h3>
                <p className="text-xs font-semibold text-emerald-800">
                  {selectedCanteiro.cultura}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                style={{
                  backgroundColor: `${selectedCanteiro.statusColor}18`,
                  color: selectedCanteiro.statusColor,
                }}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
              >
                {selectedCanteiro.statusLabel}
              </span>
              <button
                onClick={() => setSelectedCanteiro(null)}
                aria-label="Fechar painel de detalhes do canteiro"
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="mt-4 space-y-3.5 text-xs">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Cultura Plantada
              </span>
              <p className="text-sm font-bold text-slate-800">
                {selectedCanteiro.cultura}
                {selectedCanteiro.variedade && (
                  <span className="ml-1 text-xs font-normal italic text-slate-500">
                    ({selectedCanteiro.variedade})
                  </span>
                )}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50/50 p-2.5 border border-emerald-100">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-medium">Idade</span>
                <p className="font-bold text-slate-800">{selectedCanteiro.diasPlantio} dias</p>
              </div>
              <div className="text-center border-x border-emerald-100">
                <span className="text-[10px] text-slate-500 font-medium">Umidade</span>
                <p className="font-bold text-emerald-700">{selectedCanteiro.umidadeSolo}%</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-medium">Área</span>
                <p className="font-bold text-slate-800">{selectedCanteiro.areaM2} m²</p>
              </div>
            </div>

            {/* Grupo / Aluno Responsável com espaçamento agradável */}
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-[11px]">
              <span className="font-semibold text-slate-500">Grupo / Aluno Responsável:</span>
              <p className="text-slate-700 font-medium mt-0.5">
                {selectedCanteiro.estudanteLider
                  ? `${selectedCanteiro.estudanteLider} • ${selectedCanteiro.turmaResponsavel}`
                  : selectedCanteiro.turmaResponsavel || 'Não atribuído'}
              </p>
            </div>
          </div>

          {/* PRIMARY REDIRECTION BUTTON: "Ver mais" */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate(`/canteiro/${selectedCanteiro.id}`)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#27633b] py-3 px-4 text-xs font-bold text-white shadow-lg shadow-[#27633b]/20 hover:bg-[#1a4428] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Ver mais</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* ======================================================== */}
      {/* 6. FUTURO MENU GERAL DO SISTEMA (SLIDE-OVER DRAWER) */}
      {/* ======================================================== */}
      <TerrariumMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFocusLocation={(locationId) => mapRef.current?.focusCanteiro(locationId)}
      />
    </div>
  );
};
