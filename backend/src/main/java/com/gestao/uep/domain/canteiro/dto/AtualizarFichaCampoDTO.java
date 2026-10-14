package com.gestao.uep.domain.canteiro.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AtualizarFichaCampoDTO(
        String grupo,
        String canteiroCodigo,
        String cultura,
        String dataPlantio,
        String espacamento,
        String plantasPorCanteiro,
        String previsaoColheita,
        String adubacao,
        String controlePragas,
        String limpaCapina,
        String obs,
        String statusEntrega,
        String dataEntrega,
        Boolean vistoAssinado,
        String dataVisto,
        String parecer,
        UUID modeloCultivoId,
        BigDecimal areaCanteiroM2,
        BigDecimal plantasPorCanteiroValor
) {
}
