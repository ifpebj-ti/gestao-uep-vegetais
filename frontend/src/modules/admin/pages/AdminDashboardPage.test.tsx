import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AuthProvider } from '../../../contexts/AuthContext';
import { UepProvider } from '../../../contexts/UepContext';
import { adminService, type ProfessorCadastrado } from '../../../services/adminService';

const george: ProfessorCadastrado = {
  id: 'prof-george',
  nome: 'Prof. George Henrique',
  email: 'george@belojardim.ifpe.edu.br',
  uep: 'olericultura',
  criadoEm: '2026-01-01T12:00:00Z',
  ativo: true,
  emailVerificado: true,
  convitePendente: false,
};

const carla: ProfessorCadastrado = {
  id: 'prof-carla',
  nome: 'Profa. Carla Mendes',
  email: 'carla@belojardim.ifpe.edu.br',
  uep: 'fruticultura',
  criadoEm: '2026-01-02T12:00:00Z',
  ativo: true,
  emailVerificado: true,
  convitePendente: false,
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(adminService, 'listarProfessores').mockResolvedValue([george, carla]);
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <UepProvider>
            <AdminDashboardPage />
          </UepProvider>
        </AuthProvider>
      </MemoryRouter>
    );

  it('renderiza o cabeçalho e a lista inicial retornada pelo backend', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /gestão de professores e ueps/i })).toBeInTheDocument();
    expect(await screen.findByText('Prof. George Henrique')).toBeInTheDocument();
    expect(screen.getByText('Profa. Carla Mendes')).toBeInTheDocument();
  });

  it('cadastra professor sem pedir senha e exibe o registro retornado pelo backend', async () => {
    const novoProfessor: ProfessorCadastrado = {
      id: 'prof-roberto',
      nome: 'Prof. Roberto Almeida',
      email: 'roberto@belojardim.ifpe.edu.br',
      uep: 'fruticultura',
      criadoEm: '2026-01-03T12:00:00Z',
      ativo: false,
      emailVerificado: false,
      convitePendente: true,
    };
    const criarProfessor = vi.spyOn(adminService, 'criarProfessor').mockResolvedValue({
      professor: novoProfessor,
      emailEnviado: true,
    });
    renderPage();
    await screen.findByText('Prof. George Henrique');

    fireEvent.click(screen.getByRole('button', { name: /cadastrar professor/i }));
    const dialog = screen.getByRole('dialog');
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/nome completo do professor/i), {
      target: { value: 'Prof. Roberto Almeida' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail institucional docente/i), {
      target: { value: 'roberto@belojardim.ifpe.edu.br' },
    });
    const fruitOption = Array.from(dialog.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Fruticultura')
    );
    fireEvent.click(fruitOption!);
    fireEvent.submit(dialog.querySelector('form')!);

    expect(await screen.findByText('Prof. Roberto Almeida')).toBeInTheDocument();
    expect(screen.getByText('roberto@belojardim.ifpe.edu.br')).toBeInTheDocument();
    expect(criarProfessor).toHaveBeenCalledWith({
      nome: 'Prof. Roberto Almeida',
      email: 'roberto@belojardim.ifpe.edu.br',
      uep: 'fruticultura',
    });
  });

  it('bloqueia o cadastro de e-mail que não seja institucional docente', async () => {
    const criarProfessor = vi.spyOn(adminService, 'criarProfessor');
    renderPage();
    await screen.findByText('Prof. George Henrique');

    fireEvent.click(screen.getByRole('button', { name: /cadastrar professor/i }));
    fireEvent.change(screen.getByLabelText(/nome completo do professor/i), {
      target: { value: 'Prof. Teste' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail institucional docente/i), {
      target: { value: 'teste@gmail.com' },
    });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /o professor deve ser cadastrado exclusivamente com e-mail institucional/i
    );
    expect(criarProfessor).not.toHaveBeenCalled();
  });

  it('altera a UEP e desativa a conta preservando o professor na lista', async () => {
    const alterarUep = vi.spyOn(adminService, 'alterarUep').mockResolvedValue({
      ...george,
      uep: 'fruticultura',
    });
    const alterarStatus = vi.spyOn(adminService, 'alterarStatus').mockResolvedValue({
      ...george,
      uep: 'fruticultura',
      ativo: false,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await screen.findByText('Prof. George Henrique');

    const selectUep = screen.getByLabelText('UEP de Prof. George Henrique') as HTMLSelectElement;
    fireEvent.change(selectUep, { target: { value: 'fruticultura' } });
    await waitFor(() => expect(selectUep.value).toBe('fruticultura'));
    expect(alterarUep).toHaveBeenCalledWith('prof-george', 'fruticultura');

    fireEvent.click(screen.getByRole('button', { name: 'Desativar Prof. George Henrique' }));
    expect(await screen.findByRole('button', { name: 'Reativar Prof. George Henrique' })).toBeInTheDocument();
    expect(screen.getByText('Prof. George Henrique')).toBeInTheDocument();
    expect(alterarStatus).toHaveBeenCalledWith('prof-george', false);
  });
});
