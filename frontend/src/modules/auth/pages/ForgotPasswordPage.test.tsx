import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ForgotPasswordPage } from './ForgotPasswordPage';

describe('ForgotPasswordPage', () => {
    it('exibe a confirmação informativa após enviar o e-mail', () => {
        render(
            <MemoryRouter>
                <ForgotPasswordPage />
            </MemoryRouter>,
        );

        fireEvent.change(screen.getByLabelText('E-mail'), {
            target: { value: 'usuario@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Enviar instruções' }));

        expect(screen.getByRole('status')).toHaveTextContent(
            'A recuperação por e-mail ainda não está disponível',
        );
    });
});