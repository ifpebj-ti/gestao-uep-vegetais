package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.usuario.Usuario;

import java.util.UUID;

public record AlunoResumoDTO(UUID id, String nome, String email) {

    public static AlunoResumoDTO from(Usuario usuario) {
        return new AlunoResumoDTO(usuario.getId(), usuario.getNome(), usuario.getEmail());
    }
}
