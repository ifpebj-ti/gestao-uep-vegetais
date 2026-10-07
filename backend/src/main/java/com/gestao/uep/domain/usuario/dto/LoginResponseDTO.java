package com.gestao.uep.domain.usuario.dto;

import com.gestao.uep.domain.usuario.UsuarioRole;

/**
 * DTO de resposta após login bem-sucedido.
 * Retorna o token JWT junto com dados básicos do usuário.
 */
public record LoginResponseDTO(
        String token,
        String nome,
        String email,
        UsuarioRole role
) {
}
