package com.gestao.uep.domain.canteiro;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CanteiroResponsavelRepository extends JpaRepository<CanteiroResponsavel, UUID> {

    List<CanteiroResponsavel> findByCanteiroIdOrderByOrdem(String canteiroId);

    boolean existsByCanteiroIdAndUsuarioId(String canteiroId, UUID usuarioId);

    void deleteByCanteiroId(String canteiroId);

    @Query("select cr.canteiro.id from CanteiroResponsavel cr where cr.usuario.id = :usuarioId order by cr.canteiro.codigo")
    List<String> findCanteiroIdsByUsuarioId(@Param("usuarioId") UUID usuarioId);
}
