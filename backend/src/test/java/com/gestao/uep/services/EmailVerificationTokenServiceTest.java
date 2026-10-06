package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.EmailVerificationToken;
import com.gestao.uep.domain.usuario.EmailVerificationTokenRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerificationTokenServiceTest {

    @Mock
    private EmailVerificationTokenRepository repository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Test
    void deveEmitirTokenHashEComValidadeDe24Horas() {
        Usuario usuario = usuarioNaoVerificado();
        when(repository.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(usuario))
                .thenReturn(List.of());

        EmailVerificationTokenService service = new EmailVerificationTokenService(repository, usuarioRepository);
        String token = service.emitir(usuario, false);

        assertThat(token).isNotBlank();
        ArgumentCaptor<EmailVerificationToken> captor =
                ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(repository).save(captor.capture());

        EmailVerificationToken salvo = captor.getValue();
        assertThat(salvo.getUsuario()).isSameAs(usuario);
        assertThat(salvo.getTokenHash()).hasSize(64).isNotEqualTo(token);
        assertThat(salvo.getExpiraEm()).isAfter(salvo.getCriadoEm());
    }

    @Test
    void deveConfirmarTokenValidoEAtivarUsuario() throws Exception {
        Usuario usuario = usuarioNaoVerificado();
        String tokenBruto = "token-valido";
        EmailVerificationToken token = new EmailVerificationToken(
                usuario,
                sha256(tokenBruto),
                Instant.now(),
                Instant.now().plusSeconds(3600)
        );
        when(repository.findByTokenHash(sha256(tokenBruto))).thenReturn(Optional.of(token));

        EmailVerificationTokenService service = new EmailVerificationTokenService(repository, usuarioRepository);
        Usuario confirmado = service.confirmar(tokenBruto);

        assertThat(confirmado).isSameAs(usuario);
        assertThat(usuario.isEnabled()).isTrue();
        assertThat(token.getUsadoEm()).isNotNull();
    }

    @Test
    void deveRejeitarTokenExpirado() throws Exception {
        Usuario usuario = usuarioNaoVerificado();
        String tokenBruto = "token-expirado";
        EmailVerificationToken token = new EmailVerificationToken(
                usuario,
                sha256(tokenBruto),
                Instant.now().minusSeconds(7200),
                Instant.now().minusSeconds(3600)
        );
        when(repository.findByTokenHash(sha256(tokenBruto))).thenReturn(Optional.of(token));

        EmailVerificationTokenService service = new EmailVerificationTokenService(repository, usuarioRepository);

        assertThatThrownBy(() -> service.confirmar(tokenBruto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalido ou expirado");
        assertThat(usuario.isEnabled()).isFalse();
    }

    @Test
    void deveInvalidarTokenAnteriorAoEmitirNovo() {
        Usuario usuario = usuarioNaoVerificado();
        EmailVerificationToken anterior = new EmailVerificationToken(
                usuario,
                "hash-anterior",
                Instant.now().minusSeconds(30),
                Instant.now().plusSeconds(3600)
        );
        when(repository.findByUsuarioAndUsadoEmIsNullAndInvalidadoEmIsNull(usuario))
                .thenReturn(List.of(anterior));

        EmailVerificationTokenService service = new EmailVerificationTokenService(repository, usuarioRepository);
        service.emitir(usuario, false);

        assertThat(anterior.getInvalidadoEm()).isNotNull();
    }

    private Usuario usuarioNaoVerificado() {
        return new Usuario(
                "Maria",
                "maria@discente.ifpe.edu.br",
                "hash",
                UsuarioRole.ALUNO,
                false
        );
    }

    private static String sha256(String valor) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(valor.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexadecimal = new StringBuilder();
        for (byte value : digest) {
            hexadecimal.append(String.format("%02x", value));
        }
        return hexadecimal.toString();
    }
}
