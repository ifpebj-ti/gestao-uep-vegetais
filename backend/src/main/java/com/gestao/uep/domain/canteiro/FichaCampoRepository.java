package com.gestao.uep.domain.canteiro;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FichaCampoRepository extends JpaRepository<FichaCampo, UUID> {

    Optional<FichaCampo> findByCanteiroId(String canteiroId);

    List<FichaCampo> findAllByCanteiroIdIn(Collection<String> canteiroIds);
}
