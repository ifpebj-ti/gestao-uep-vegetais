import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CronogramaSemanal } from './CronogramaSemanal';

describe('CronogramaSemanal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar diretamente a tabela de módulos específicos do canteiro C18 (Alface Roxa) no modo individual', () => {
    render(
      <MemoryRouter>
        <CronogramaSemanal canteiroId="c-18" modo="individual" perfil="professor" />
      </MemoryRouter>
    );

    // Deve exibir código C18 e cultura Alface Roxa na tabela
    expect(screen.getAllByText('C18').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alface Roxa').length).toBeGreaterThan(0);

    // Módulos específicos deste canteiro
    expect(screen.getByText('Módulo 1')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2')).toBeInTheDocument();
    expect(screen.getByText('Módulo 3')).toBeInTheDocument();
    expect(screen.getByText('Módulo 4')).toBeInTheDocument();

    // NÃO deve exibir botão de alternância para outros canteiros nem dropdown
    expect(screen.queryByRole('button', { name: /todos os canteiros/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('deve renderizar os módulos específicos do canteiro C01 (Alface Crespa) no modo individual', () => {
    render(
      <MemoryRouter>
        <CronogramaSemanal canteiroId="c-01" modo="individual" perfil="professor" />
      </MemoryRouter>
    );

    expect(screen.getAllByText('C01').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alface Crespa').length).toBeGreaterThan(0);
    expect(screen.getByText('Módulo 1')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2')).toBeInTheDocument();
  });

  it('deve renderizar a visão geral de todos os canteiros por turma no modo panorâmico (Gestão de Canteiros)', () => {
    render(
      <MemoryRouter>
        <CronogramaSemanal modo="panoramico" perfil="professor" />
      </MemoryRouter>
    );

    // Título e colunas principais da Foto 2
    expect(screen.getByText(/Gestão de Canteiros • Acompanhamento Semanal da Turma/i)).toBeInTheDocument();
    expect(screen.getByText(/Cultura \/ Cultivar & Canteiro/i)).toBeInTheDocument();
    expect(screen.getByText(/Setor & Dimensão/i)).toBeInTheDocument();
    expect(screen.getByText(/SEM 42 \(ATUAL\)/i)).toBeInTheDocument();

    // Deve listar múltiplos canteiros de diferentes alunos
    expect(screen.getAllByText('Alface Crespa').length).toBeGreaterThan(0);
    expect(screen.getByText('Ana Beatriz Souza')).toBeInTheDocument();
    expect(screen.getAllByText('Alface Roxa').length).toBeGreaterThan(0);
    expect(screen.getByText('Daniela Gusmão')).toBeInTheDocument();
    expect(screen.getAllByText('Rabanete Redondo').length).toBeGreaterThan(0);
    expect(screen.getByText('Mariana Duarte')).toBeInTheDocument();
  });

  it('deve filtrar canteiros por termo de busca no modo panorâmico', () => {
    render(
      <MemoryRouter>
        <CronogramaSemanal modo="panoramico" perfil="professor" />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/buscar por cultura, aluno ou código.../i);
    fireEvent.change(searchInput, { target: { value: 'Daniela' } });

    expect(screen.getByText('Daniela Gusmão')).toBeInTheDocument();
    expect(screen.getByText('Alface Roxa')).toBeInTheDocument();
    expect(screen.queryByText('Ana Beatriz Souza')).not.toBeInTheDocument();
  });

  it('deve abrir modal detalhado com protocolo de Manejo & Irrigação e visto docente ao clicar na fase', () => {
    render(
      <MemoryRouter>
        <CronogramaSemanal canteiroId="c-18" modo="individual" perfil="professor" />
      </MemoryRouter>
    );

    // Clica numa fase da tabela
    const colheitaBadges = screen.getAllByText(/Colheita/i);
    expect(colheitaBadges.length).toBeGreaterThan(0);
    fireEvent.click(colheitaBadges[0]);

    // O modal deve ser exibido com os protocolos de manejo
    expect(screen.getByText(/Protocolo de Manejo & Irrigação da Semana/i)).toBeInTheDocument();
    expect(screen.getByText(/Irrigação Programada/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutrição & Adubação/i)).toBeInTheDocument();
    expect(screen.getByText(/Visto Docente de Acompanhamento/i)).toBeInTheDocument();

    // Botão de visto docente
    const btnVisto = screen.getByRole('button', { name: /visto/i });
    expect(btnVisto).toBeInTheDocument();
    fireEvent.click(btnVisto);

    // Botão de salvar avaliação do manejo
    const btnSalvar = screen.getByRole('button', { name: /salvar avaliação do manejo/i });
    expect(btnSalvar).toBeInTheDocument();
    fireEvent.click(btnSalvar);
  });
});
