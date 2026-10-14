package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.canteiro.dto.AtualizarFichaCampoDTO;
import com.gestao.uep.domain.cultivo.ModeloCultivo;
import com.gestao.uep.domain.cultivo.ModeloCultivoRepository;
import com.gestao.uep.domain.cultivo.UnidadeProducao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrevisaoColheitaServiceTest {

    @Mock
    private ModeloCultivoRepository modeloRepository;

    @Test
    void calculaKgPeloLayoutFixoDoCanteiro() {
        UUID modeloId = UUID.randomUUID();
        ModeloCultivo modelo = modelo("Alface", UnidadeProducao.KG, "1.4", null, "0.8");
        when(modeloRepository.findById(modeloId)).thenReturn(Optional.of(modelo));

        FichaCampo ficha = ficha();
        new PrevisaoColheitaService(modeloRepository).aplicar(
                ficha, dados(modeloId, "7.2", "10"), null);

        assertThat(ficha.getPrevisaoPlantas()).isEqualByComparingTo("72.00");
        assertThat(ficha.getPlantasPorCanteiro()).isEqualTo("72 plantas");
        assertThat(ficha.getEspacamento()).isEqualTo("0,3 m x 0,3 m");
        assertThat(ficha.getPrevisaoColheitaKg()).isEqualByComparingTo("80.64");
        assertThat(ficha.getPrevisaoFatorAproveitamento()).isEqualByComparingTo("0.8");
        assertThat(ficha.getPrevisaoAviso()).isNull();
    }

    @Test
    void calculaKgPeloEspacamentoQuandoNaoHaQuantidadeInformada() {
        UUID modeloId = UUID.randomUUID();
        ModeloCultivo modelo = modelo("Cenoura", UnidadeProducao.KG, "0.1", null, "1");
        modelo.setEspacamentoLinhasM(new BigDecimal("0.2"));
        modelo.setEspacamentoPlantasM(new BigDecimal("0.1"));
        when(modeloRepository.findById(modeloId)).thenReturn(Optional.of(modelo));

        FichaCampo ficha = ficha();
        new PrevisaoColheitaService(modeloRepository).aplicar(
                ficha, dados(modeloId, "2", null), null);

        assertThat(ficha.getPrevisaoPlantas()).isEqualByComparingTo("100.00");
        assertThat(ficha.getPrevisaoColheitaKg()).isEqualByComparingTo("10.00");
        assertThat(ficha.getPrevisaoAviso()).isNull();
    }

    @Test
    void calculaPesoParaUnidadeComPesoMedio() {
        UUID modeloId = UUID.randomUUID();
        ModeloCultivo modelo = modelo("Alface", UnidadeProducao.UNIDADE, null, "0.25", "0.8");
        when(modeloRepository.findById(modeloId)).thenReturn(Optional.of(modelo));

        FichaCampo ficha = ficha();
        new PrevisaoColheitaService(modeloRepository).aplicar(
                ficha, dados(modeloId, "7.2", "10"), null);

        assertThat(ficha.getPrevisaoPlantas()).isEqualByComparingTo("72.00");
        assertThat(ficha.getPrevisaoColheitaKg()).isEqualByComparingTo("14.40");
    }

    @Test
    void calculaProducaoPeloLayoutFixo() {
        UUID modeloId = UUID.randomUUID();
        ModeloCultivo modelo = modelo("Batata", UnidadeProducao.KG, "0.6", null, "0.9");
        when(modeloRepository.findById(modeloId)).thenReturn(Optional.of(modelo));

        FichaCampo ficha = ficha();
        new PrevisaoColheitaService(modeloRepository).aplicar(
                ficha, dados(modeloId, "10", "50"), null);

        assertThat(ficha.getPrevisaoPlantas()).isEqualByComparingTo("99.00");
        assertThat(ficha.getPrevisaoColheitaKg()).isEqualByComparingTo("53.46");
        assertThat(ficha.getPrevisaoAviso()).isNull();
    }

    @Test
    void rejeitaValoresAgronomicosNaoPositivos() {
        UUID modeloId = UUID.randomUUID();
        ModeloCultivo modelo = modelo("Cenoura", UnidadeProducao.KG, "0.1", null, "1");
        when(modeloRepository.findById(modeloId)).thenReturn(Optional.of(modelo));

        assertThatThrownBy(() -> new PrevisaoColheitaService(modeloRepository).aplicar(
                ficha(), dados(modeloId, "0", null), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("maiores que zero");
    }

    @Test
    void mantemAvisoQuandoModeloNaoTemMediaPorPlanta() {
        UUID modeloId = UUID.randomUUID();
        ModeloCultivo modelo = modelo("Brócolo", UnidadeProducao.UNIDADE, null, null, "1");
        when(modeloRepository.findById(modeloId)).thenReturn(Optional.of(modelo));

        FichaCampo ficha = ficha();
        new PrevisaoColheitaService(modeloRepository).aplicar(
                ficha, dados(modeloId, "7.2", null), null);

        assertThat(ficha.getPrevisaoColheitaKg()).isNull();
        assertThat(ficha.getPrevisaoAviso()).contains("media de kg");
    }

    private ModeloCultivo modelo(String cultura, UnidadeProducao unidade,
                                 String produtividade, String pesoMedio, String fator) {
        ModeloCultivo modelo = new ModeloCultivo();
        modelo.setCultura(cultura);
        modelo.setEspacamentoLinhasM(new BigDecimal("0.3"));
        modelo.setEspacamentoPlantasM(new BigDecimal("0.3"));
        modelo.setProdutividadeKgPorPlanta(valor(produtividade));
        modelo.setPesoMedioKgPorUnidade(valor(pesoMedio));
        modelo.setPesoMedioKgPorPlanta(valor(produtividade == null ? pesoMedio : produtividade));
        modelo.setUnidadeProducao(unidade);
        modelo.setFatorAproveitamento(new BigDecimal(fator));
        modelo.setAtivo(true);
        return modelo;
    }

    private FichaCampo ficha() {
        return new FichaCampo(new Canteiro("canteiro-01", "C01", "Canteiro 01"));
    }

    private AtualizarFichaCampoDTO dados(UUID modeloId, String area,
        String plantasPorCanteiro) {
        return new AtualizarFichaCampoDTO(
                null,
                "C01",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                modeloId,
                valor(area),
                valor(plantasPorCanteiro)
        );
    }

    private BigDecimal valor(String valor) {
        return valor == null ? null : new BigDecimal(valor);
    }
}
