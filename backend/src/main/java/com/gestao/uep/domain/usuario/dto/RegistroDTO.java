package com.gestao.uep.domain.usuario.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para requisicao de cadastro de novo usuario.
 * O papel e definido pelo backend a partir do dominio institucional.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RegistroDTO(

        @NotBlank(message = "O nome e obrigatorio")
        String nome,

        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "Formato de e-mail invalido")
        String email,

        @NotBlank(message = "A senha e obrigatoria")
        @Size(min = 6, message = "A senha deve ter no minimo 6 caracteres")
        String senha
) {
}
