package com.gestao.uep.domain.canteiro.dto;

import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.cultivo.dto.PrevisaoColheitaDTO;

import java.math.BigDecimal;
import java.util.UUID;

public record FichaCampoDTO(
        String canteiroId,
        String grupo,
        String canteiroCodigo,
        String cultura,
        String variedade,
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
        boolean vistoAssinado,
        String dataVisto,
        String parecer,
        String updatedAt,
        String updatedBy,
        boolean persistida,
        UUID modeloCultivoId,
        BigDecimal areaCanteiroM2,
        BigDecimal plantasPorCanteiroValor,
        PrevisaoColheitaDTO previsaoKg
) {

    public static FichaCampoDTO from(FichaCampo ficha) {
        return new FichaCampoDTO(
                ficha.getCanteiro().getId(),
                ficha.getGrupo(),
                ficha.getCanteiroCodigo(),
                ficha.getCultura(),
                ficha.getModeloCultivo() == null ? null : ficha.getModeloCultivo().getVariedade(),
                ficha.getDataPlantio(),
                ficha.getEspacamento(),
                ficha.getPlantasPorCanteiro(),
                ficha.getPrevisaoColheita(),
                ficha.getAdubacao(),
                ficha.getControlePragas(),
                ficha.getLimpaCapina(),
                ficha.getObs(),
                ficha.getStatusEntrega(),
                ficha.getDataEntrega(),
                ficha.isVistoAssinado(),
                ficha.getDataVisto(),
                ficha.getParecer(),
                ficha.getUpdatedAt() == null ? null : ficha.getUpdatedAt().toString(),
                ficha.getUpdatedBy() == null ? null : ficha.getUpdatedBy().getEmail(),
                true,
                ficha.getModeloCultivo() == null ? null : ficha.getModeloCultivo().getId(),
                ficha.getAreaCanteiroM2(),
                ficha.getPlantasPorCanteiroValor(),
                PrevisaoColheitaDTO.from(ficha)
        );
    }
}
