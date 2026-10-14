package com.gestao.uep.domain.cultivo.dto;

import com.gestao.uep.domain.cultivo.ModeloCultivo;
import com.gestao.uep.domain.cultivo.UnidadeProducao;

import java.math.BigDecimal;
import java.util.UUID;

public record ModeloCultivoDTO(
        UUID id,
        String cultura,
        String variedade,
        BigDecimal espacamentoLinhasM,
        BigDecimal espacamentoPlantasM,
        BigDecimal produtividadeKgPorPlanta,
        BigDecimal pesoMedioKgPorUnidade,
        BigDecimal pesoMedioKgPorPlanta,
        UnidadeProducao unidadeProducao,
        BigDecimal fatorAproveitamento,
        boolean ativo
) {

    public static ModeloCultivoDTO from(ModeloCultivo modelo) {
        return new ModeloCultivoDTO(
                modelo.getId(),
                modelo.getCultura(),
                modelo.getVariedade(),
                modelo.getEspacamentoLinhasM(),
                modelo.getEspacamentoPlantasM(),
                modelo.getProdutividadeKgPorPlanta(),
                modelo.getPesoMedioKgPorUnidade(),
                modelo.getPesoMedioKgPorPlanta(),
                modelo.getUnidadeProducao(),
                modelo.getFatorAproveitamento(),
                modelo.isAtivo()
        );
    }
}
