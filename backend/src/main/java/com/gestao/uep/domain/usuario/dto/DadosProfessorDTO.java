package com.gestao.uep.domain.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DadosProfessorDTO(
        @NotBlank(message = "Informe o nome do professor")
        @Size(max = 255, message = "O nome deve ter no máximo 255 caracteres")
        String nome,

        @NotBlank(message = "Informe o e-mail institucional do professor")
        @Email(message = "Formato de e-mail inválido")
        @Size(max = 255, message = "O e-mail deve ter no máximo 255 caracteres")
        String email,

        @NotBlank(message = "Informe a UEP do professor")
        String uep
) {
    public DadosProfessorDTO {
        nome = nome == null ? null : nome.strip();
        email = email == null ? null : email.trim();
    }
}
