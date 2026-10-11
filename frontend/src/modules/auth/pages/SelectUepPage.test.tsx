import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SelectUepPage } from './SelectUepPage';
import { UepProvider } from '../../../contexts/UepContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SelectUepPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <UepProvider>
          <SelectUepPage />
        </UepProvider>
      </MemoryRouter>
    );
  };

  it('deve renderizar os títulos das duas UEPs disponíveis', () => {
    renderPage();

    expect(screen.getByText('Olericultura')).toBeInTheDocument();
    expect(screen.getByText('Fruticultura')).toBeInTheDocument();
  });

  it('deve navegar para /login com state de olericultura ao clicar no card de Olericultura', () => {
    renderPage();

    const olericulturaCard = screen.getByRole('heading', { name: 'Olericultura' }).closest('button');
    expect(olericulturaCard).not.toBeNull();
    fireEvent.click(olericulturaCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { selectedUep: 'olericultura' },
    });
    expect(sessionStorage.getItem('terrarium_selected_uep')).toBe('olericultura');
  });

  it('deve navegar para /login com state de fruticultura ao clicar no card de Fruticultura', () => {
    renderPage();

    const fruticulturaCard = screen.getByRole('heading', { name: 'Fruticultura' }).closest('button');
    expect(fruticulturaCard).not.toBeNull();
    fireEvent.click(fruticulturaCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { selectedUep: 'fruticultura' },
    });
    expect(sessionStorage.getItem('terrarium_selected_uep')).toBe('fruticultura');
  });
});
