package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutorizacaoServiceTest {

    @Mock
    private UsuarioRepository repository;

    @Test
    void deveCarregarUsuarioPeloEmail() {
        Usuario usuario = new Usuario(
                "Maria",
                "maria@ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );
        when(repository.findByEmail(usuario.getEmail())).thenReturn(usuario);

        AutorizacaoService service = new AutorizacaoService(repository);

        assertThat(service.loadUserByUsername(usuario.getEmail()))
                .isSameAs(usuario);
    }

    @Test
    void deveLancarExcecaoQuandoUsuarioNaoExiste() {
        when(repository.findByEmail("inexistente@ifpe.edu.br")).thenReturn(null);

        AutorizacaoService service = new AutorizacaoService(repository);

        assertThatThrownBy(() -> service.loadUserByUsername("inexistente@ifpe.edu.br"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Usuário não encontrado");
    }
}
