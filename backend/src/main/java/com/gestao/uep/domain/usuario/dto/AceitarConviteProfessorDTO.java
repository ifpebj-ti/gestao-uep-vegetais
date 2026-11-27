package com.gestao.uep.domain.usuario.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AceitarConviteProfessorDTO(
        @NotBlank(message = "O token é obrigatório")
        @Size(max = 128, message = "Convite inválido ou expirado")
        String token,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, max = 72, message = "A senha deve ter entre 6 e 72 caracteres")
        String senha
) {
    @Override
    public String toString() {
        return "AceitarConviteProfessorDTO";
    }
}
