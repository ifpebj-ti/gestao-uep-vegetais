package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.AlteracaoFichaCampo;
import com.gestao.uep.domain.canteiro.AlteracaoFichaCampoRepository;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.canteiro.HistoricoFichaCampo;
import com.gestao.uep.domain.canteiro.HistoricoFichaCampoRepository;
import com.gestao.uep.domain.usuario.Usuario;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class FichaCampoHistoricoService {

    private final HistoricoFichaCampoRepository historicoRepository;
    private final AlteracaoFichaCampoRepository alteracaoRepository;

    public FichaCampoHistoricoService(
            HistoricoFichaCampoRepository historicoRepository,
            AlteracaoFichaCampoRepository alteracaoRepository
    ) {
        this.historicoRepository = historicoRepository;
        this.alteracaoRepository = alteracaoRepository;
    }

    public Map<String, Object> snapshot(FichaCampo ficha) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("grupo", ficha.getGrupo());
        snapshot.put("turma", ficha.getTurma());
        snapshot.put("canteiroCodigo", ficha.getCanteiroCodigo());
        snapshot.put("cultura", ficha.getCultura());
        snapshot.put("modeloCultivoId", ficha.getModeloCultivo() == null ? null : ficha.getModeloCultivo().getId());
        snapshot.put("dataPlantio", ficha.getDataPlantio());
        snapshot.put("espacamento", ficha.getEspacamento());
        snapshot.put("plantasPorCanteiro", ficha.getPlantasPorCanteiro());
        snapshot.put("plantasPorHa", ficha.getPlantasPorHa());
        snapshot.put("previsaoColheita", ficha.getPrevisaoColheita());
        snapshot.put("adubacao", ficha.getAdubacao());
        snapshot.put("controlePragas", ficha.getControlePragas());
        snapshot.put("limpaCapina", ficha.getLimpaCapina());
        snapshot.put("obs", ficha.getObs());
        snapshot.put("statusEntrega", ficha.getStatusEntrega());
        snapshot.put("dataEntrega", ficha.getDataEntrega());
        snapshot.put("vistoAssinado", ficha.isVistoAssinado());
        snapshot.put("dataVisto", ficha.getDataVisto());
        snapshot.put("parecer", ficha.getParecer());
        snapshot.put("areaCanteiroM2", ficha.getAreaCanteiroM2());
        snapshot.put("plantasPorCanteiroValor", ficha.getPlantasPorCanteiroValor());
        snapshot.put("plantasPorHaValor", ficha.getPlantasPorHaValor());
        snapshot.put("previsaoPlantas", ficha.getPrevisaoPlantas());
        snapshot.put("previsaoColheitaKg", ficha.getPrevisaoColheitaKg());
        snapshot.put("previsaoFatorAproveitamento", ficha.getPrevisaoFatorAproveitamento());
        snapshot.put("previsaoAviso", ficha.getPrevisaoAviso());
        snapshot.put("previsaoModeloNome", ficha.getPrevisaoModeloNome());
        snapshot.put("previsaoEspacamentoLinhasM", ficha.getPrevisaoEspacamentoLinhasM());
        snapshot.put("previsaoEspacamentoPlantasM", ficha.getPrevisaoEspacamentoPlantasM());
        snapshot.put("previsaoUnidadeProducao", ficha.getPrevisaoUnidadeProducao());
        snapshot.put("previsaoProdutividadeKgPorPlanta", ficha.getPrevisaoProdutividadeKgPorPlanta());
        snapshot.put("previsaoPesoMedioKgPorUnidade", ficha.getPrevisaoPesoMedioKgPorUnidade());
        snapshot.put("previsaoPesoMedioKgPorPlanta", ficha.getPrevisaoPesoMedioKgPorPlanta());
        return snapshot;
    }

    public void registrarDiferencas(Map<String, Object> snapshot, FichaCampo ficha, Usuario usuario) {
        Map<String, Object> atual = snapshot(ficha);
        var diferencas = snapshot.entrySet().stream()
                .filter(entry -> !valoresIguais(entry.getValue(), atual.get(entry.getKey())))
                .map(entry -> new AlteracaoFichaCampo(
                        entry.getKey(), valorComoTexto(entry.getValue()), valorComoTexto(atual.get(entry.getKey()))))
                .toList();

        if (diferencas.isEmpty()) {
            return;
        }

        HistoricoFichaCampo evento = new HistoricoFichaCampo();
        evento.setCanteiro(ficha.getCanteiro());
        evento.setUsuario(usuario);
        evento.setAutorNome(usuario == null ? null : usuario.getNome());
        evento.setAutorPapel(usuario == null || usuario.getRole() == null ? null : usuario.getRole().name());
        evento.setDataHora(Instant.now());
        historicoRepository.save(evento);
        diferencas.forEach(evento::adicionarAlteracao);
        alteracaoRepository.saveAll(evento.getAlteracoes());
    }

    private String valorComoTexto(Object valor) {
        if (valor instanceof BigDecimal decimal) {
            return decimal.toPlainString();
        }
        return valor == null ? null : valor.toString();
    }

    private boolean valoresIguais(Object anterior, Object atual) {
        if (anterior instanceof BigDecimal anteriorDecimal && atual instanceof BigDecimal atualDecimal) {
            return anteriorDecimal.compareTo(atualDecimal) == 0;
        }
        return Objects.equals(anterior, atual);
    }
}
