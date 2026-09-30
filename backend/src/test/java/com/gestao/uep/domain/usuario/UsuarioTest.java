package com.gestao.uep.domain.usuario;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UsuarioTest {

    @Test
    void deveConcederApenasPermissaoDeUsuarioParaUsuarioComum() {
        Usuario usuario = new Usuario(
                "Maria",
                "maria@ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );

        assertThat(usuario.getAuthorities())
                .extracting(authority -> authority.getAuthority())
                .containsExactly("ROLE_USUARIO");
    }

    @Test
    void deveConcederPermissoesDeAdministradorEUsuarioParaAdministrador() {
        Usuario usuario = new Usuario(
                "Admin",
                "admin@ifpe.edu.br",
                "hash",
                UsuarioRole.ADMIN
        );

        assertThat(usuario.getAuthorities())
                .extracting(authority -> authority.getAuthority())
                .containsExactly("ROLE_ADMIN", "ROLE_USUARIO");
    }

    @Test
    void deveUsarEmailComoNomeDeUsuario() {
        Usuario usuario = new Usuario(
                "Maria",
                "maria@ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );

        assertThat(usuario.getUsername()).isEqualTo("maria@ifpe.edu.br");
        assertThat(usuario.getPassword()).isEqualTo("hash");
    }
}
