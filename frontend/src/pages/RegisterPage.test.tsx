import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import { authService } from '../services/authService';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderRegisterPage = () => {

    return render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  };

  it('deve renderizar os campos de cadastro e o botão de criar conta', () => {
    renderRegisterPage();

    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Repita a senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^criar conta$/i })).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro se tentar enviar formulário vazio', async () => {
    renderRegisterPage();

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText('Por favor, preencha todos os campos.')
    ).toBeInTheDocument();
  });

  it('deve exibir erro se as senhas não coincidirem', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@discente.ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: '654321' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText('As senhas não coincidem.')
    ).toBeInTheDocument();
  });

  it('deve exibir erro se a senha tiver menos de 8 caracteres', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@discente.ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha1' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: 'Senha1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText(
        'A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra e um número.'
      )
    ).toBeInTheDocument();
  });

  it('deve exibir erro se a senha não contiver letras', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@discente.ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: '12345678' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: '12345678' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText(
        'A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra e um número.'
      )
    ).toBeInTheDocument();
  });

  it('deve exibir erro se a senha não contiver números', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@discente.ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaSegura' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: 'SenhaSegura' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText(
        'A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra e um número.'
      )
    ).toBeInTheDocument();
  });

  it('deve exibir erro se não aceitar os termos', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@discente.ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaValida123' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: 'SenhaValida123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText('Você precisa aceitar os termos e a política de privacidade.')
    ).toBeInTheDocument();
  });

  it('deve exibir os itens do checklist dinâmico apenas quando o usuário começar a digitar a senha', () => {
    renderRegisterPage();

    expect(screen.queryByText('Requisitos da senha:')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'S' },
    });

    expect(screen.getByText('Requisitos da senha:')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Pelo menos uma letra e um número')).toBeInTheDocument();
  });


  it('deve exibir erro se o e-mail for informado em formato inválido', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'emailinvalido' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaValida123' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: 'SenhaValida123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText('Por favor, insira um e-mail em formato válido.')
    ).toBeInTheDocument();
  });

  it('deve exibir erro se o e-mail não for institucional acadêmico', async () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@gmail.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaValida123' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: 'SenhaValida123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(
      await screen.findByText(
        'É necessário utilizar um e-mail institucional de aluno ou professor (ex: nome@discente.ifpe.edu.br ou nome@belojardim.ifpe.edu.br).'
      )
    ).toBeInTheDocument();
  });

  it('deve exibir a tela de confirmação de e-mail ao cadastrar com sucesso', async () => {
    vi.spyOn(authService, 'register').mockResolvedValue({
      message: 'Conta criada com sucesso!',
    });

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Isabela Santos' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'isabela@discente.ifpe.edu.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaValida123' },
    });
    fireEvent.change(screen.getByLabelText('Repita a senha'), {
      target: { value: 'SenhaValida123' },
    });

    const checkboxTermos = screen.getByRole('checkbox');
    fireEvent.click(checkboxTermos);

    fireEvent.click(screen.getByRole('button', { name: /^criar conta$/i }));

    expect(await screen.findByText('Verifique seu e-mail')).toBeInTheDocument();
    expect(screen.getByText('isabela@discente.ifpe.edu.br')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir para o login/i })).toBeInTheDocument();
  });
});




