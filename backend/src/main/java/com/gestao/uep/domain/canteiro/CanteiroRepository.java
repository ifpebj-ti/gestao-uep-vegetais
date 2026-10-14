package com.gestao.uep.domain.canteiro;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CanteiroRepository extends JpaRepository<Canteiro, String> {

    List<Canteiro> findAllByOrderByCodigoAsc();
}
