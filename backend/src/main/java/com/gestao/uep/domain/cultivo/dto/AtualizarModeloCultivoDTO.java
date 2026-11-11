package com.gestao.uep.domain.cultivo.dto;

import com.gestao.uep.domain.cultivo.UnidadeProducao;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AtualizarModeloCultivoDTO(
        @NotBlank String cultura,
        String variedade,
        @Size(max = 80) String categoria,
        @Min(1) @Max(730) Integer cicloDias,
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
