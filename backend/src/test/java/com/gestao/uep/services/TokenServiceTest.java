package com.gestao.uep.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class TokenServiceTest {

    private static final String SECRET = "segredo-de-teste-com-tamanho-suficiente";

    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService();
        ReflectionTestUtils.setField(tokenService, "secret", SECRET);
    }

    @Test
    void deveGerarTokenComSubjectDoUsuario() {
        Usuario usuario = usuarioComum();

        String token = tokenService.gerarToken(usuario);

        assertThat(tokenService.validarToken(token)).isEqualTo(usuario.getEmail());
        assertThat(JWT.decode(token).getClaim("nome").asString())
                .isEqualTo(usuario.getNome());
        assertThat(JWT.decode(token).getClaim("role").asString())
                .isEqualTo(UsuarioRole.USUARIO.name());
    }

    @Test
    void deveRejeitarTokenAssinadoComOutroSegredo() {
        String token = JWT.create()
                .withIssuer("gestao-uep-api")
                .withSubject("maria@ifpe.edu.br")
                .withExpiresAt(Instant.now().plusSeconds(60))
                .sign(Algorithm.HMAC256("outro-segredo"));

        assertThat(tokenService.validarToken(token)).isEmpty();
    }

    @Test
    void deveRejeitarTokenExpirado() {
        String token = JWT.create()
                .withIssuer("gestao-uep-api")
                .withSubject("maria@ifpe.edu.br")
                .withExpiresAt(Instant.now().minusSeconds(60))
                .sign(Algorithm.HMAC256(SECRET));

        assertThat(tokenService.validarToken(token)).isEmpty();
    }

    @Test
    void deveRejeitarTokenComIssuerInvalido() {
        String token = JWT.create()
                .withIssuer("issuer-invalido")
                .withSubject("maria@ifpe.edu.br")
                .withExpiresAt(Instant.now().plusSeconds(60))
                .sign(Algorithm.HMAC256(SECRET));

        assertThat(tokenService.validarToken(token)).isEmpty();
    }

    private Usuario usuarioComum() {
        return new Usuario(
                "Maria",
                "maria@ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );
    }
}
