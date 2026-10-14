package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.Canteiro;

public record CanteiroResumoDTO(String id, String codigo, String nome) {

    public static CanteiroResumoDTO from(Canteiro canteiro) {
        return new CanteiroResumoDTO(canteiro.getId(), canteiro.getCodigo(), canteiro.getNome());
    }
}
