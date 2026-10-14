package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.cultivo.ModeloCultivo;
import com.gestao.uep.domain.cultivo.ModeloCultivoRepository;
import com.gestao.uep.domain.canteiro.dto.AtualizarFichaCampoDTO;
import com.gestao.uep.domain.usuario.Usuario;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PrevisaoColheitaService {

    private static final BigDecimal LARGURA_CANTEIRO_M = BigDecimal.ONE;

    private final ModeloCultivoRepository modeloRepository;

    public PrevisaoColheitaService(ModeloCultivoRepository modeloRepository) {
        this.modeloRepository = modeloRepository;
    }

    public void aplicar(FichaCampo ficha, AtualizarFichaCampoDTO dados, Usuario usuario) {
        ModeloCultivo modelo = null;
        UUID modeloId = dados.modeloCultivoId();
        if (modeloId != null) {
            modelo = modeloRepository.findById(modeloId)
                    .orElseThrow(() -> new IllegalArgumentException("Modelo de cultivo nao encontrado"));
            if (!modelo.isAtivo()) {
                throw new IllegalArgumentException("O modelo de cultivo selecionado esta inativo");
            }
        }

        ficha.setModeloCultivo(modelo);
        ficha.setAreaCanteiroM2(positivoOuNulo(dados.areaCanteiroM2()));
        ficha.setPlantasPorCanteiro(null);
        ficha.setPlantasPorCanteiroValor(null);
        if (modelo != null) {
            ficha.setEspacamento(formatarEspacamento(modelo.getEspacamentoLinhasM(), modelo.getEspacamentoPlantasM()));
        }
        ficha.setPrevisaoCalculadaEm(Instant.now());
        ficha.setPrevisaoFatorAproveitamento(modelo == null ? null : modelo.getFatorAproveitamento());
        preencherSnapshot(ficha, modelo);

        if (modelo == null) {
            limparResultado(ficha, "Selecione um modelo de cultivo para calcular a previsao.");
            return;
        }

        List<String> avisos = new ArrayList<>();
        BigDecimal plantas = calcularPlantas(ficha.getAreaCanteiroM2(), modelo);
        ficha.setPlantasPorCanteiroValor(plantas == null ? null : escala(plantas));
        ficha.setPrevisaoPlantas(plantas == null ? null : escala(plantas));
        ficha.setPlantasPorCanteiro(plantas == null
                ? null
                : plantas.setScale(0, RoundingMode.UNNECESSARY).toPlainString() + " plantas");

        BigDecimal produtividade = modelo.getPesoMedioKgPorPlanta();
        if (plantas == null) {
            avisos.add("Informe a area do canteiro para calcular as plantas pelo espacamento.");
        }
        if (produtividade == null || produtividade.signum() <= 0) {
            avisos.add("Informe a media de kg por planta para esta cultura.");
        }

        if (plantas != null && produtividade != null && produtividade.signum() > 0) {
            ficha.setPrevisaoColheitaKg(escala(plantas.multiply(produtividade)
                    .multiply(modelo.getFatorAproveitamento())));
        } else {
            ficha.setPrevisaoColheitaKg(null);
        }
        ficha.setPrevisaoAviso(avisos.isEmpty() ? null : String.join(" ", avisos));
    }

    private BigDecimal calcularPlantas(BigDecimal area, ModeloCultivo modelo) {
        if (area == null) return null;

        // Como a largura do canteiro e fixa em 1 m, a area representa o seu
        // comprimento em metros (1 m x comprimento). O arredondamento para
        // baixo garante que nenhuma planta seja contada fora do espacamento.
        BigDecimal linhas = LARGURA_CANTEIRO_M
                .divide(modelo.getEspacamentoLinhasM(), 0, RoundingMode.FLOOR);
        BigDecimal plantasPorLinha = area
                .divide(modelo.getEspacamentoPlantasM(), 0, RoundingMode.FLOOR);
        return linhas.multiply(plantasPorLinha);
    }

    private void preencherSnapshot(FichaCampo ficha, ModeloCultivo modelo) {
        if (modelo == null) {
            ficha.setPrevisaoModeloNome(null);
            ficha.setPrevisaoEspacamentoLinhasM(null);
            ficha.setPrevisaoEspacamentoPlantasM(null);
            ficha.setPrevisaoUnidadeProducao(null);
            ficha.setPrevisaoProdutividadeKgPorPlanta(null);
            ficha.setPrevisaoPesoMedioKgPorUnidade(null);
            ficha.setPrevisaoPesoMedioKgPorPlanta(null);
            return;
        }
        ficha.setPrevisaoModeloNome(modelo.getCultura()
                + (modelo.getVariedade() == null || modelo.getVariedade().isBlank()
                ? "" : " - " + modelo.getVariedade()));
        ficha.setPrevisaoEspacamentoLinhasM(modelo.getEspacamentoLinhasM());
        ficha.setPrevisaoEspacamentoPlantasM(modelo.getEspacamentoPlantasM());
        ficha.setPrevisaoUnidadeProducao(modelo.getUnidadeProducao().name());
        ficha.setPrevisaoProdutividadeKgPorPlanta(modelo.getProdutividadeKgPorPlanta());
        ficha.setPrevisaoPesoMedioKgPorUnidade(modelo.getPesoMedioKgPorUnidade());
        ficha.setPrevisaoPesoMedioKgPorPlanta(modelo.getPesoMedioKgPorPlanta());
    }

    private BigDecimal positivoOuNulo(BigDecimal valor) {
        if (valor == null) return null;
        if (valor.signum() <= 0) {
            throw new IllegalArgumentException("Os valores agronomicos devem ser maiores que zero");
        }
        return valor;
    }

    private BigDecimal escala(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private String formatarEspacamento(BigDecimal espacamentoLinhasM, BigDecimal espacamentoPlantasM) {
        return formatarMetros(espacamentoLinhasM) + " m x " + formatarMetros(espacamentoPlantasM) + " m";
    }

    private String formatarMetros(BigDecimal valor) {
        return valor.stripTrailingZeros().toPlainString().replace('.', ',');
    }

    private void limparResultado(FichaCampo ficha, String aviso) {
        ficha.setPrevisaoPlantas(null);
        ficha.setPrevisaoColheitaKg(null);
        ficha.setPrevisaoAviso(aviso);
    }
}
