package com.gestao.uep.domain.usuario.dto;

import java.time.Instant;
import java.util.UUID;

public record ProfessorAdminDTO(
        UUID id,
        String nome,
        String email,
        String uep,
        Instant criadoEm,
        boolean ativo,
        boolean emailVerificado,
        boolean convitePendente
) {
}
