package com.gestao.uep.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.DisabledException;

import static org.assertj.core.api.Assertions.assertThat;

class AuthExceptionHandlerTest {

    @Test
    void deveInformarQuandoContaAindaNaoFoiConfirmada() {
        var response = new AuthExceptionHandler()
                .contaNaoVerificada(new DisabledException("disabled"));

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody()).containsEntry("codigo", "EMAIL_NAO_VERIFICADO");
    }
}
