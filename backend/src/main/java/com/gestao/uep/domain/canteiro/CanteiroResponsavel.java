package com.gestao.uep.domain.canteiro;

import com.gestao.uep.domain.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(
        name = "canteiro_responsaveis",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_canteiro_responsavel_usuario", columnNames = {"canteiro_id", "usuario_id"}),
                @UniqueConstraint(name = "uk_canteiro_responsavel_ordem", columnNames = {"canteiro_id", "ordem"})
        }
)
@Getter
@NoArgsConstructor
public class CanteiroResponsavel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "canteiro_id", nullable = false)
    private Canteiro canteiro;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private short ordem;

    public CanteiroResponsavel(Canteiro canteiro, Usuario usuario, short ordem) {
        this.canteiro = canteiro;
        this.usuario = usuario;
        this.ordem = ordem;
    }
}
