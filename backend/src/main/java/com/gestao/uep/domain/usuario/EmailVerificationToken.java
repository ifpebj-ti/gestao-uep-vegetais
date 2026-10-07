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
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "email_verification_tokens",
        indexes = {
                @Index(name = "idx_email_token_hash", columnList = "token_hash", unique = true),
                @Index(name = "idx_email_token_usuario", columnList = "usuario_id")
        }
)
@Getter
@NoArgsConstructor
public class EmailVerificationToken {

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

    public EmailVerificationToken(Usuario usuario, String tokenHash, Instant criadoEm, Instant expiraEm) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.criadoEm = criadoEm;
        this.expiraEm = expiraEm;
    }

    public boolean estaAtivo(Instant agora) {
        return usadoEm == null
                && invalidadoEm == null
                && expiraEm.isAfter(agora);
    }

    public void marcarComoUsado(Instant instante) {
        this.usadoEm = instante;
    }

    public void invalidar(Instant instante) {
        this.invalidadoEm = instante;
    }
}
