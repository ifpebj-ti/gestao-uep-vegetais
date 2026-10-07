package com.gestao.uep.domain.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ReenvioConfirmacaoDTO(
        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "Formato de e-mail invalido")
        String email
) {
}
