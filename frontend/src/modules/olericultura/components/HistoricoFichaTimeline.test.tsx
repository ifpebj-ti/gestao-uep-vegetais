import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoricoFichaTimeline } from './HistoricoFichaTimeline';

describe('HistoricoFichaTimeline', () => {
  it('exibe autor, perfil, horário, rótulos em português e valores antigos/novos, com eventos mais recentes primeiro', () => {
    render(
      <HistoricoFichaTimeline
        carregando={false}
        erro={null}
        eventos={[
          {
            id: 'evento-antigo',
            dataHora: '2026-11-10T10:00:00Z',
            autorNome: 'Ana Lima',
            autorPapel: 'PROFESSOR',
            alteracoes: [{ campo: 'cultura', valorAnterior: null, valorNovo: 'Alface' }],
          },
          {
            id: 'evento-recente',
            dataHora: '2026-11-11T10:00:00Z',
            autorNome: 'João Silva',
            autorPapel: 'ALUNO',
            alteracoes: [
              { campo: 'cultura', valorAnterior: 'Alface', valorNovo: 'Batata' },
              { campo: 'obs', valorAnterior: 'Anterior', valorNovo: null },
            ],
          },
        ]}
      />,
    );

    expect(screen.getAllByText('Cultura:')).toHaveLength(2);
    expect(screen.getAllByText('Alface')).toHaveLength(2);
    expect(screen.getByText('Batata')).toBeInTheDocument();
    expect(screen.getByText('Observações:')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText(/João Silva/)).toBeInTheDocument();
    expect(screen.getByText('(Aluno)')).toBeInTheDocument();
    const listaEventos = screen.getByRole('region', { name: 'Alterações da ficha de campo' })
      .querySelector(':scope > ol');
    const eventos = listaEventos?.querySelectorAll(':scope > li') ?? [];
    expect(eventos[0]).toHaveTextContent('João Silva');
    expect(eventos[1]).toHaveTextContent('Ana Lima');
  });

  it('apresenta falha de carregamento sem ocultar eventos já carregados', () => {
    render(
      <HistoricoFichaTimeline
        carregando={false}
        erro="Não foi possível carregar alterações da ficha."
        eventos={[
          {
            id: 'evento-1',
            dataHora: '2026-11-11T10:00:00Z',
            autorNome: 'João Silva',
            autorPapel: 'ALUNO',
            alteracoes: [{ campo: 'cultura', valorAnterior: 'Alface', valorNovo: 'Batata' }],
          },
        ]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.getByText('Batata')).toBeInTheDocument();
  });
});
