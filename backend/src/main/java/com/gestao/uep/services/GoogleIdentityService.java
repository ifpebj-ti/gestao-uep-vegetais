package com.gestao.uep.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Valida ID tokens do Google no servidor antes de qualquer criacao de sessao.
 */
@Service
public class GoogleIdentityService {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    @Autowired
    public GoogleIdentityService(
            @Value("${google.client-id:}") String clientId
    ) {
        this(clientId, criarVerifier(clientId));
    }

    GoogleIdentityService(String clientId, GoogleIdTokenVerifier verifier) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.verifier = verifier;
    }

    private static GoogleIdTokenVerifier criarVerifier(String clientId) {
        try {
            GoogleIdTokenVerifier.Builder builder = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance()
            );
            String clientIdNormalizado = clientId == null ? "" : clientId.trim();
            if (!clientIdNormalizado.isBlank()) {
                builder.setAudience(Collections.singletonList(clientIdNormalizado));
            }
            return builder.build();
        } catch (GeneralSecurityException | IOException exception) {
            throw new IllegalStateException("Nao foi possivel preparar a validacao do Google", exception);
        }
    }

    public GoogleIdentity validar(String credential) {
        if (clientId.isBlank()) {
            throw new GoogleAuthenticationException("Login com Google nao esta configurado");
        }
        if (credential == null || credential.isBlank()) {
            throw new GoogleAuthenticationException("Credencial Google ausente");
        }

        try {
            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new GoogleAuthenticationException("ID token Google invalido");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String subject = payload.getSubject();
            String dominioHospedado = payload.getHostedDomain();
            String nome = payload.get("name") instanceof String nomeClaim
                    ? nomeClaim.trim()
                    : "";

            if (!Boolean.TRUE.equals(payload.getEmailVerified())
                    || isBlank(email)
                    || isBlank(subject)
                    || isBlank(dominioHospedado)) {
                throw new GoogleAuthenticationException("A conta Google nao possui uma identidade verificada");
            }

            return new GoogleIdentity(
                    subject,
                    email,
                    nome.isBlank() ? email.substring(0, email.indexOf('@')) : nome,
                    dominioHospedado
            );
        } catch (GoogleAuthenticationException exception) {
            throw exception;
        } catch (GeneralSecurityException | IOException | RuntimeException exception) {
            throw new GoogleAuthenticationException("ID token Google invalido", exception);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
