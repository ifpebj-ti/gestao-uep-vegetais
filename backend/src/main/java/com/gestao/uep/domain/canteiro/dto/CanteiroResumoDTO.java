package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.cultivo.ModeloCultivo;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;

public record CanteiroResumoDTO(
        String id,
        String codigo,
        String nome,
        String cultura,
        String categoria,
        String turma,
        String dataPlantio,
        Integer cicloDias,
        Integer diasPlantio,
        Integer progressoCiclo,
        String statusCiclo,
        List<AlunoResumoDTO> responsaveis
) {

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("d/M/uuuu");

    public static CanteiroResumoDTO from(
            Canteiro canteiro,
            FichaCampo ficha,
            List<AlunoResumoDTO> responsaveis,
            LocalDate hoje
    ) {
        ModeloCultivo modelo = ficha == null ? null : ficha.getModeloCultivo();
        String cultura = modelo != null
                ? modelo.getCultura()
                : ficha == null ? null : ficha.getCultura();
        String dataPlantio = ficha == null ? null : ficha.getDataPlantio();
        Integer cicloDias = modelo == null ? null : modelo.getCicloDias();
        LocalDate plantio = parseData(dataPlantio);
        Integer diasPlantio = plantio == null
                ? null
                : Math.toIntExact(Math.max(0, ChronoUnit.DAYS.between(plantio, hoje)));
        Integer progresso = cicloDias == null || diasPlantio == null
                ? null
                : Math.min(100, Math.round(diasPlantio * 100.0f / cicloDias));
        String status = status(cultura, plantio, diasPlantio, cicloDias);

        return new CanteiroResumoDTO(
                canteiro.getId(),
                canteiro.getCodigo(),
                canteiro.getNome(),
                cultura,
                modelo == null ? null : modelo.getCategoria(),
                ficha == null ? null : ficha.getTurma(),
                dataPlantio,
                cicloDias,
                diasPlantio,
                progresso,
                status,
                responsaveis
        );
    }

    private static String status(String cultura, LocalDate plantio, Integer diasPlantio, Integer cicloDias) {
        if (cultura == null || cultura.isBlank()) return "Vazio";
        if (plantio == null || diasPlantio == null || cicloDias == null) return "Em Preparo";
        return diasPlantio >= cicloDias ? "Pronto p/ Colheita" : "Em Crescimento";
    }

    private static LocalDate parseData(String valor) {
        if (valor == null || valor.isBlank()) return null;
        try {
            return LocalDate.parse(valor.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDate.parse(valor.trim(), DATA_BR);
            } catch (DateTimeParseException ignoredAgain) {
                return null;
            }
        }
    }
}
