package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.CanteiroResponsavelRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CanteiroAuthorizationServiceTest {

    @Mock
    private CanteiroResponsavelRepository responsavelRepository;

    @Test
    void professorPodeEditarQualquerCanteiro() {
        Usuario professor = usuario("professor@ifpe.edu.br", UsuarioRole.PROFESSOR);
        CanteiroAuthorizationService service = new CanteiroAuthorizationService(responsavelRepository);

        assertThat(service.podeEditar("c-01", professor)).isTrue();
    }

    @Test
    void alunoResponsavelPodeEditarSeuCanteiro() {
        Usuario aluno = usuario("aluno@discente.ifpe.edu.br", UsuarioRole.ALUNO);
        when(responsavelRepository.existsByCanteiroIdAndUsuarioId("c-01", aluno.getId()))
                .thenReturn(true);
        CanteiroAuthorizationService service = new CanteiroAuthorizationService(responsavelRepository);

        assertThat(service.podeEditar("c-01", aluno)).isTrue();
    }

    @Test
    void alunoNaoResponsavelNaoPodeEditarNemLer() {
        Usuario aluno = usuario("aluno@discente.ifpe.edu.br", UsuarioRole.ALUNO);
        when(responsavelRepository.existsByCanteiroIdAndUsuarioId("c-01", aluno.getId()))
                .thenReturn(false);
        CanteiroAuthorizationService service = new CanteiroAuthorizationService(responsavelRepository);

        assertThat(service.podeEditar("c-01", aluno)).isFalse();
        assertThatThrownBy(() -> service.exigirLeitura("c-01", aluno))
                .isInstanceOf(AccessDeniedException.class);
    }

    private Usuario usuario(String email, UsuarioRole role) {
        Usuario usuario = new Usuario("Pessoa", email, "hash", role);
        try {
            var campoId = Usuario.class.getDeclaredField("id");
            campoId.setAccessible(true);
            campoId.set(usuario, UUID.randomUUID());
        } catch (ReflectiveOperationException erro) {
            throw new AssertionError(erro);
        }
        return usuario;
    }
}
