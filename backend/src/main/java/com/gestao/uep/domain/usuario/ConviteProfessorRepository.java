package com.gestao.uep.domain.usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConviteProfessorRepository extends JpaRepository<ConviteProfessor, UUID> {

    @Query("select c.usuario.id from ConviteProfessor c where c.tokenHash = :hash")
    Optional<UUID> findUsuarioIdByTokenHash(@Param("hash") String hash);

    Optional<ConviteProfessor> findByTokenHash(String tokenHash);

    List<ConviteProfessor> findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(Usuario usuario);

    boolean existsByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(Usuario usuario);
}
