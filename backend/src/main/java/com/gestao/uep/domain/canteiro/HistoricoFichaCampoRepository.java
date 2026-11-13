package com.gestao.uep.domain.canteiro;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HistoricoFichaCampoRepository extends JpaRepository<HistoricoFichaCampo, UUID> {

    List<HistoricoFichaCampo> findAllByCanteiroIdOrderByDataHoraDesc(String canteiroId);
}
