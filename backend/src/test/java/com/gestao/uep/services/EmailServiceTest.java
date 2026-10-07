package com.gestao.uep.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void deveEnviarLinkDeConfirmacaoSemExporSenha() {
        EmailService service = new EmailService(
                mailSender,
                "no-reply@belojardim.ifpe.edu.br",
                "http://localhost:5173/"
        );

        service.enviarConfirmacao("maria@discente.ifpe.edu.br", "token-secreto");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage mensagem = captor.getValue();
        assertThat(mensagem.getFrom()).isEqualTo("no-reply@belojardim.ifpe.edu.br");
        assertThat(mensagem.getTo()).containsExactly("maria@discente.ifpe.edu.br");
        assertThat(mensagem.getText()).contains("http://localhost:5173/confirm-email?token=token-secreto");
        assertThat(mensagem.getText()).doesNotContain("senha");
    }
}
