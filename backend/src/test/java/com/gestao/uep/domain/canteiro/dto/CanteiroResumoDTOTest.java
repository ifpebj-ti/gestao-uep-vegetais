package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.cultivo.ModeloCultivo;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CanteiroResumoDTOTest {

    private final Canteiro canteiro = new Canteiro("canteiro-01", "C01", "Canteiro 01");
    private final LocalDate hoje = LocalDate.of(2026, 11, 13);

    @Test
    void converteFichaComModeloEDataIsoParaResumoEmCrescimento() {
        FichaCampo ficha = new FichaCampo(canteiro);
        ficha.setCultura("Nome antigo");
        ficha.setDataPlantio("2026-11-03");
        ficha.setTurma("Agronomia - Turma A");
        ModeloCultivo modelo = modelo("Batata", "Raízes e Tubérculos", 40);
        ficha.setModeloCultivo(modelo);
        List<AlunoResumoDTO> responsaveis = List.of(new AlunoResumoDTO(null, "Ana", "ana@ifpe.edu.br"));

        CanteiroResumoDTO resumo = CanteiroResumoDTO.from(canteiro, ficha, responsaveis, hoje);

        assertThat(resumo.id()).isEqualTo("canteiro-01");
        assertThat(resumo.codigo()).isEqualTo("C01");
        assertThat(resumo.nome()).isEqualTo("Canteiro 01");
        assertThat(resumo.cultura()).isEqualTo("Batata");
        assertThat(resumo.categoria()).isEqualTo("Raízes e Tubérculos");
        assertThat(resumo.turma()).isEqualTo("Agronomia - Turma A");
        assertThat(resumo.cicloDias()).isEqualTo(40);
        assertThat(resumo.diasPlantio()).isEqualTo(10);
        assertThat(resumo.progressoCiclo()).isEqualTo(25);
        assertThat(resumo.statusCiclo()).isEqualTo("Em Crescimento");
        assertThat(resumo.responsaveis()).isEqualTo(responsaveis);
    }

    @Test
    void limitaProgressoA100EIndicaColheitaQuandoCicloFoiAtingido() {
        FichaCampo ficha = new FichaCampo(canteiro);
        ficha.setDataPlantio("2026-09-01");
        ficha.setModeloCultivo(modelo("Cenoura", "Raízes", 60));

        CanteiroResumoDTO resumo = CanteiroResumoDTO.from(canteiro, ficha, List.of(), hoje);

        assertThat(resumo.diasPlantio()).isEqualTo(73);
        assertThat(resumo.progressoCiclo()).isEqualTo(100);
        assertThat(resumo.statusCiclo()).isEqualTo("Pronto p/ Colheita");
    }

    @Test
    void aceitaDataBrasileiraEUsaCulturaDaFichaSemModelo() {
        FichaCampo ficha = new FichaCampo(canteiro);
        ficha.setCultura("Alface");
        ficha.setDataPlantio("3/11/2026");

        CanteiroResumoDTO resumo = CanteiroResumoDTO.from(canteiro, ficha, List.of(), hoje);

        assertThat(resumo.cultura()).isEqualTo("Alface");
        assertThat(resumo.categoria()).isNull();
        assertThat(resumo.diasPlantio()).isEqualTo(10);
        assertThat(resumo.cicloDias()).isNull();
        assertThat(resumo.progressoCiclo()).isNull();
        assertThat(resumo.statusCiclo()).isEqualTo("Em Preparo");
    }

    @Test
    void classificaComoVazioQuandoCulturaAusenteEComoPreparoParaDataInvalida() {
        FichaCampo semCultura = new FichaCampo(canteiro);
        CanteiroResumoDTO resumoVazio = CanteiroResumoDTO.from(canteiro, semCultura, List.of(), hoje);

        FichaCampo dataInvalida = new FichaCampo(canteiro);
        dataInvalida.setCultura("Tomate");
        dataInvalida.setDataPlantio("data-invalida");
        dataInvalida.setModeloCultivo(modelo("Tomate", "Frutos", 90));
        CanteiroResumoDTO resumoPreparo = CanteiroResumoDTO.from(canteiro, dataInvalida, List.of(), hoje);

        assertThat(resumoVazio.statusCiclo()).isEqualTo("Vazio");
        assertThat(resumoVazio.dataPlantio()).isNull();
        assertThat(resumoPreparo.diasPlantio()).isNull();
        assertThat(resumoPreparo.progressoCiclo()).isNull();
        assertThat(resumoPreparo.statusCiclo()).isEqualTo("Em Preparo");
    }

    @Test
    void resumoSemFichaRepresentaCanteiroVazio() {
        CanteiroResumoDTO resumo = CanteiroResumoDTO.from(canteiro, null, List.of(), hoje);

        assertThat(resumo.cultura()).isNull();
        assertThat(resumo.dataPlantio()).isNull();
        assertThat(resumo.cicloDias()).isNull();
        assertThat(resumo.statusCiclo()).isEqualTo("Vazio");
    }

    private ModeloCultivo modelo(String cultura, String categoria, int cicloDias) {
        ModeloCultivo modelo = new ModeloCultivo();
        modelo.setCultura(cultura);
        modelo.setCategoria(categoria);
        modelo.setCicloDias(cicloDias);
        modelo.setEspacamentoLinhasM(new BigDecimal("0.30"));
        modelo.setEspacamentoPlantasM(new BigDecimal("0.20"));
        modelo.setPesoMedioKgPorPlanta(new BigDecimal("0.50"));
        return modelo;
    }
}
