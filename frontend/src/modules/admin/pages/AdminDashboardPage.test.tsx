import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AuthProvider } from '../../../contexts/AuthContext';
import { UepProvider } from '../../../contexts/UepContext';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <UepProvider>
            <AdminDashboardPage />
          </UepProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('deve renderizar o cabeçalho do painel do Admin e a lista inicial de professores', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: /gestão de professores e ueps/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Prof. George Henrique')).toBeInTheDocument();
    expect(screen.getByText('Profa. Carla Mendes')).toBeInTheDocument();
  });

  it('deve permitir cadastrar um novo professor apenas com nome, e-mail institucional e UEP (sem campo de senha)', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /cadastrar professor/i }));

    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nome completo do professor/i), {
      target: { value: 'Prof. Roberto Almeida' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail institucional docente/i), {
      target: { value: 'roberto@belojardim.ifpe.edu.br' },
    });

    // Seleciona Fruticultura no modal
    const modal = screen.getByRole('dialog');
    const btnFruticultura = Array.from(modal.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Fruticultura')
    );
    expect(btnFruticultura).toBeDefined();
    fireEvent.click(btnFruticultura!);

    // Salva
    const submitBtn = Array.from(modal.querySelectorAll('button')).find(
      (b) => b.getAttribute('type') === 'submit'
    );
    fireEvent.click(submitBtn!);

    expect(screen.getByText('Prof. Roberto Almeida')).toBeInTheDocument();
    expect(screen.getByText('roberto@belojardim.ifpe.edu.br')).toBeInTheDocument();
  });

  it('deve bloquear cadastro se o e-mail não for institucional docente', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /cadastrar professor/i }));

    fireEvent.change(screen.getByLabelText(/nome completo do professor/i), {
      target: { value: 'Prof. Teste' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail institucional docente/i), {
      target: { value: 'teste@gmail.com' },
    });

    const modal = screen.getByRole('dialog');
    const submitBtn = Array.from(modal.querySelectorAll('button')).find(
      (b) => b.getAttribute('type') === 'submit'
    );
    fireEvent.click(submitBtn!);

    expect(
      screen.getByText(/o professor deve ser cadastrado exclusivamente com e-mail institucional/i)
    ).toBeInTheDocument();
  });

  it('deve permitir alterar a UEP de um professor e remover um professor', () => {
    renderPage();

    const selectGeorge = screen.getByLabelText('UEP de Prof. George Henrique') as HTMLSelectElement;
    expect(selectGeorge.value).toBe('olericultura');

    fireEvent.change(selectGeorge, { target: { value: 'fruticultura' } });
    expect(selectGeorge.value).toBe('fruticultura');

    const btnRemover = screen.getByLabelText('Remover Prof. George Henrique');
    fireEvent.click(btnRemover);

    expect(screen.queryByText('Prof. George Henrique')).not.toBeInTheDocument();
  });
});
