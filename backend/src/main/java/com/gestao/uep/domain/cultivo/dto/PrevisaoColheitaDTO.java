package com.gestao.uep.domain.cultivo.dto;

import com.gestao.uep.domain.canteiro.FichaCampo;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PrevisaoColheitaDTO(
        UUID modeloCultivoId,
        String modeloCultivoNome,
        BigDecimal areaCanteiroM2,
        BigDecimal plantasEstimadas,
        BigDecimal previsaoKg,
        BigDecimal fatorAproveitamento,
        String unidadeProducao,
        BigDecimal espacamentoLinhasM,
        BigDecimal espacamentoPlantasM,
        BigDecimal produtividadeKgPorPlanta,
        BigDecimal pesoMedioKgPorUnidade,
        BigDecimal pesoMedioKgPorPlanta,
        Instant calculadaEm,
        String aviso
) {

    public static PrevisaoColheitaDTO from(FichaCampo ficha) {
        var modelo = ficha.getModeloCultivo();
        String nome = ficha.getPrevisaoModeloNome();
        String unidade = ficha.getPrevisaoUnidadeProducao();
        BigDecimal espacamentoLinhas = ficha.getPrevisaoEspacamentoLinhasM();
        BigDecimal espacamentoPlantas = ficha.getPrevisaoEspacamentoPlantasM();
        BigDecimal produtividade = ficha.getPrevisaoProdutividadeKgPorPlanta();
        BigDecimal pesoMedio = ficha.getPrevisaoPesoMedioKgPorUnidade();
        BigDecimal pesoPorPlanta = ficha.getPrevisaoPesoMedioKgPorPlanta();
        if (modelo != null && nome == null) {
            nome = modelo.getCultura()
                    + (modelo.getVariedade() == null || modelo.getVariedade().isBlank()
                    ? "" : " - " + modelo.getVariedade());
            unidade = modelo.getUnidadeProducao() == null ? null : modelo.getUnidadeProducao().name();
            espacamentoLinhas = modelo.getEspacamentoLinhasM();
            espacamentoPlantas = modelo.getEspacamentoPlantasM();
            produtividade = modelo.getProdutividadeKgPorPlanta();
            pesoMedio = modelo.getPesoMedioKgPorUnidade();
            pesoPorPlanta = modelo.getPesoMedioKgPorPlanta();
        }
        return new PrevisaoColheitaDTO(
                modelo == null ? null : modelo.getId(),
                nome,
                ficha.getAreaCanteiroM2(),
                ficha.getPrevisaoPlantas(),
                ficha.getPrevisaoColheitaKg(),
                ficha.getPrevisaoFatorAproveitamento(),
                unidade,
                espacamentoLinhas,
                espacamentoPlantas,
                produtividade,
                pesoMedio,
                pesoPorPlanta,
                ficha.getPrevisaoCalculadaEm(),
                ficha.getPrevisaoAviso()
        );
    }
}
