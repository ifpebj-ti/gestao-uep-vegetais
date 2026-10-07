package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.UsuarioRole;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

/**
 * Centraliza a classificacao dos usuarios pelos dominios institucionais.
 */
@Service
public class EmailInstitucionalService {

    public static final String DOMINIO_ALUNO = "discente.ifpe.edu.br";
    public static final String DOMINIO_PROFESSOR = "belojardim.ifpe.edu.br";

    public String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public Optional<UsuarioRole> identificarPapel(String email) {
        String emailNormalizado = normalizar(email);
        int arroba = emailNormalizado.lastIndexOf('@');
        if (arroba < 1 || arroba == emailNormalizado.length() - 1) {
            return Optional.empty();
        }

        String dominio = emailNormalizado.substring(arroba + 1);
        if (DOMINIO_ALUNO.equals(dominio)) {
            return Optional.of(UsuarioRole.ALUNO);
        }
        if (DOMINIO_PROFESSOR.equals(dominio)) {
            return Optional.of(UsuarioRole.PROFESSOR);
        }
        return Optional.empty();
    }

    /**
     * Confere se o dominio hospedado informado pelo Google e o mesmo dominio
     * do e-mail validado. Isso evita aceitar uma conta Google pessoal apenas
     * porque o e-mail recebido no cliente foi alterado.
     */
    public boolean dominioHospedadoCorresponde(String email, String dominioHospedado) {
        String emailNormalizado = normalizar(email);
        String dominioNormalizado = normalizar(dominioHospedado);
        int arroba = emailNormalizado.lastIndexOf('@');
        return arroba > 0
                && arroba < emailNormalizado.length() - 1
                && !dominioNormalizado.isBlank()
                && dominioNormalizado.equals(emailNormalizado.substring(arroba + 1));
    }
}
