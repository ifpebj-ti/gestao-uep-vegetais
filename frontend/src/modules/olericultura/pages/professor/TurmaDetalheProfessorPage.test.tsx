import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TurmaDetalheProfessorPage } from './TurmaDetalheProfessorPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';
import { turmaService } from '../../../../services/turmaService';

describe('TurmaDetalheProfessorPage - Gestão de Alunos da Turma', () => {
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
  });

  const renderComponent = (turmaId = 'turma-agro-2026-1') =>
    render(
      <MemoryRouter initialEntries={[`/olericultura/professor/turmas/${turmaId}`]}>
        <Routes>
          <Route
            path="/olericultura/professor/turmas/:id"
            element={<TurmaDetalheProfessorPage />}
          />
        </Routes>
      </MemoryRouter>
    );

  it('deve renderizar os detalhes da turma, código de acesso e listagem de alunos', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /agronomia 2026.1/i })).toBeInTheDocument();
    expect(screen.getAllByText('AGRO-459')[0]).toBeInTheDocument();
    expect(screen.getByText(/alunos da turma/i)).toBeInTheDocument();
    expect(screen.getByText(/estudante ifpe/i)).toBeInTheDocument();
  });

  it('deve filtrar os alunos pelo campo de busca', () => {
    renderComponent();

    const inputBusca = screen.getByPlaceholderText(/buscar por nome ou e-mail/i);
    fireEvent.change(inputBusca, { target: { value: 'Daniela' } });

    expect(screen.getByText(/daniela gusmão/i)).toBeInTheDocument();
    expect(screen.queryByText(/estudante ifpe/i)).not.toBeInTheDocument();
  });

  it('deve copiar o código da turma ao clicar em Copiar Código', async () => {
    renderComponent();

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    const btnCopiar = screen.getByRole('button', { name: /copiar código/i });
    fireEvent.click(btnCopiar);

    expect(writeTextSpy).toHaveBeenCalledWith('AGRO-459');
    expect(await screen.findByText(/código copiado/i)).toBeInTheDocument();
  });

  it('deve abrir modal de confirmação e permitir desvincular um aluno', async () => {
    renderComponent();

    const btnRemover = screen.getAllByLabelText(/remover discente/i)[0];
    fireEvent.click(btnRemover);

    expect(screen.getByRole('heading', { name: /remover aluno da turma\?/i })).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /confirmar remoção/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /remover aluno da turma\?/i })).not.toBeInTheDocument();
    });
  });

  it('deve exibir mensagem amigável quando a turma não existir', () => {
    renderComponent('turma-inexistente-999');

    expect(screen.getByRole('heading', { name: /turma não encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voltar para minhas turmas/i })).toBeInTheDocument();
  });
});

