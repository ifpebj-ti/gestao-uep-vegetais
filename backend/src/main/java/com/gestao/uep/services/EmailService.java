package com.gestao.uep.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Responsavel por enviar os e-mails transacionais de autenticacao.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String remetente;
    private final String frontendUrl;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:no-reply@belojardim.ifpe.edu.br}") String remetente,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.mailSender = mailSender;
        this.remetente = remetente;
        this.frontendUrl = frontendUrl.replaceAll("/$", "");
    }

    public void enviarConfirmacao(String email, String token) {
        String link = frontendUrl + "/confirm-email?token=" + token;

        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(email);
        mensagem.setSubject("Confirme seu acesso ao Terrarium");
        mensagem.setText(""
                + "Ola!\n\n"
                + "Confirme seu e-mail institucional para ativar sua conta no Terrarium:\n\n"
                + link + "\n\n"
                + "Este link expira em 24 horas e so pode ser usado uma vez.\n\n"
                + "Se voce nao solicitou este cadastro, ignore esta mensagem.");

        mailSender.send(mensagem);
    }
}
