import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Componente Input', () => {
  it('deve renderizar o label e o input corretamente', () => {
    render(<Input id="email" label="E-mail" placeholder="Digite seu e-mail" />);

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite seu e-mail')).toBeInTheDocument();
  });

  it('deve atualizar o valor ao digitar', () => {
    const handleChange = vi.fn();
    render(<Input id="teste" label="Teste" onChange={handleChange} />);

    const input = screen.getByLabelText('Teste');
    fireEvent.change(input, { target: { value: 'novo valor' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('deve respeitar a propriedade disabled', () => {
    render(<Input id="bloqueado" label="Bloqueado" disabled />);

    expect(screen.getByLabelText('Bloqueado')).toBeDisabled();
  });
});

