package com.gestao.uep.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.GeneralSecurityException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleIdentityServiceTest {

    @Mock private GoogleIdTokenVerifier verifier;
    @Mock private GoogleIdToken idToken;
    @Mock private GoogleIdToken.Payload payload;

    private GoogleIdentityService service;

    @BeforeEach
    void setUp() {
        service = new GoogleIdentityService("client-id", verifier);
    }

    @Test
    void rejeitaLoginQuandoClienteGoogleNaoEstaConfigurado() {
        GoogleIdentityService semConfiguracao = new GoogleIdentityService("  ", verifier);

        assertThatThrownBy(() -> semConfiguracao.validar("credential"))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("Login com Google nao esta configurado");
    }

    @Test
    void rejeitaCredencialAusenteAntesDeConsultarGoogle() {
        assertThatThrownBy(() -> service.validar(null))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("Credencial Google ausente");
        assertThatThrownBy(() -> service.validar("  "))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("Credencial Google ausente");
    }

    @Test
    void rejeitaTokenNaoReconhecidoPeloGoogle() throws Exception {
        when(verifier.verify("credential")).thenReturn(null);

        assertThatThrownBy(() -> service.validar("credential"))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("ID token Google invalido");
    }

    @Test
    void rejeitaIdentidadeSemEmailVerificadoOuCamposObrigatorios() throws Exception {
        when(verifier.verify("credential")).thenReturn(idToken);
        when(idToken.getPayload()).thenReturn(payload);
        when(payload.getEmailVerified()).thenReturn(false);

        assertThatThrownBy(() -> service.validar("credential"))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("A conta Google nao possui uma identidade verificada");

        when(payload.getEmailVerified()).thenReturn(true);
        when(payload.getEmail()).thenReturn("aluno@ifpe.edu.br");
        when(payload.getSubject()).thenReturn("subject");
        when(payload.getHostedDomain()).thenReturn("");

        assertThatThrownBy(() -> service.validar("credential"))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("A conta Google nao possui uma identidade verificada");
    }

    @Test
    void extraiIdentidadeVerificadaEUsaNomeNormalizado() throws Exception {
        prepararPayload(true, "aluno@ifpe.edu.br", "subject", "ifpe.edu.br", "  Ana Silva  ");

        GoogleIdentity identity = service.validar("credential");

        assertThat(identity)
                .extracting(GoogleIdentity::subject, GoogleIdentity::email,
                        GoogleIdentity::nome, GoogleIdentity::dominioHospedado)
                .containsExactly("subject", "aluno@ifpe.edu.br", "Ana Silva", "ifpe.edu.br");
    }

    @Test
    void usaParteLocalDoEmailQuandoNomeNaoFoiInformado() throws Exception {
        prepararPayload(true, "aluno@ifpe.edu.br", "subject", "ifpe.edu.br", null);

        assertThat(service.validar("credential").nome()).isEqualTo("aluno");
    }

    @Test
    void transformaFalhaDaApiGoogleEmErroDeAutenticacao() throws Exception {
        when(verifier.verify("credential")).thenThrow(new GeneralSecurityException("indisponivel"));

        assertThatThrownBy(() -> service.validar("credential"))
                .isInstanceOf(GoogleAuthenticationException.class)
                .hasMessage("ID token Google invalido")
                .hasRootCauseMessage("indisponivel");
    }

    private void prepararPayload(
            boolean emailVerificado,
            String email,
            String subject,
            String dominio,
            String nome
    ) throws Exception {
        when(verifier.verify("credential")).thenReturn(idToken);
        when(idToken.getPayload()).thenReturn(payload);
        when(payload.getEmailVerified()).thenReturn(emailVerificado);
        when(payload.getEmail()).thenReturn(email);
        when(payload.getSubject()).thenReturn(subject);
        when(payload.getHostedDomain()).thenReturn(dominio);
        when(payload.get("name")).thenReturn(nome);
    }
}
