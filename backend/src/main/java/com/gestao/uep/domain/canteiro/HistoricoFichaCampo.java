package com.gestao.uep.domain.canteiro;

import com.gestao.uep.domain.usuario.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "historico_fichas_campo")
@Getter
@Setter
@NoArgsConstructor
public class HistoricoFichaCampo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "canteiro_id", nullable = false)
    private Canteiro canteiro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "autor_nome", length = 255)
    private String autorNome;

    @Column(name = "autor_papel", length = 32)
    private String autorPapel;

    @Column(name = "data_hora", nullable = false)
    private Instant dataHora;

    @OneToMany(mappedBy = "evento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AlteracaoFichaCampo> alteracoes = new ArrayList<>();

    public void adicionarAlteracao(AlteracaoFichaCampo alteracao) {
        alteracao.setEvento(this);
        alteracoes.add(alteracao);
    }
}
