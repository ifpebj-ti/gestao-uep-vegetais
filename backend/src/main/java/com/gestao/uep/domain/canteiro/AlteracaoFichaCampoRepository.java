package com.gestao.uep.domain.canteiro;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AlteracaoFichaCampoRepository extends JpaRepository<AlteracaoFichaCampo, UUID> {
}
