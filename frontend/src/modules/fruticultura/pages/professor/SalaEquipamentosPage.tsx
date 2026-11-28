import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Wrench,
  Package,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../../components/Button';
import { useAuth } from '../../../../contexts/AuthContext';
import { identifyRoleByEmail } from '../../../auth/utils/roleIdentifier';
import { PomarMenu } from '../../components/PomarMenu';

export interface MaterialEquipamento {
  id: string;
  nome: string;
  categoria: 'Ferramenta' | 'Insumo' | 'EPI' | 'Irrigação' | 'Colheita';
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  unidade: string;
  estado: 'Excelente' | 'Bom' | 'Necessita Manutenção';
  localizacao: string;
  ultimaManutencao?: string;
}

const MATERIAIS_SEED: MaterialEquipamento[] = [
  {
    id: 'mat-1',
    nome: 'Tesoura de Poda Profissional (Bypass)',
    categoria: 'Ferramenta',
    quantidadeTotal: 18,
    quantidadeDisponivel: 15,
    unidade: 'unidades',
    estado: 'Excelente',
    localizacao: 'Armário A1 • Prateleira 2',
    ultimaManutencao: '10/11/2026',
  },
  {
    id: 'mat-2',
    nome: 'Serrote de Poda Dobrável',
    categoria: 'Ferramenta',
    quantidadeTotal: 10,
    quantidadeDisponivel: 8,
    unidade: 'unidades',
    estado: 'Bom',
    localizacao: 'Armário A1 • Prateleira 3',
    ultimaManutencao: '05/11/2026',
  },
  {
    id: 'mat-3',
    nome: 'Pulverizador Costal Manual (20L)',
    categoria: 'Ferramenta',
    quantidadeTotal: 6,
    quantidadeDisponivel: 5,
    unidade: 'unidades',
    estado: 'Bom',
    localizacao: 'Bancada B • Setor de Calda',
    ultimaManutencao: '02/11/2026',
  },
  {
    id: 'mat-4',
    nome: 'Caixas Plásticas Vazadas para Colheita',
    categoria: 'Colheita',
    quantidadeTotal: 80,
    quantidadeDisponivel: 64,
    unidade: 'caixas',
    estado: 'Excelente',
    localizacao: 'Palete Sul • Setor de Carga',
  },
  {
    id: 'mat-5',
    nome: 'Escada de Alumínio em A (3 Metros)',
    categoria: 'Ferramenta',
    quantidadeTotal: 4,
    quantidadeDisponivel: 3,
    unidade: 'unidades',
    estado: 'Excelente',
    localizacao: 'Suporte de Parede Leste',
    ultimaManutencao: '12/10/2026',
  },
  {
    id: 'mat-6',
    nome: 'Gotejadores Autocompensantes (Reposição)',
    categoria: 'Irrigação',
    quantidadeTotal: 300,
    quantidadeDisponivel: 240,
    unidade: 'peças',
    estado: 'Excelente',
    localizacao: 'Gaveteiro G3',
  },
  {
    id: 'mat-7',
    nome: 'Fita para Enxertia Parafilm',
    categoria: 'Insumo',
    quantidadeTotal: 25,
    quantidadeDisponivel: 21,
    unidade: 'rolos',
    estado: 'Excelente',
    localizacao: 'Armário Central • Gaveta 1',
  },
  {
    id: 'mat-8',
    nome: 'Óculos de Proteção e Luvas de Vaqueta (Kits)',
    categoria: 'EPI',
    quantidadeTotal: 30,
    quantidadeDisponivel: 27,
    unidade: 'kits',
    estado: 'Excelente',
    localizacao: 'Armário de EPIs • Entrada',
  },
  {
    id: 'mat-9',
    nome: 'Adubo Foliar Micronutrientes (Frutificação)',
    categoria: 'Insumo',
    quantidadeTotal: 40,
    quantidadeDisponivel: 28,
    unidade: 'litros',
    estado: 'Bom',
    localizacao: 'Prateleira de Fertilizantes',
  },
  {
    id: 'mat-10',
    nome: 'Podador de Galhos Altos Telescópico',
    categoria: 'Ferramenta',
    quantidadeTotal: 3,
    quantidadeDisponivel: 1,
    unidade: 'unidades',
    estado: 'Necessita Manutenção',
    localizacao: 'Suporte de Parede Oeste',
    ultimaManutencao: '15/09/2026',
  },
];

