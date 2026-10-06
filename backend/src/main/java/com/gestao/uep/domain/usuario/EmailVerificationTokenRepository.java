package com.gestao.uep.domain.usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    Optional<EmailVerificationToken> findTopByUsuarioOrderByCriadoEmDesc(Usuario usuario);

    List<EmailVerificationToken> findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(Usuario usuario);

    long countByUsuarioAndCriadoEmAfter(Usuario usuario, Instant instante);
}
