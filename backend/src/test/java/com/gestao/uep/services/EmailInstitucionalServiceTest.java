package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailInstitucionalServiceTest {

    private final EmailInstitucionalService service = new EmailInstitucionalService();

    @Test
    void deveClassificarAlunoPeloDominioExato() {
        assertThat(service.identificarPapel("  Maria@DISCENTE.IFPE.EDU.BR "))
                .contains(UsuarioRole.ALUNO);
    }

    @Test
    void deveClassificarProfessorPeloDominioExato() {
        assertThat(service.identificarPapel("professor@belojardim.ifpe.edu.br"))
                .contains(UsuarioRole.PROFESSOR);
    }

    @Test
    void deveRejeitarDominioGenericoEdominioExterno() {
        assertThat(service.identificarPapel("usuario@ifpe.edu.br")).isEmpty();
        assertThat(service.identificarPapel("usuario@gmail.com")).isEmpty();
    }

    @Test
    void deveConferirDominioHospedadoComDominioDoEmail() {
        assertThat(service.dominioHospedadoCorresponde(
                "aluno@discente.ifpe.edu.br",
                "DISCENTE.IFPE.EDU.BR"
        )).isTrue();
        assertThat(service.dominioHospedadoCorresponde(
                "aluno@discente.ifpe.edu.br",
                "gmail.com"
        )).isFalse();
    }
}
