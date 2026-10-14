import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CANTEIROS_DATA, CanteiroData } from '../../data/horticulturaData';
import {
  Calendar,
  CheckCircle2,
  Sprout,
  FileText,
  Menu,
} from 'lucide-react';
import { FichaCampoOlericultura } from '../../components/FichaCampoOlericultura';
import { CronogramaSemanal } from '../../components/CronogramaSemanal';
import { TerrariumMenu } from '../../components/TerrariumMenu';
import { BackButton } from '../../../../components/BackButton';
import { useAuth } from '../../../../contexts/AuthContext';
import { FichaCampoData, normalizarEspacamento } from '../../components/FichaCampoOlericultura';
import { ApiError } from '../../../../services/apiClient';
import {
  AlunoResumo,
  FichaCampoApi,
  ModeloCultivoApi,
  canteiroService,
} from '../../../../services/canteiroService';

export const CanteiroDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sidebar Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const profile: 'professor' | 'aluno' =
    user?.role?.toUpperCase() === 'PROFESSOR' || user?.role?.toUpperCase() === 'ADMIN'
      ? 'professor'
      : 'aluno';
  const backPath = profile === 'aluno' ? '/olericultura/aluno/mapa' : '/mapa';
  const [fichaInicial, setFichaInicial] = useState<FichaCampoData | null>(null);
  const [podeEditar, setPodeEditar] = useState(false);
  const [carregandoFicha, setCarregandoFicha] = useState(false);
  const [erroFicha, setErroFicha] = useState('');
  const [responsaveis, setResponsaveis] = useState<AlunoResumo[]>([]);
  const [alunos, setAlunos] = useState<AlunoResumo[]>([]);
  const [idsResponsaveis, setIdsResponsaveis] = useState<string[]>([]);
  const [salvandoEquipe, setSalvandoEquipe] = useState(false);
  const [mensagemEquipe, setMensagemEquipe] = useState('');
  const [modelosCultivo, setModelosCultivo] = useState<ModeloCultivoApi[]>([]);
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloCultivoApi | null>(null);
  const [activeTab, setActiveTab] = useState<'ficha' | 'cronograma' | 'historico'>('ficha');

  const canteiro: CanteiroData | undefined = CANTEIROS_DATA.find((c) => c.id === id);

  const converterFicha = (dados: FichaCampoApi): FichaCampoData => ({
    grupo: dados.grupo || '',
    canteiroCodigo: dados.canteiroCodigo || '',
    cultura: dados.cultura || '',
    variedade: dados.variedade || '',
    dataPlantio: dados.dataPlantio || '',
    espacamento: normalizarEspacamento(dados.espacamento),
    plantasPorCanteiro: dados.plantasPorCanteiro || '',
    previsaoColheita: dados.previsaoColheita || '',
    adubacao: dados.adubacao || '',
    controlePragas: dados.controlePragas || '',
    limpaCapina: dados.limpaCapina || '',
    obs: dados.obs || '',
    statusEntrega: (dados.statusEntrega || 'pendente') as FichaCampoData['statusEntrega'],
    dataEntrega: dados.dataEntrega || '',
    vistoProfessor: {
      assinado: dados.vistoAssinado,
      dataVisto: dados.dataVisto || undefined,
      parecer: dados.parecer || undefined,
    },
    persistida: dados.persistida,
    updatedAt: dados.updatedAt,
    updatedBy: dados.updatedBy,
    modeloCultivoId: dados.modeloCultivoId,
    areaCanteiroM2: dados.areaCanteiroM2,
    plantasPorCanteiroValor: dados.plantasPorCanteiroValor,
    previsaoKg: dados.previsaoKg,
  });

  useEffect(() => {
    if (!id || !user) return;

    let ativo = true;
    setCarregandoFicha(true);
    setErroFicha('');
    canteiroService.getFicha(id)
      .then((dados) => {
        if (!ativo) return;
        setFichaInicial(converterFicha(dados));
        setPodeEditar(true);
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        const mensagem = erro instanceof ApiError && erro.status === 403
          ? 'Você não tem permissão para acessar a ficha deste canteiro.'
          : erro instanceof Error ? erro.message : 'Não foi possível carregar a ficha do servidor.';
        setErroFicha(mensagem);
      })
      .finally(() => {
        if (ativo) setCarregandoFicha(false);
      });

      canteiroService.getResponsaveis(id)
        .then((atuais) => {
          if (!ativo) return;
          setResponsaveis(atuais);
          setIdsResponsaveis(atuais.map((aluno) => aluno.id));
        })
        .catch(() => {
          if (ativo) setResponsaveis([]);
        });
    if (profile === 'professor') {
      canteiroService.getAlunos()
        .then((disponiveis) => {
          if (!ativo) return;
          setAlunos(disponiveis);
        })
        .catch(() => {
          if (ativo) setMensagemEquipe('Não foi possível carregar a equipe responsável.');
        });
    }

    return () => { ativo = false; };
  }, [id, user, profile]);

  useEffect(() => {
    if (!user) return;
    canteiroService.getModelosCultivo()
      .then(setModelosCultivo)
      .catch(() => setModelosCultivo([]));
  }, [user]);

  const salvarFicha = async (ficha: FichaCampoData) => {
    if (!id) return;
    const salva = await canteiroService.saveFicha(id, {
      canteiroId: id,
      grupo: ficha.grupo,
      canteiroCodigo: ficha.canteiroCodigo,
      cultura: ficha.cultura,
      variedade: ficha.variedade,
      dataPlantio: ficha.dataPlantio,
      espacamento: ficha.espacamento,
      plantasPorCanteiro: ficha.plantasPorCanteiro,
      previsaoColheita: ficha.previsaoColheita,
      adubacao: ficha.adubacao,
      controlePragas: ficha.controlePragas,
      limpaCapina: ficha.limpaCapina,
      obs: ficha.obs,
      statusEntrega: ficha.statusEntrega,
      dataEntrega: ficha.dataEntrega || null,
      vistoAssinado: ficha.vistoProfessor?.assinado || false,
      dataVisto: ficha.vistoProfessor?.dataVisto || null,
      parecer: ficha.vistoProfessor?.parecer || null,
      updatedAt: null,
      updatedBy: null,
      persistida: ficha.persistida || false,
      modeloCultivoId: ficha.modeloCultivoId || null,
      areaCanteiroM2: ficha.areaCanteiroM2 ?? canteiro?.areaM2 ?? null,
      plantasPorCanteiroValor: ficha.plantasPorCanteiroValor || null,
      previsaoKg: ficha.previsaoKg || null,
    });
    setFichaInicial(converterFicha(salva));
  };

  const salvarModelo = async (modelo: ModeloCultivoApi) => {
    const atualizado = await canteiroService.updateModeloCultivo(modelo.id, modelo);
    setModelosCultivo((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item));
    setModeloSelecionado((atual) => atual?.id === atualizado.id ? atualizado : atual);
  };

  const salvarEquipe = async () => {
    if (!id || idsResponsaveis.length > 3) return;
    setSalvandoEquipe(true);
    setMensagemEquipe('');
    try {
      await canteiroService.saveResponsaveis(id, idsResponsaveis);
      setResponsaveis(alunos.filter((aluno) => idsResponsaveis.includes(aluno.id)));
      setMensagemEquipe('Equipe responsável salva com sucesso.');
    } catch (erro) {
      setMensagemEquipe(erro instanceof Error ? erro.message : 'Não foi possível salvar a equipe.');
    } finally {
      setSalvandoEquipe(false);
    }
  };

  if (!canteiro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9f6] p-6 text-center font-sans">
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#27633b]">
            <Sprout className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-800">Canteiro não encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            O identificador solicitado não corresponde a nenhum canteiro ou setor cadastrado.
          </p>
          <BackButton
            to={backPath}
            variant="solid"
            className="mt-6 w-full justify-center py-3 text-sm rounded-xl"
          />
        </div>
      </div>
    );
  }

  const progressoCiclo = Math.min(
    100,
    Math.round((canteiro.diasPlantio / Math.max(canteiro.diasPrevistosColheita, 1)) * 100)
  );

  const modeloDaFicha = modelosCultivo.find((modelo) => modelo.id === fichaInicial?.modeloCultivoId) || null;
  const modeloExibido = modeloSelecionado || modeloDaFicha;
  const culturaExibida = modeloExibido?.cultura?.trim() || fichaInicial?.cultura?.trim() || canteiro.cultura;
  const nomeCientificoExibido = modeloExibido?.variedade?.trim() || fichaInicial?.variedade?.trim() || canteiro.variedade;
  const equipeExibida: AlunoResumo[] = responsaveis.length > 0
    ? responsaveis
    : canteiro.estudanteLider
      ? [{ id: `fallback-${canteiro.id}`, nome: canteiro.estudanteLider, email: '' }]
      : [];

  return (
    <div className="min-h-screen bg-[#f5f8f3] text-slate-800 pb-16 font-sans print:min-h-0 print:bg-white print:p-0 print:m-0">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGATION: MENU E BOTÃO VOLTAR                  */}
      {/* ======================================================== */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-4 sm:px-6 print:hidden">
        <div className="flex items-center gap-3">
          {/* Botão Menu */}
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu do sistema"
            className="group flex h-11 items-center gap-2 rounded-2xl bg-[#27633b] px-4 text-white shadow-md shadow-[#27633b]/20 hover:bg-[#1a4428] hover:scale-105 active:scale-95 transition"
            title="Menu do Sistema Terrarium"
          >
            <Menu className="h-4 w-4 transition group-hover:rotate-6" />
            <span className="text-xs font-bold tracking-wider uppercase">Menu</span>
          </button>

          {/* Botão Reutilizável de Voltar */}
          <BackButton to={backPath} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CONTEÚDO PRINCIPAL                                    */}
      {/* ======================================================== */}
      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 print:max-w-none print:m-0 print:p-0">

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 p-6 sm:p-8 shadow-sm print:hidden">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

            {/* Informações Básicas do Canteiro */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#27633b] font-mono text-sm font-bold text-white shadow-sm">
                  {canteiro.codigo}
                </span>
                <span className="rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-semibold text-[#1a4428]">
                  {canteiro.setor}
                </span>
                <span
                  style={{ backgroundColor: `${canteiro.statusColor}18`, color: canteiro.statusColor }}
                  className="rounded-lg px-3 py-1 text-xs font-bold"
                >
                  {canteiro.statusLabel}
                </span>
              </div>

              <div>
                <h1 className="break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  {culturaExibida}
                </h1>
                {nomeCientificoExibido && (
                  <p className="mt-1 text-sm font-medium italic text-slate-500">
                    Nome científico: {nomeCientificoExibido}
                  </p>
                )}
              </div>
            </div>

            {/* Grupo Responsável e Turma (Diretamente no card maior) */}
            <div className="min-w-0 flex-1 space-y-3 sm:max-w-[380px] sm:min-w-[240px] sm:text-right">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Grupo Responsável:
                </span>
                <div className="mt-1 flex flex-wrap justify-start gap-1.5 sm:justify-end">
                  {equipeExibida.length > 0 ? equipeExibida.map((aluno) => (
                    <span
                      key={aluno.id}
                      className="max-w-full break-words rounded-lg bg-white/75 px-2 py-1 text-sm font-bold text-slate-900 shadow-sm"
                    >
                      {aluno.nome}
                    </span>
                  )) : (
                    <span className="text-sm font-semibold text-slate-500">Equipe não definida</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Turma:
                </span>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {canteiro.turmaResponsavel}
                </p>
              </div>
            </div>

          </div>

          {/* Ciclo Fenológico Progress Bar */}
          <div className="mt-6 border-t border-emerald-900/10 pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#27633b]" />
                <span>Ciclo Fenológico: {canteiro.diasPlantio} de {canteiro.diasPrevistosColheita} dias estimados</span>
              </div>
              <span className="text-[#27633b] font-bold">{progressoCiclo}% completo</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5">
              <div
                style={{ width: `${progressoCiclo}%`, backgroundColor: canteiro.statusColor }}
                className="h-full rounded-full transition-all duration-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SEÇÃO PRINCIPAL (LARGURA TOTAL): ABAS E FICHA DE CAMPO*/}
        {/* ======================================================== */}
        <div className="mt-8 space-y-6">
          {user && carregandoFicha && (
            <div className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Carregando a ficha persistida do servidor...
            </div>
          )}

          {user && erroFicha && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
              {erroFicha}
            </div>
          )}

          {user && profile === 'professor' && !erroFicha && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Equipe responsável pelo canteiro</h2>
                  <p className="text-xs text-slate-500">Selecione até três alunos. Todos os selecionados poderão editar a ficha.</p>
                </div>
                <button
                  onClick={salvarEquipe}
                  disabled={salvandoEquipe || idsResponsaveis.length > 3}
                  className="rounded-xl bg-[#27633b] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1a4428] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoEquipe ? 'Salvando...' : 'Salvar equipe'}
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {alunos.map((aluno) => {
                  const selecionado = idsResponsaveis.includes(aluno.id);
                  return (
                    <label key={aluno.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-2 text-xs hover:bg-emerald-50">
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => setIdsResponsaveis((atuais) => selecionado
                          ? atuais.filter((idAluno) => idAluno !== aluno.id)
                          : [...atuais, aluno.id])}
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-800">{aluno.nome}</span>
                        <span className="block truncate text-slate-500">{aluno.email}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {idsResponsaveis.length > 3 && (
                <p className="mt-2 text-xs font-semibold text-red-700">A equipe deve possuir no máximo três alunos.</p>
              )}
              {mensagemEquipe && <p className="mt-2 text-xs font-semibold text-emerald-700">{mensagemEquipe}</p>}
            </section>
          )}

          {/* Navegação entre Abas (Sem "Parâmetros Agronômicos") */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto print:hidden">
            <button
              onClick={() => setActiveTab('ficha')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === 'ficha'
                  ? 'bg-[#27633b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Ficha de Campo (Olericultura)</span>
            </button>
            <button
              onClick={() => setActiveTab('cronograma')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === 'cronograma'
                  ? 'bg-[#27633b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Cronograma Semanal</span>
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${activeTab === 'historico'
                  ? 'bg-[#27633b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Histórico & Linha do Tempo
            </button>
          </div>

          {/* Aba 1: Ficha de Campo Oficial do Professor George Guimarães */}
          {activeTab === 'ficha' && (
            <FichaCampoOlericultura
              canteiro={canteiro}
              perfil={profile}
              fichaInicial={fichaInicial}
              podeEditar={user ? podeEditar : false}
              onSalvar={user ? salvarFicha : undefined}
              modelosCultivo={modelosCultivo}
              onSalvarModelo={profile === 'professor' ? salvarModelo : undefined}
              onModeloSelecionado={setModeloSelecionado}
            />
          )}

          {/* Aba 2: Cronograma Semanal de Manejo (Substitui 'Manejo & Irrigação') */}
          {activeTab === 'cronograma' && (
            <CronogramaSemanal
              canteiroId={canteiro.id}
              modo="individual"
              perfil={profile}
            />
          )}

          {/* Aba 3: Histórico */}
          {activeTab === 'historico' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Linha do Tempo das Intervenções</h3>
              <ol className="relative border-l border-emerald-200 ml-3 space-y-5 text-xs">
                <li className="ml-5">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-600" />
                  <span className="font-semibold text-slate-400">Há 3 dias</span>
                  <h4 className="font-bold text-slate-800">Adubação de cobertura com Bokashi líquido</h4>
                  <p className="text-slate-500">Realizada pelos alunos responsáveis sob supervisão do Prof. George Guimarães.</p>
                </li>
                <li className="ml-5">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                  <span className="font-semibold text-slate-400">Há 14 dias</span>
                  <h4 className="font-bold text-slate-800">Raleio e desbaste entre plantas</h4>
                  <p className="text-slate-500">Uniformização do espaçamento entre mudas conforme ficha de campo.</p>
                </li>
                <li className="ml-5">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                  <span className="font-semibold text-slate-400">{canteiro.dataPlantio}</span>
                  <h4 className="font-bold text-slate-800">Preparo do canteiro e plantio inicial</h4>
                  <p className="text-slate-500">Incorporação de 3kg/m² de composto orgânico da baia 4 da UEP.</p>
                </li>
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* Menu Lateral Deslizante (TerrariumMenu) */}
      <TerrariumMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFocusLocation={() => navigate(backPath)}
      />
    </div>
  );
};
