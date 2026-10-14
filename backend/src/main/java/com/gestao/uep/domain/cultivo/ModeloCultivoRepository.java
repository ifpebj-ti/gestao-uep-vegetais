package com.gestao.uep.domain.cultivo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModeloCultivoRepository extends JpaRepository<ModeloCultivo, UUID> {

    List<ModeloCultivo> findAllByAtivoTrueOrderByCulturaAscVariedadeAsc();
}