export const SalaEquipamentosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [materiais] = useState<MaterialEquipamento[]>(MATERIAIS_SEED);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');

  const role = user ? identifyRoleByEmail(user.email, user.role) : 'PROFESSOR';
  const isAluno = role === 'ALUNO';
  const voltarRota = isAluno ? '/fruticultura/aluno/pomar' : '/fruticultura/professor/pomar';

  const categorias = ['todas', 'Ferramenta', 'Colheita', 'Irrigação', 'Insumo', 'EPI'];

  const filtrados = materiais.filter((m) => {
    const matchBusca =
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.localizacao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaAtiva === 'todas' || m.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  const totalItensDisponiveis = materiais.reduce((acc, m) => acc + m.quantidadeDisponivel, 0);
  const itensManutencao = materiais.filter((m) => m.estado === 'Necessita Manutenção').length;

  return (
    <div className="min-h-screen bg-[#f4f1e7] text-slate-800 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
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
                <span className="text-xs font-semibold text-slate-500">Pomar Experimental</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Sala de Equipamentos & Insumos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(voltarRota)}
              leftIcon={<Layers className="h-4 w-4 text-[#27633b]" />}
            >
              <span className="hidden sm:inline">Voltar ao</span> Mapa 3D
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total de Itens Cadastrados
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#27633b]">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{materiais.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">tipos de materiais e ferramentas</p>
          </div>

          <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unidades Disponíveis
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-blue-700">{totalItensDisponiveis}</p>
            <p className="text-xs text-slate-500 mt-0.5">prontos para atividades práticas</p>
          </div>

          <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Manutenção / Revisão
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-amber-700">{itensManutencao}</p>
            <p className="text-xs text-slate-500 mt-0.5">equipamento aguardando afiação/reparo</p>
          </div>

          <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Responsável pelo Setor
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900 truncate">
              {user?.nome || 'Docente de Fruticultura'}
            </p>
            <p className="text-xs text-emerald-800 font-semibold mt-0.5">UEP Fruticultura • IFPE</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar material por nome, ferramenta ou localização..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#27633b] focus:outline-none focus:ring-1 focus:ring-[#27633b] transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="h-4 w-4 text-slate-400 shrink-0 ml-1 mr-1" />
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    categoriaAtiva === cat
                      ? 'bg-[#27633b] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'todas' ? 'Todas as Categorias' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory List / Table */}
        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Material / Ferramenta</th>
                  <th className="px-5 py-3.5">Categoria</th>
                  <th className="px-5 py-3.5 text-center">Disponível / Total</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Localização no Depósito</th>
                  <th className="px-5 py-3.5 text-right">Última Revisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum material encontrado com os filtros informados.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((m) => {
                    const percentual = Math.round((m.quantidadeDisponivel / m.quantidadeTotal) * 100);
                    const isCritico = percentual < 30;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0">
                              <Wrench className="h-4 w-4 text-[#27633b]" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-tight">{m.nome}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Código: {m.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                            {m.categoria}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`font-mono text-sm font-extrabold ${
                                isCritico ? 'text-amber-600' : 'text-slate-800'
                              }`}
                            >
                              {m.quantidadeDisponivel}{' '}
                              <span className="text-slate-400 font-normal">/ {m.quantidadeTotal}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">{m.unidade}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              m.estado === 'Excelente'
                                ? 'bg-emerald-50 text-emerald-700'
                                : m.estado === 'Bom'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                m.estado === 'Excelente'
                                  ? 'bg-emerald-500'
                                  : m.estado === 'Bom'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {m.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-600">{m.localizacao}</td>
                        <td className="px-5 py-4 text-right text-slate-500 font-mono text-[11px]">
                          {m.ultimaManutencao || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PomarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};
