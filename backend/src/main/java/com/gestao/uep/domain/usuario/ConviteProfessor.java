package com.gestao.uep.domain.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "convites_professor", indexes = {
        @Index(name = "idx_convite_professor_usuario", columnList = "usuario_id")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConviteProfessor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant criadoEm;

    @Column(nullable = false)
    private Instant expiraEm;

    private Instant usadoEm;
    private Instant invalidadoEm;

    public ConviteProfessor(Usuario usuario, String tokenHash, Instant criadoEm, Instant expiraEm) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.criadoEm = criadoEm;
        this.expiraEm = expiraEm;
    }

    public boolean estaAtivo(Instant agora) {
        return usadoEm == null && invalidadoEm == null && expiraEm.isAfter(agora);
    }

    public void marcarComoUsado(Instant agora) {
        this.usadoEm = agora;
    }

    public void invalidar(Instant agora) {
        this.invalidadoEm = agora;
    }
}
