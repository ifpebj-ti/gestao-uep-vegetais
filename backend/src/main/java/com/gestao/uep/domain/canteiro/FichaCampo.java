package com.gestao.uep.domain.canteiro;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.cultivo.ModeloCultivo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "fichas_campo")
@Getter
@Setter
@NoArgsConstructor
public class FichaCampo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "canteiro_id", nullable = false, unique = true)
    private Canteiro canteiro;

    @Column(columnDefinition = "TEXT")
    private String grupo;

    @Column(name = "canteiro_codigo", length = 32)
    private String canteiroCodigo;

    @Column(columnDefinition = "TEXT")
    private String cultura;

    @Column(name = "data_plantio", length = 32)
    private String dataPlantio;

    @Column(columnDefinition = "TEXT")
    private String espacamento;

    @Column(name = "plantas_por_canteiro", columnDefinition = "TEXT")
    private String plantasPorCanteiro;

    @Column(name = "plantas_por_ha", columnDefinition = "TEXT")
    private String plantasPorHa;

    @Column(name = "previsao_colheita", length = 32)
    private String previsaoColheita;

    @Column(columnDefinition = "TEXT")
    private String adubacao;

    @Column(name = "controle_pragas", columnDefinition = "TEXT")
    private String controlePragas;

    @Column(name = "limpa_capina", columnDefinition = "TEXT")
    private String limpaCapina;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String obs;

    @Column(name = "status_entrega", nullable = false, length = 32)
    private String statusEntrega = "pendente";

    @Column(name = "data_entrega", length = 32)
    private String dataEntrega;

    @Column(name = "visto_assinado", nullable = false)
    private boolean vistoAssinado;

    @Column(name = "data_visto", length = 32)
    private String dataVisto;

    @Column(columnDefinition = "TEXT")
    private String parecer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_cultivo_id")
    private ModeloCultivo modeloCultivo;

    @Column(name = "area_canteiro_m2", precision = 10, scale = 2)
    private BigDecimal areaCanteiroM2;

    @Column(name = "plantas_por_canteiro_valor", precision = 12, scale = 2)
    private BigDecimal plantasPorCanteiroValor;

    @Column(name = "plantas_por_ha_valor", precision = 12, scale = 2)
    private BigDecimal plantasPorHaValor;

    @Column(name = "previsao_plantas", precision = 12, scale = 2)
    private BigDecimal previsaoPlantas;

    @Column(name = "previsao_colheita_kg", precision = 12, scale = 2)
    private BigDecimal previsaoColheitaKg;

    @Column(name = "previsao_fator_aproveitamento", precision = 5, scale = 4)
    private BigDecimal previsaoFatorAproveitamento;

    @Column(name = "previsao_calculada_em")
    private Instant previsaoCalculadaEm;

    @Column(name = "previsao_aviso", columnDefinition = "TEXT")
    private String previsaoAviso;

    @Column(name = "previsao_modelo_nome", length = 250)
    private String previsaoModeloNome;

    @Column(name = "previsao_espacamento_linhas_m", precision = 8, scale = 4)
    private BigDecimal previsaoEspacamentoLinhasM;

    @Column(name = "previsao_espacamento_plantas_m", precision = 8, scale = 4)
    private BigDecimal previsaoEspacamentoPlantasM;

    @Column(name = "previsao_unidade_producao", length = 20)
    private String previsaoUnidadeProducao;

    @Column(name = "previsao_produtividade_kg_por_planta", precision = 12, scale = 4)
    private BigDecimal previsaoProdutividadeKgPorPlanta;

    @Column(name = "previsao_peso_medio_kg_por_unidade", precision = 12, scale = 4)
    private BigDecimal previsaoPesoMedioKgPorUnidade;

    @Column(name = "previsao_peso_medio_kg_por_planta", precision = 12, scale = 4)
    private BigDecimal previsaoPesoMedioKgPorPlanta;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    public FichaCampo(Canteiro canteiro) {
        this.canteiro = canteiro;
        this.canteiroCodigo = canteiro.getCodigo();
        this.statusEntrega = "pendente";
    }

    @PrePersist
    @PreUpdate
    private void atualizarData() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
