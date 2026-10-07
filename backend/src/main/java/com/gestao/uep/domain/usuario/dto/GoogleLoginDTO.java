package com.gestao.uep.domain.usuario.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * ID token emitido pelo Google Identity Services para autenticar no backend.
 */
public record GoogleLoginDTO(
        @NotBlank(message = "A credencial Google e obrigatoria") String credential
) {
}
