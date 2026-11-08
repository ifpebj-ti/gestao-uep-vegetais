import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TurmasProfessorPage } from './TurmasProfessorPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import * as UepContextModule from '../../../../contexts/UepContext';

describe('TurmasProfessorPage - Gestão de Turmas e Códigos do Professor', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-prof',
        nome: 'Prof. George Henrique',
        email: 'george@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    vi.spyOn(UepContextModule, 'useUep').mockReturnValue({
      selectedUep: 'olericultura',
      setSelectedUep: vi.fn(),
      clearSelectedUep: vi.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <TurmasProfessorPage />
      </MemoryRouter>
    );

  it('deve renderizar o título da página, botão do menu e lista inicial de turmas', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /minhas turmas & códigos de acesso/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir menu do sistema/i })).toBeInTheDocument();
    expect(screen.getByText(/como funciona o acesso dos alunos aos canteiros/i)).toBeInTheDocument();
    expect(screen.getAllByText('AGRO-459')[0]).toBeInTheDocument();
  });

  it('deve abrir o menu lateral ao clicar no botão de menu', () => {
    renderComponent();

    const btnMenu = screen.getByRole('button', { name: /abrir menu do sistema/i });
    fireEvent.click(btnMenu);

    expect(screen.getByText(/módulos do terrarium/i)).toBeInTheDocument();
  });

  it('deve permitir abrir o modal de cadastro e criar uma nova turma com código gerado', async () => {
    renderComponent();

    const btnNova = screen.getByRole('button', { name: /nova turma/i });
    fireEvent.click(btnNova);

    expect(screen.getByRole('heading', { name: /cadastrar nova turma/i })).toBeInTheDocument();

    const inputNome = screen.getByPlaceholderText(/ex: agronomia 2026.1/i);
    fireEvent.change(inputNome, { target: { value: 'Turma Prática Vespertino' } });

    const btnSalvar = screen.getByRole('button', { name: /salvar e gerar código/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(screen.getByText('Turma Prática Vespertino')).toBeInTheDocument();
    });
  });

  it('deve copiar o código da turma para o clipboard ao clicar em Copiar', async () => {
    renderComponent();

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    const btnCopiar = screen.getAllByRole('button', { name: /copiar/i })[0];
    fireEvent.click(btnCopiar);

    expect(writeTextSpy).toHaveBeenCalledWith('AGRO-459');
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();
  });

  it('deve abrir o modal de confirmação e permitir excluir uma turma', async () => {
    renderComponent();

    const btnExcluir = screen.getAllByLabelText(/excluir turma/i)[0];
    fireEvent.click(btnExcluir);

    expect(screen.getByRole('heading', { name: /excluir turma\?/i })).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /sim, excluir turma/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /excluir turma\?/i })).not.toBeInTheDocument();
    });
  });

  it('deve exibir o botão Ver Alunos com a contagem de discentes vinculados', () => {
    renderComponent();

    const btnsVerAlunos = screen.getAllByRole('button', { name: /ver alunos/i });
    expect(btnsVerAlunos.length).toBeGreaterThan(0);
  });
});

