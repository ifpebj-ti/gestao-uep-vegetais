import React from 'react';
import { HistoricoFichaCampoApi } from '../../../services/canteiroService';

const rotulosCampos: Record<string, string> = {
  grupo: 'Grupo',
  turma: 'Turma',
  canteiroCodigo: 'Código do canteiro',
  cultura: 'Cultura',
  variedade: 'Variedade',
  modeloCultivoId: 'Modelo de cultivo',
  dataPlantio: 'Data do plantio',
  espacamento: 'Espaçamento',
  plantasPorCanteiro: 'Plantas por canteiro',
  plantasPorHa: 'Plantas por hectare',
  previsaoColheita: 'Previsão de colheita',
  adubacao: 'Adubação',
  controlePragas: 'Controle de pragas',
  limpaCapina: 'Limpeza e capina',
  obs: 'Observações',
  statusEntrega: 'Status da entrega',
  dataEntrega: 'Data da entrega',
  vistoAssinado: 'Visto assinado',
  dataVisto: 'Data do visto',
  parecer: 'Parecer',
  areaCanteiroM2: 'Área do canteiro (m²)',
  plantasPorCanteiroValor: 'Quantidade de plantas por canteiro',
  plantasPorHaValor: 'Quantidade de plantas por hectare',
  previsaoPlantas: 'Plantas estimadas',
  previsaoColheitaKg: 'Previsão de colheita (kg)',
  previsaoFatorAproveitamento: 'Fator de aproveitamento',
  previsaoAviso: 'Aviso da previsão',
  previsaoModeloNome: 'Modelo de cultivo da previsão',
  previsaoEspacamentoLinhasM: 'Espaçamento entre linhas (m)',
  previsaoEspacamentoPlantasM: 'Espaçamento entre plantas (m)',
  previsaoUnidadeProducao: 'Unidade de produção',
  previsaoProdutividadeKgPorPlanta: 'Produtividade (kg por planta)',
  previsaoPesoMedioKgPorUnidade: 'Peso médio (kg por unidade)',
  previsaoPesoMedioKgPorPlanta: 'Peso médio (kg por planta)',
  previsaoKg: 'Previsão de produção',
};

const rotularPapel = (papel: string) => {
  const normalizado = papel.toLocaleUpperCase('pt-BR');
  if (normalizado === 'ALUNO') return 'Aluno';
  if (normalizado === 'PROFESSOR') return 'Professor';
  if (normalizado === 'ADMIN') return 'Administrador';
  return papel;
};

interface HistoricoFichaTimelineProps {
  eventos: HistoricoFichaCampoApi[];
  carregando: boolean;
  erro: string | null;
}

export const HistoricoFichaTimeline: React.FC<HistoricoFichaTimelineProps> = ({
  eventos,
  carregando,
  erro,
}) => {
  const recentesPrimeiro = [...eventos].sort(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
  );

  return (
    <section aria-label="Alterações da ficha de campo" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">Alterações da Ficha de Campo</h3>
      {carregando && <p role="status" className="mt-3 text-xs text-slate-500">Carregando alterações da ficha…</p>}
      {erro && <p role="alert" className="mt-3 text-xs text-amber-800">{erro}</p>}
      {!carregando && !erro && recentesPrimeiro.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">Nenhuma alteração da ficha registrada.</p>
      )}
      {recentesPrimeiro.length > 0 && (
        <ol className="mt-4 space-y-4">
          {recentesPrimeiro.map((evento) => (
            <li key={evento.id} className="border-l-2 border-emerald-200 pl-4">
              <p className="text-xs font-semibold text-slate-800">
                {evento.autorNome} <span className="font-normal text-slate-500">({rotularPapel(evento.autorPapel)})</span>
              </p>
              <time dateTime={evento.dataHora} className="mt-0.5 block text-[11px] text-slate-500">
                {new Date(evento.dataHora).toLocaleString('pt-BR')}
              </time>
              <ul className="mt-2 space-y-1.5 text-xs">
                {evento.alteracoes.map((alteracao, alteracaoIndice) => (
                  <li key={`${alteracao.campo}-${alteracaoIndice}`} className="text-slate-700">
                    <span className="font-semibold">{rotulosCampos[alteracao.campo] || alteracao.campo}:</span>{' '}
                    <span>{alteracao.valorAnterior ?? '—'}</span>
                    <span className="px-1.5 text-slate-400" aria-label="para">→</span>
                    <span>{alteracao.valorNovo ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
