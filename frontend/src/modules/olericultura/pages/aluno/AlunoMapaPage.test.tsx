import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AlunoMapaPage } from './AlunoMapaPage';
import * as AuthContextModule from '../../../../contexts/AuthContext';

vi.mock('../../components/TerrariumMap', () => ({
  TerrariumMap: () => <div data-testid="terrarium-map-mock">Mapa 3D Mock</div>,
}));

describe('AlunoMapaPage - Dashboard do Estudante', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        token: 'token-aluno',
        nome: 'Estudante IFPE',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AlunoMapaPage />
      </MemoryRouter>
    );

  it('deve renderizar o cabeçalho do aluno, a turma ativa e os canteiros designados', () => {
    renderComponent();

    expect(screen.getByText('Área do Aluno')).toBeInTheDocument();
    expect(screen.getByText(/painel do estudante/i)).toBeInTheDocument();
    expect(screen.getByText(/meus canteiros designados/i)).toBeInTheDocument();
    expect(screen.getByText(/minhas atividades/i)).toBeInTheDocument();
  });

  it('deve permitir alternar para a visualização do Mapa 3D da UEP', () => {
    renderComponent();

    const btnMapa = screen.getByRole('button', { name: /mapa da uep/i });
    fireEvent.click(btnMapa);

    expect(screen.getByTestId('terrarium-map-mock')).toBeInTheDocument();

    const btnCanteiros = screen.getByRole('button', { name: /meus canteiros/i });
    fireEvent.click(btnCanteiros);

    expect(screen.getByText(/meus canteiros designados/i)).toBeInTheDocument();
  });

  it('deve abrir modal de código de turma ao clicar em Trocar e permitir validar novo código', async () => {
    renderComponent();

    const btnTrocar = screen.getByRole('button', { name: /trocar/i });
    fireEvent.click(btnTrocar);

    expect(screen.getByRole('heading', { name: /digite o código da turma/i })).toBeInTheDocument();

    const inputCodigo = screen.getByLabelText(/código da turma/i);
    fireEvent.change(inputCodigo, { target: { value: 'AGRO-459' } });

    const btnEntrar = screen.getByRole('button', { name: /entrar na turma/i });
    fireEvent.click(btnEntrar);

    await waitFor(() => {
      expect(screen.getByText(/turma .* vinculada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('deve permitir ao aluno marcar/desmarcar tarefas práticas na lista', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    const primeira = checkboxes[0];
    const initialChecked = (primeira as HTMLInputElement).checked;

    fireEvent.click(primeira);
    expect((primeira as HTMLInputElement).checked).toBe(!initialChecked);
  });
});

