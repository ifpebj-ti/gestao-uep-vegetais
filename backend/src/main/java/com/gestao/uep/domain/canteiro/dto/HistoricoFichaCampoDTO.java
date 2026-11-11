package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.HistoricoFichaCampo;

import java.time.Instant;
import java.util.List;

public record HistoricoFichaCampoDTO(
        Instant dataHora,
        String autorNome,
        String autorPapel,
        List<AlteracaoFichaCampoDTO> alteracoes
) {
    public static HistoricoFichaCampoDTO from(HistoricoFichaCampo evento) {
        return new HistoricoFichaCampoDTO(
                evento.getDataHora(),
                evento.getAutorNome(),
                evento.getAutorPapel(),
                evento.getAlteracoes().stream().map(AlteracaoFichaCampoDTO::from).toList()
        );
    }
}
