package com.gestao.uep.domain.cultivo;

import com.gestao.uep.domain.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "modelos_cultivo")
@Getter
@Setter
@NoArgsConstructor
public class ModeloCultivo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String cultura;

    @Column(length = 120)
    private String variedade;

    @Column(name = "espacamento_linhas_m", nullable = false, precision = 8, scale = 4)
    private BigDecimal espacamentoLinhasM;

    @Column(name = "espacamento_plantas_m", nullable = false, precision = 8, scale = 4)
    private BigDecimal espacamentoPlantasM;

    @Column(name = "produtividade_kg_por_planta", precision = 12, scale = 4)
    private BigDecimal produtividadeKgPorPlanta;

    @Column(name = "peso_medio_kg_por_unidade", precision = 12, scale = 4)
    private BigDecimal pesoMedioKgPorUnidade;

    @Column(name = "peso_medio_kg_por_planta", nullable = false, precision = 12, scale = 4)
    private BigDecimal pesoMedioKgPorPlanta;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidade_producao", nullable = false, length = 20)
    private UnidadeProducao unidadeProducao;

    @Column(name = "fator_aproveitamento", nullable = false, precision = 5, scale = 4)
    private BigDecimal fatorAproveitamento = BigDecimal.ONE;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atualizado_por")
    private Usuario atualizadoPor;

    @PrePersist
    private void aoCriar() {
        Instant agora = Instant.now();
        criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    private void aoAtualizar() {
        atualizadoEm = Instant.now();
    }
}
