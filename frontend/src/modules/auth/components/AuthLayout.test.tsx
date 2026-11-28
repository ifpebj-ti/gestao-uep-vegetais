import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import packageJson from '../../../../package.json';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
  it('exibe a versão sincronizada no rodapé', () => {
    render(
      <AuthLayout>
        <div>Formulário de autenticação</div>
      </AuthLayout>
    );

    expect(screen.getByText(`Terrarium v${packageJson.version}`)).toBeInTheDocument();
  });
});
