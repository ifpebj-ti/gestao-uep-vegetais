package com.gestao.uep.domain.cultivo.dto;

import com.gestao.uep.domain.cultivo.UnidadeProducao;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AtualizarModeloCultivoDTO(
        @NotBlank String cultura,
        String variedade,
        @NotNull @DecimalMin("0.0001") BigDecimal espacamentoLinhasM,
        @NotNull @DecimalMin("0.0001") BigDecimal espacamentoPlantasM,
        @DecimalMin("0.0001") BigDecimal produtividadeKgPorPlanta,
        @DecimalMin("0.0001") BigDecimal pesoMedioKgPorUnidade,
        @NotNull @DecimalMin("0.0001") BigDecimal pesoMedioKgPorPlanta,
        @NotNull UnidadeProducao unidadeProducao,
        @NotNull @DecimalMin("0.0001") @DecimalMax("1.0000") BigDecimal fatorAproveitamento,
        Boolean ativo
) {
}
