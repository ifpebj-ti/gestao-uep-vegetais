package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.Canteiro;

import java.util.List;

public record CanteiroDetalheDTO(
        String id,
        String codigo,
        String nome,
        List<AlunoResumoDTO> responsaveis,
        FichaCampoDTO ficha,
        boolean podeEditar
) {

    public static CanteiroDetalheDTO from(
            Canteiro canteiro,
            List<AlunoResumoDTO> responsaveis,
            FichaCampoDTO ficha,
            boolean podeEditar
    ) {
        return new CanteiroDetalheDTO(
                canteiro.getId(),
                canteiro.getCodigo(),
                canteiro.getNome(),
                responsaveis,
                ficha,
                podeEditar
        );
    }
}
