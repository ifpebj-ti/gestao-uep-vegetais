package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.AlteracaoFichaCampo;

public record AlteracaoFichaCampoDTO(
        String campo,
        String valorAnterior,
        String valorNovo
) {
    public static AlteracaoFichaCampoDTO from(AlteracaoFichaCampo alteracao) {
        return new AlteracaoFichaCampoDTO(
                alteracao.getCampo(), alteracao.getValorAnterior(), alteracao.getValorNovo());
    }
}
